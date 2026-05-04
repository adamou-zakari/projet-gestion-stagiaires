const { Employe, Direction } = require('../models/Employe');
const db = require('../config/db');

async function logAction(action, userId, details, ip) {
    try {
        await db.query(
            'INSERT INTO logs (action, utilisateur_id, details, ip_adresse) VALUES (?, ?, ?, ?)',
            [action, userId, details, ip || 'inconnue']
        );
    } catch (e) {
        console.warn('⚠️ Log non enregistré:', e.message);
    }
}

// ════════════════════════════════════════════════════════════
// DIRECTIONS
// ════════════════════════════════════════════════════════════

const getAllDirections = async (req, res) => {
    try {
        const directions = await Direction.findAll();
        res.json(directions);
    } catch (error) {
        console.error('getAllDirections:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des directions' });
    }
};

const createDirection = async (req, res) => {
    try {
        const { nom } = req.body;
        if (!nom || !nom.trim()) {
            return res.status(400).json({ message: 'Le nom de la direction est obligatoire' });
        }

        const id = await Direction.create(nom.trim());
        await logAction('AJOUT_DIRECTION', req.user.id, `Direction "${nom}" ajoutée`, req.ip);
        res.status(201).json({ message: 'Direction ajoutée avec succès', id });
    } catch (error) {
        console.error('createDirection:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Cette direction existe déjà' });
        }
        res.status(500).json({ message: 'Erreur lors de la création de la direction' });
    }
};

const deleteDirection = async (req, res) => {
    try {
        await Direction.delete(req.params.id);
        await logAction('SUPPRESSION_DIRECTION', req.user.id, `Direction ID ${req.params.id} supprimée`, req.ip);
        res.json({ message: 'Direction supprimée avec succès' });
    } catch (error) {
        console.error('deleteDirection:', error);
        if (error.message.startsWith('Impossible')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erreur lors de la suppression de la direction' });
    }
};

// ════════════════════════════════════════════════════════════
// EMPLOYÉS
// ════════════════════════════════════════════════════════════

const getAllEmployes = async (req, res) => {
    try {
        const employes = await Employe.findAll();
        res.json(employes);
    } catch (error) {
        console.error('getAllEmployes:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des employés' });
    }
};

const getEmployeById = async (req, res) => {
    try {
        const employe = await Employe.findById(req.params.id);
        if (!employe) return res.status(404).json({ message: 'Employé non trouvé' });
        res.json(employe);
    } catch (error) {
        console.error('getEmployeById:', error);
        res.status(500).json({ message: 'Erreur lors de la récupération de l\'employé' });
    }
};

const createEmploye = async (req, res) => {
    try {
        const { nom, prenom, direction_id, heure_arrivee, heure_depart, email, telephone } = req.body;

        if (!nom || !prenom || !direction_id) {
            return res.status(400).json({
                message: 'Les champs nom, prénom et direction sont obligatoires'
            });
        }

        const id = await Employe.create({ nom, prenom, direction_id, heure_arrivee, heure_depart, email, telephone });
        await logAction('AJOUT_EMPLOYE', req.user.id, `Employé ${nom} ${prenom} ajouté`, req.ip);

        res.status(201).json({ message: 'Employé créé avec succès', id });
    } catch (error) {
        console.error('createEmploye:', error);
        res.status(500).json({ message: 'Erreur lors de la création de l\'employé' });
    }
};

const updateEmploye = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, direction_id, heure_arrivee, heure_depart, email, telephone } = req.body;

        const existing = await Employe.findById(id);
        if (!existing) return res.status(404).json({ message: 'Employé non trouvé' });

        const updated = await Employe.update(id, {
            nom: nom !== undefined ? nom : existing.nom,
            prenom: prenom !== undefined ? prenom : existing.prenom,
            direction_id: direction_id !== undefined ? direction_id : existing.direction_id,
            heure_arrivee: heure_arrivee !== undefined ? heure_arrivee : existing.heure_arrivee,
            heure_depart: heure_depart !== undefined ? heure_depart : existing.heure_depart,
            email: email !== undefined ? email : existing.email,
            telephone: telephone !== undefined ? telephone : existing.telephone
        });

        if (updated) {
            await logAction('MODIFICATION_EMPLOYE', req.user.id, `Employé ID ${id} modifié`, req.ip);
            res.json({ message: 'Employé modifié avec succès' });
        } else {
            res.status(400).json({ message: 'Aucune modification effectuée' });
        }
    } catch (error) {
        console.error('updateEmploye:', error);
        res.status(500).json({ message: 'Erreur lors de la modification de l\'employé' });
    }
};

const deleteEmploye = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await Employe.findById(id);
        if (!existing) return res.status(404).json({ message: 'Employé non trouvé' });

        const [visiteurs] = await db.query(
            'SELECT COUNT(*) as total FROM visiteurs WHERE employe_id = ?', [id]
        );
        if (visiteurs[0].total > 0) {
            return res.status(400).json({
                message: `Impossible : cet employé a ${visiteurs[0].total} visiteur(s) associé(s)`
            });
        }

        const deleted = await Employe.delete(id);
        if (deleted) {
            await logAction('SUPPRESSION_EMPLOYE', req.user.id,
                `Employé ${existing.nom} ${existing.prenom} supprimé`, req.ip);
            res.json({ message: 'Employé supprimé avec succès' });
        } else {
            res.status(400).json({ message: 'Erreur lors de la suppression' });
        }
    } catch (error) {
        console.error('deleteEmploye:', error);
        res.status(500).json({ message: 'Erreur lors de la suppression de l\'employé' });
    }
};

// ════════════════════════════════════════════════════════════
// BASCULE PRÉSENCE EMPLOYÉ
// ════════════════════════════════════════════════════════════

const togglePresenceEmploye = async (req, res) => {
    try {
        const { id } = req.params;

        // Vérifier si la colonne est_present existe, sinon l'ajouter
        try {
            const [check] = await db.query('SELECT est_present FROM employes LIMIT 1');
        } catch (err) {
            if (err.code === 'ER_BAD_FIELD_ERROR') {
                await db.query('ALTER TABLE employes ADD COLUMN est_present BOOLEAN DEFAULT FALSE');
            }
        }

        const [employe] = await db.query('SELECT id, est_present, nom, prenom FROM employes WHERE id = ?', [id]);
        if (!employe || employe.length === 0) {
            return res.status(404).json({ message: 'Employé non trouvé' });
        }

        const current = employe[0].est_present === 1;
        const newStatus = !current;

        await db.query('UPDATE employes SET est_present = ? WHERE id = ?', [newStatus ? 1 : 0, id]);

        await logAction(
            'MODIFICATION_PRESENCE_EMPLOYE',
            req.user.id,
            `Employé ${employe[0].nom} ${employe[0].prenom} marqué ${newStatus ? 'présent' : 'absent'}`,
            req.ip
        );

        res.json({
            message: `Statut mis à jour : ${newStatus ? 'présent' : 'absent'}`,
            est_present: newStatus
        });
    } catch (error) {
        console.error('togglePresenceEmploye:', error);
        res.status(500).json({ message: 'Erreur lors du changement de statut' });
    }
};

module.exports = {
    getAllDirections,
    createDirection,
    deleteDirection,
    getAllEmployes,
    getEmployeById,
    createEmploye,
    updateEmploye,
    deleteEmploye,
    togglePresenceEmploye
};