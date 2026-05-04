const Stagiaire = require('../models/Stagiaire');
const db = require('../config/db');

// Fonction utilitaire pour logger
async function logAction(action, userId, details, ip) {
    try {
        await db.query(
            'INSERT INTO logs (action, utilisateur_id, details, ip_adresse) VALUES (?, ?, ?, ?)',
            [action, userId, details, ip || 'inconnue']
        );
    } catch (logError) {
        console.warn('⚠️ Log non enregistré:', logError.message);
    }
}

// ─── Récupérer tous les stagiaires ───────────────────────────────────────────
const getAllStagiaires = async (req, res) => {
    try {
        const stagiaires = await Stagiaire.findAllWithPresence();
        res.json(stagiaires);
    } catch (error) {
        console.error('getAllStagiaires:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des stagiaires' });
    }
};

// ─── Récupérer un stagiaire par ID ───────────────────────────────────────────
const getStagiaireById = async (req, res) => {
    try {
        const stagiaire = await Stagiaire.findById(req.params.id);
        if (!stagiaire) {
            return res.status(404).json({ message: 'Stagiaire non trouvé' });
        }
        const estPresent = await Stagiaire.isPresent(req.params.id);
        res.json({ ...stagiaire, est_present: estPresent });
    } catch (error) {
        console.error('getStagiaireById:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération du stagiaire' });
    }
};

// ─── Créer un stagiaire ───────────────────────────────────────────────────────
const createStagiaire = async (req, res) => {
    try {
        // ✅ FIX : direction_id extrait du body
        const { nom, prenom, email, telephone, date_debut, date_fin, direction_id } = req.body;

        if (!nom || !prenom) {
            return res.status(400).json({
                message: 'Les champs nom et prénom sont obligatoires'
            });
        }

        // Email optionnel mais unique si fourni
        if (email) {
            const [existing] = await db.query(
                'SELECT id FROM stagiaires WHERE email = ?', [email]
            );
            if (existing.length > 0) {
                return res.status(400).json({
                    message: `Un stagiaire avec l'email "${email}" existe déjà`
                });
            }
        }

        // ✅ FIX : direction_id passé à Stagiaire.create()
        const stagiaireId = await Stagiaire.create({
            nom,
            prenom,
            email:        email        || null,
            telephone:    telephone    || null,
            date_debut:   date_debut   || null,
            date_fin:     date_fin     || null,
            direction_id: direction_id || null
        });

        await logAction(
            'AJOUT_STAGIAIRE',
            req.user.id,
            `Stagiaire ${nom} ${prenom} ajouté`,
            req.ip
        );

        res.status(201).json({ message: 'Stagiaire créé avec succès', id: stagiaireId });

    } catch (error) {
        console.error('createStagiaire:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Un stagiaire avec cet email existe déjà' });
        }
        res.status(500).json({ message: 'Erreur lors de la création du stagiaire' });
    }
};

// ─── Modifier un stagiaire ────────────────────────────────────────────────────
const updateStagiaire = async (req, res) => {
    try {
        const { id } = req.params;
        // ✅ FIX : direction_id extrait du body
        const { nom, prenom, email, telephone, date_debut, date_fin, direction_id } = req.body;

        const existingStagiaire = await Stagiaire.findById(id);
        if (!existingStagiaire) {
            return res.status(404).json({ message: 'Stagiaire non trouvé' });
        }

        if (email && email !== existingStagiaire.email) {
            const [emailCheck] = await db.query(
                'SELECT id FROM stagiaires WHERE email = ? AND id != ?', [email, id]
            );
            if (emailCheck.length > 0) {
                return res.status(400).json({
                    message: `L'email "${email}" est déjà utilisé par un autre stagiaire`
                });
            }
        }

        // ✅ FIX : direction_id passé à Stagiaire.update()
        const updated = await Stagiaire.update(id, {
            nom:          nom          || existingStagiaire.nom,
            prenom:       prenom       || existingStagiaire.prenom,
            email:        email        || existingStagiaire.email,
            telephone:    telephone    || null,
            date_debut:   date_debut   || existingStagiaire.date_debut,
            date_fin:     date_fin     || existingStagiaire.date_fin,
            direction_id: direction_id !== undefined ? (direction_id || null) : existingStagiaire.direction_id
        });

        if (updated) {
            await logAction(
                'MODIFICATION_STAGIAIRE',
                req.user.id,
                `Stagiaire ID ${id} modifié`,
                req.ip
            );
            res.json({ message: 'Stagiaire modifié avec succès' });
        } else {
            res.status(400).json({ message: 'Aucune modification effectuée' });
        }

    } catch (error) {
        console.error('updateStagiaire:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        }
        res.status(500).json({ message: 'Erreur lors de la modification du stagiaire' });
    }
};

// ─── Supprimer un stagiaire ───────────────────────────────────────────────────
const deleteStagiaire = async (req, res) => {
    try {
        const { id } = req.params;

        const existingStagiaire = await Stagiaire.findById(id);
        if (!existingStagiaire) {
            return res.status(404).json({ message: 'Stagiaire non trouvé' });
        }

        const [pointages] = await db.query(
            'SELECT COUNT(*) as total FROM pointages_stagiaires WHERE stagiaire_id = ?', [id]
        );
        if (pointages[0].total > 0) {
            return res.status(400).json({
                message: `Impossible de supprimer : ce stagiaire a ${pointages[0].total} pointage(s) associé(s)`
            });
        }

        const deleted = await Stagiaire.delete(id);

        if (deleted) {
            await logAction(
                'SUPPRESSION_STAGIAIRE',
                req.user.id,
                `Stagiaire ${existingStagiaire.nom} ${existingStagiaire.prenom} supprimé`,
                req.ip
            );
            res.json({ message: 'Stagiaire supprimé avec succès' });
        } else {
            res.status(400).json({ message: 'Erreur lors de la suppression' });
        }

    } catch (error) {
        console.error('deleteStagiaire:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression du stagiaire' });
    }
};

