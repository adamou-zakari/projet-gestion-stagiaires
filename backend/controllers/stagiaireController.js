const Stagiaire = require('../models/Stagiaire');
const db = require('../config/db');

async function logAction(action, userId, details, ip) {
    try {
        await db.query(
            'INSERT INTO logs (action, utilisateur_id, details, ip_adresse) VALUES (?, ?, ?, ?)',
            [action, userId, details, ip || 'inconnue']
        );
    } catch (e) { console.warn('Log non enregistré:', e.message); }
}

const getAllStagiaires = async (req, res) => {
    try {
        res.json(await Stagiaire.findAllWithPresence());
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getStagiaireById = async (req, res) => {
    try {
        const s = await Stagiaire.findById(req.params.id);
        if (!s) return res.status(404).json({ message: 'Stagiaire non trouvé' });
        res.json({ ...s, est_present: await Stagiaire.isPresent(req.params.id) });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const createStagiaire = async (req, res) => {
    try {
        const { nom, prenom, email, telephone, date_debut, date_fin, direction_id } = req.body;
        if (!nom || !prenom) return res.status(400).json({ message: 'Nom et prénom obligatoires' });

        if (email) {
            const [ex] = await db.query('SELECT id FROM stagiaires WHERE email = ?', [email]);
            if (ex.length > 0) return res.status(400).json({ message: `Email "${email}" déjà utilisé` });
        }

        const id = await Stagiaire.create({ nom, prenom, email: email||null, telephone: telephone||null, date_debut: date_debut||null, date_fin: date_fin||null, direction_id: direction_id||null });
        await logAction('AJOUT_STAGIAIRE', req.user.id, `Stagiaire ${nom} ${prenom} ajouté`, req.ip);
        res.status(201).json({ message: 'Stagiaire créé avec succès', id });

    } catch (e) {
        console.error(e);
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email déjà utilisé' });
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const updateStagiaire = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, telephone, date_debut, date_fin, direction_id } = req.body;

        const s = await Stagiaire.findById(id);
        if (!s) return res.status(404).json({ message: 'Stagiaire non trouvé' });

        if (email && email !== s.email) {
            const [ex] = await db.query('SELECT id FROM stagiaires WHERE email = ? AND id != ?', [email, id]);
            if (ex.length > 0) return res.status(400).json({ message: `Email "${email}" déjà utilisé` });
        }

        const updated = await Stagiaire.update(id, {
            nom:          nom          || s.nom,
            prenom:       prenom       || s.prenom,
            email:        email        || s.email,
            telephone:    telephone    || null,
            date_debut:   date_debut   || s.date_debut,
            date_fin:     date_fin     || s.date_fin,
            direction_id: direction_id !== undefined ? (direction_id || null) : s.direction_id
        });

        if (updated) {
            await logAction('MODIFICATION_STAGIAIRE', req.user.id, `Stagiaire ID ${id} modifié`, req.ip);
            res.json({ message: 'Stagiaire modifié avec succès' });
        } else {
            res.status(400).json({ message: 'Aucune modification effectuée' });
        }

    } catch (e) {
        console.error(e);
        if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email déjà utilisé' });
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─── Suppression en cascade (admin) ──────────────────────────────────────────
const deleteStagiaire = async (req, res) => {
    try {
        const { id } = req.params;

        const s = await Stagiaire.findById(id);
        if (!s) return res.status(404).json({ message: 'Stagiaire non trouvé' });

        // Supprimer les pointages associés d'abord
        const [pointages] = await db.query(
            'SELECT COUNT(*) as total FROM pointages_stagiaires WHERE stagiaire_id = ?', [id]
        );
        if (pointages[0].total > 0) {
            await db.query('DELETE FROM pointages_stagiaires WHERE stagiaire_id = ?', [id]);
        }

        // Puis supprimer le stagiaire
        const deleted = await Stagiaire.delete(id);
        if (deleted) {
            await logAction(
                'SUPPRESSION_STAGIAIRE',
                req.user.id,
                `Stagiaire ${s.nom} ${s.prenom} supprimé (${pointages[0].total} pointage(s) supprimé(s))`,
                req.ip
            );
            res.json({ message: `Stagiaire supprimé avec succès (${pointages[0].total} pointage(s) supprimé(s))` });
        } else {
            res.status(400).json({ message: 'Erreur lors de la suppression' });
        }

    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const enregistrerEntreeStagiaire = async (req, res) => {
    try {
        const { id } = req.params;
        const s = await Stagiaire.findById(id);
        if (!s) return res.status(404).json({ message: 'Stagiaire non trouvé' });
        if (await Stagiaire.isPresent(id)) return res.status(400).json({ message: 'Stagiaire déjà présent' });
        await Stagiaire.enregistrerEntree(id, req.user.id);
        await logAction('ENTREE_STAGIAIRE', req.user.id, `${s.nom} ${s.prenom} entrée`, req.ip);
        res.json({ message: 'Entrée enregistrée', est_present: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const enregistrerSortieStagiaire = async (req, res) => {
    try {
        const { id } = req.params;
        const s = await Stagiaire.findById(id);
        if (!s) return res.status(404).json({ message: 'Stagiaire non trouvé' });
        if (!await Stagiaire.isPresent(id)) return res.status(400).json({ message: 'Stagiaire non présent' });
        await Stagiaire.enregistrerSortie(id, req.user.id);
        await logAction('SORTIE_STAGIAIRE', req.user.id, `${s.nom} ${s.prenom} sortie`, req.ip);
        res.json({ message: 'Sortie enregistrée', est_present: false });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getHistoriquePointages = async (req, res) => {
    try {
        const { id } = req.params;
        const { dateDebut, dateFin } = req.query;
        const s = await Stagiaire.findById(id);
        if (!s) return res.status(404).json({ message: 'Stagiaire non trouvé' });
        res.json(await Stagiaire.getHistoriquePointages(id, dateDebut, dateFin));
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

const getAllStagiairesWithPresence = async (req, res) => {
    try {
        res.json(await Stagiaire.findAllWithPresence());
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

module.exports = {
    getAllStagiaires,
    getStagiaireById,
    createStagiaire,
    updateStagiaire,
    deleteStagiaire,
    enregistrerEntreeStagiaire,
    enregistrerSortieStagiaire,
    getHistoriquePointages,
    getAllStagiairesWithPresence
};