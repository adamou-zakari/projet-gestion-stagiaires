const Visiteur = require('../models/Visiteur');
const { Employe } = require('../models/Employe');
const db = require('../config/db');

// ✅ Utilitaire heure locale (Niger = WAT = UTC+1)
function localDateStr() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
}
function localTimeStr() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// ─────────────────────────────────────────────────────────────────
// GET tous les visiteurs
// ─────────────────────────────────────────────────────────────────
const getAllVisiteurs = async (req, res) => {
    try {
        let query = `
            SELECT v.*, e.nom AS employe_nom, e.prenom AS employe_prenom, d.nom AS direction
            FROM visiteurs v
            LEFT JOIN employes   e ON v.employe_id   = e.id
            LEFT JOIN directions d ON e.direction_id = d.id
        `;
        if (req.user.role !== 'admin') query += ` WHERE v.deleted_at IS NULL`;
        query += ` ORDER BY v.date_visite DESC, v.heure_entree DESC`;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET visiteurs d'aujourd'hui
// ─────────────────────────────────────────────────────────────────
const getVisiteursToday = async (req, res) => {
    try {
        // ✅ FIX : utiliser la date locale pour comparer
        const today = localDateStr();
        let query = `
            SELECT v.*, e.nom AS employe_nom, e.prenom AS employe_prenom, d.nom AS direction
            FROM visiteurs v
            LEFT JOIN employes   e ON v.employe_id   = e.id
            LEFT JOIN directions d ON e.direction_id = d.id
            WHERE DATE(v.date_visite) = ?
        `;
        const params = [today];
        if (req.user.role !== 'admin') query += ` AND v.deleted_at IS NULL`;
        query += ` ORDER BY v.heure_entree DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('❌ Erreur getVisiteursToday:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET visiteurs supprimés - ADMIN uniquement
// ─────────────────────────────────────────────────────────────────
const getDeletedVisiteurs = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        const [rows] = await db.query(`
            SELECT v.*, e.nom AS employe_nom, e.prenom AS employe_prenom, d.nom AS direction,
                   u.nom AS deleted_by_nom, u.prenom AS deleted_by_prenom
            FROM visiteurs v
            LEFT JOIN employes     e ON v.employe_id  = e.id
            LEFT JOIN directions   d ON e.direction_id = d.id
            LEFT JOIN utilisateurs u ON v.deleted_by  = u.id
            WHERE v.deleted_at IS NOT NULL
            ORDER BY v.deleted_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─────────────────────────────────────────────────────────────────
// RESTORE un visiteur supprimé - ADMIN uniquement
// ─────────────────────────────────────────────────────────────────
const restoreVisiteur = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        const { id } = req.params;
        const [rows] = await db.query(
            'SELECT id FROM visiteurs WHERE id = ? AND deleted_at IS NOT NULL', [id]
        );
        if (!rows[0]) {
            return res.status(404).json({ message: 'Visiteur non trouvé ou déjà actif' });
        }
        await db.query('UPDATE visiteurs SET deleted_at = NULL, deleted_by = NULL WHERE id = ?', [id]);
        res.json({ message: 'Visiteur restauré avec succès' });
    } catch (error) {
        console.error('❌ Erreur restoreVisiteur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET visiteurs par date
// ─────────────────────────────────────────────────────────────────
const getVisiteursByDate = async (req, res) => {
    try {
        const { date } = req.params;
        let query = `
            SELECT v.*, e.nom AS employe_nom, e.prenom AS employe_prenom, d.nom AS direction
            FROM visiteurs v
            LEFT JOIN employes   e ON v.employe_id   = e.id
            LEFT JOIN directions d ON e.direction_id = d.id
            WHERE DATE(v.date_visite) = ?
        `;
        if (req.user.role !== 'admin') query += ` AND v.deleted_at IS NULL`;
        query += ` ORDER BY v.heure_entree DESC`;
        const [rows] = await db.query(query, [date]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET visiteurs présents
// ─────────────────────────────────────────────────────────────────
const getVisiteursPresent = async (req, res) => {
    try {
        const today = localDateStr();
        let query = `
            SELECT v.*, e.nom AS employe_nom, e.prenom AS employe_prenom, d.nom AS direction
            FROM visiteurs v
            LEFT JOIN employes   e ON v.employe_id   = e.id
            LEFT JOIN directions d ON e.direction_id = d.id
            WHERE v.heure_sortie IS NULL AND DATE(v.date_visite) = ?
        `;
        const params = [today];
        if (req.user.role !== 'admin') query += ` AND v.deleted_at IS NULL`;
        query += ` ORDER BY v.heure_entree DESC`;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─────────────────────────────────────────────────────────────────
// GET un visiteur par ID
// ─────────────────────────────────────────────────────────────────
const getVisiteurById = async (req, res) => {
    try {
        const { id } = req.params;
        let query = `
            SELECT v.*, e.nom AS employe_nom, e.prenom AS employe_prenom, d.nom AS direction
            FROM visiteurs v
            LEFT JOIN employes   e ON v.employe_id   = e.id
            LEFT JOIN directions d ON e.direction_id = d.id
            WHERE v.id = ?
        `;
        if (req.user.role !== 'admin') query += ` AND v.deleted_at IS NULL`;
        const [rows] = await db.query(query, [id]);
        if (!rows[0]) return res.status(404).json({ message: 'Visiteur non trouvé' });
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─────────────────────────────────────────────────────────────────
// POST — Enregistrer une entrée
// ─────────────────────────────────────────────────────────────────
const enregistrerEntree = async (req, res) => {
    try {
        const { nom, prenom, telephone, service_dorigine, stagiaire_id, employe_id } = req.body;

        if (!nom) return res.status(400).json({ message: 'Le nom est obligatoire' });
        if (stagiaire_id && stagiaire_id !== null) {
            return res.status(400).json({ message: '❌ Les visites pour les stagiaires ne sont plus autorisées.' });
        }
        if (!employe_id) return res.status(400).json({ message: 'Veuillez sélectionner un employé' });

        const employe = await Employe.findById(employe_id);
        if (!employe) return res.status(404).json({ message: 'Employé non trouvé' });

        // ✅ FIX fuseau horaire : date et heure locales
        const visiteDate  = localDateStr();
        const heureEntree = localTimeStr();

        const [result] = await db.query(
            `INSERT INTO visiteurs
                (date_visite, heure_entree, nom, prenom, telephone, service_dorigine, employe_id, type_visite, utilisateur_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'employe', ?)`,
            [visiteDate, heureEntree, nom, prenom || null, telephone || null, service_dorigine || null, employe_id, req.user.id]
        );

        res.status(201).json({ message: 'Entrée enregistrée avec succès', id: result.insertId });

    } catch (error) {
        console.error('❌ Erreur enregistrement entrée:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// PUT /sortie/:id — Enregistrer la sortie
// ─────────────────────────────────────────────────────────────────
const enregistrerSortie = async (req, res) => {
    try {
        const { id } = req.params;
        const visiteur = await Visiteur.findById(id);
        if (!visiteur)             return res.status(404).json({ message: 'Visiteur non trouvé' });
        if (visiteur.heure_sortie) return res.status(400).json({ message: 'Ce visiteur est déjà sorti' });
        if (visiteur.deleted_at)   return res.status(400).json({ message: 'Ce visiteur a été supprimé' });

        const updated = await Visiteur.enregistrerSortie(id);
        if (updated) res.json({ message: 'Sortie enregistrée avec succès' });
        else res.status(400).json({ message: "Erreur lors de l'enregistrement de la sortie" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ─────────────────────────────────────────────────────────────────
// PUT /:id — Modifier une visite
// ─────────────────────────────────────────────────────────────────
const updateVisiteur = async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, telephone, service_dorigine, employe_id } = req.body;

        if (!nom)       return res.status(400).json({ message: 'Le nom est obligatoire' });
        if (!employe_id) return res.status(400).json({ message: 'Veuillez sélectionner un employé' });

        let query = 'SELECT id, deleted_at FROM visiteurs WHERE id = ?';
        if (req.user.role !== 'admin') query += ' AND deleted_at IS NULL';
        const [rows] = await db.query(query, [id]);
        if (!rows[0]) return res.status(404).json({ message: 'Visite non trouvée' });

        const employe = await Employe.findById(employe_id);
        if (!employe) return res.status(404).json({ message: 'Employé non trouvé' });

        await db.query(
            `UPDATE visiteurs SET nom=?, prenom=?, telephone=?, service_dorigine=?, employe_id=? WHERE id=?`,
            [nom, prenom || null, telephone || null, service_dorigine || null, employe_id, id]
        );
        res.json({ message: 'Visite modifiée avec succès' });
    } catch (error) {
        console.error('❌ Erreur updateVisiteur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

// ─────────────────────────────────────────────────────────────────
// DELETE /:id — Soft delete
// ─────────────────────────────────────────────────────────────────
const deleteVisiteur = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT id, deleted_at FROM visiteurs WHERE id = ?', [id]);
        if (!rows[0])          return res.status(404).json({ message: 'Visite non trouvée' });
        if (rows[0].deleted_at) return res.status(400).json({ message: 'Ce visiteur est déjà supprimé' });

        await db.query('UPDATE visiteurs SET deleted_at = NOW(), deleted_by = ? WHERE id = ?', [req.user.id, id]);
        res.json({ message: 'Visiteur supprimé avec succès' });
    } catch (error) {
        console.error('❌ Erreur deleteVisiteur:', error);
        res.status(500).json({ message: 'Erreur serveur', error: error.message });
    }
};

module.exports = {
    getAllVisiteurs,
    getVisiteursToday,
    getVisiteursByDate,
    getVisiteursPresent,
    getVisiteurById,
    enregistrerEntree,
    enregistrerSortie,
    updateVisiteur,
    deleteVisiteur,
    getDeletedVisiteurs,
    restoreVisiteur
};