// ─── Enregistrer l'entrée d'un stagiaire ─────────────────────────────────────
const enregistrerEntreeStagiaire = async (req, res) => {
    try {
        const { id } = req.params;
        const stagiaire = await Stagiaire.findById(id);
        if (!stagiaire) return res.status(404).json({ message: 'Stagiaire non trouvé' });

        const estPresent = await Stagiaire.isPresent(id);
        if (estPresent) return res.status(400).json({ message: 'Ce stagiaire est déjà présent' });

        await Stagiaire.enregistrerEntree(id, req.user.id);

        await logAction(
            'ENTREE_STAGIAIRE',
            req.user.id,
            `Stagiaire ${stagiaire.nom} ${stagiaire.prenom} a pointé son entrée`,
            req.ip
        );

        res.json({ message: 'Entrée enregistrée avec succès', est_present: true });
    } catch (error) {
        console.error('enregistrerEntreeStagiaire:', error);
        res.status(500).json({ message: "Erreur lors de l'enregistrement de l'entrée" });
    }
};

// ─── Enregistrer la sortie d'un stagiaire ────────────────────────────────────
const enregistrerSortieStagiaire = async (req, res) => {
    try {
        const { id } = req.params;
        const stagiaire = await Stagiaire.findById(id);
        if (!stagiaire) return res.status(404).json({ message: 'Stagiaire non trouvé' });

        const estPresent = await Stagiaire.isPresent(id);
        if (!estPresent) return res.status(400).json({ message: "Ce stagiaire n'est pas présent" });

        await Stagiaire.enregistrerSortie(id, req.user.id);

        await logAction(
            'SORTIE_STAGIAIRE',
            req.user.id,
            `Stagiaire ${stagiaire.nom} ${stagiaire.prenom} a pointé sa sortie`,
            req.ip
        );

        res.json({ message: 'Sortie enregistrée avec succès', est_present: false });
    } catch (error) {
        console.error('enregistrerSortieStagiaire:', error);
        res.status(500).json({ message: "Erreur lors de l'enregistrement de la sortie" });
    }
};

// ─── Historique des pointages d'un stagiaire ─────────────────────────────────
const getHistoriquePointages = async (req, res) => {
    try {
        const { id } = req.params;
        const { dateDebut, dateFin } = req.query;
        const stagiaire = await Stagiaire.findById(id);
        if (!stagiaire) return res.status(404).json({ message: 'Stagiaire non trouvé' });
        const historique = await Stagiaire.getHistoriquePointages(id, dateDebut, dateFin);
        res.json(historique);
    } catch (error) {
        console.error('getHistoriquePointages:', error);
        res.status(500).json({ message: "Erreur lors de la récupération de l'historique" });
    }
};

// ─── Tous les stagiaires avec présence ───────────────────────────────────────
const getAllStagiairesWithPresence = async (req, res) => {
    try {
        const stagiaires = await Stagiaire.findAllWithPresence();
        res.json(stagiaires);
    } catch (error) {
        console.error('getAllStagiairesWithPresence:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des stagiaires' });
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