const db = require('../config/db');

// ✅ Utilitaire heure locale (Niger = WAT = UTC+1)
function localDateTimeStr() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}
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

class Stagiaire {

    // Récupérer tous les stagiaires (avec direction)
    static async findAll() {
        try {
            const [rows] = await db.query(
                `SELECT s.id, s.nom, s.prenom, s.email, s.telephone,
                        s.date_debut, s.date_fin, s.direction_id,
                        d.nom AS direction,
                        s.est_present, s.derniere_entree, s.derniere_sortie, s.created_at
                 FROM stagiaires s
                 LEFT JOIN directions d ON s.direction_id = d.id
                 ORDER BY s.id DESC`
            );
            return rows;
        } catch (error) {
            console.error('Erreur findAll stagiaires:', error);
            throw error;
        }
    }

    // Récupérer un stagiaire par son ID
    static async findById(id) {
        try {
            const [rows] = await db.query(
                `SELECT s.id, s.nom, s.prenom, s.email, s.telephone,
                        s.date_debut, s.date_fin, s.direction_id,
                        d.nom AS direction,
                        s.est_present, s.derniere_entree, s.derniere_sortie, s.created_at
                 FROM stagiaires s
                 LEFT JOIN directions d ON s.direction_id = d.id
                 WHERE s.id = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur findById stagiaire:', error);
            throw error;
        }
    }

    // Créer un nouveau stagiaire
    static async create(stagiaireData) {
        const { nom, prenom, email, telephone, date_debut, date_fin, direction_id } = stagiaireData;
        try {
            const [result] = await db.query(
                `INSERT INTO stagiaires (nom, prenom, email, telephone, date_debut, date_fin, direction_id, est_present)
                 VALUES (?, ?, ?, ?, ?, ?, ?, FALSE)`,
                [nom, prenom, email, telephone, date_debut || null, date_fin || null, direction_id || null]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur create stagiaire:', error);
            throw error;
        }
    }

    // Modifier un stagiaire
    static async update(id, stagiaireData) {
        const { nom, prenom, email, telephone, date_debut, date_fin, direction_id } = stagiaireData;
        try {
            const [result] = await db.query(
                `UPDATE stagiaires
                 SET nom = ?, prenom = ?, email = ?, telephone = ?,
                     date_debut = ?, date_fin = ?, direction_id = ?
                 WHERE id = ?`,
                [nom, prenom, email, telephone, date_debut || null, date_fin || null, direction_id || null, id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur update stagiaire:', error);
            throw error;
        }
    }

    // Supprimer un stagiaire
    static async delete(id) {
        try {
            const [result] = await db.query('DELETE FROM stagiaires WHERE id = ?', [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur delete stagiaire:', error);
            throw error;
        }
    }

    // ══════════════════════════════════════════════════════
    // POINTAGE — ENTRÉE
    // ══════════════════════════════════════════════════════
    static async enregistrerEntree(id, utilisateur_id) {
        try {
            // ✅ FIX fuseau horaire : heure locale et non UTC
            const dateTimeStr = localDateTimeStr(); // ex: "2026-05-01 10:16:00"
            const dateStr     = localDateStr();     // ex: "2026-05-01"
            const timeStr     = localTimeStr();     // ex: "10:16:00"

            await db.query(
                `UPDATE stagiaires
                 SET est_present = TRUE, derniere_entree = ?
                 WHERE id = ?`,
                [dateTimeStr, id]
            );

            const [result] = await db.query(
                `INSERT INTO pointages_stagiaires (stagiaire_id, type, heure, date, utilisateur_id)
                 VALUES (?, 'entree', ?, ?, ?)`,
                [id, timeStr, dateStr, utilisateur_id]
            );

            return result.insertId;
        } catch (error) {
            console.error('Erreur enregistrerEntree stagiaire:', error);
            throw error;
        }
    }

    // ══════════════════════════════════════════════════════
    // POINTAGE — SORTIE
    // ══════════════════════════════════════════════════════
    static async enregistrerSortie(id, utilisateur_id) {
        try {
            // ✅ FIX fuseau horaire : heure locale et non UTC
            const dateTimeStr = localDateTimeStr();
            const dateStr     = localDateStr();
            const timeStr     = localTimeStr();

            await db.query(
                `UPDATE stagiaires
                 SET est_present = FALSE, derniere_sortie = ?
                 WHERE id = ?`,
                [dateTimeStr, id]
            );

            const [result] = await db.query(
                `INSERT INTO pointages_stagiaires (stagiaire_id, type, heure, date, utilisateur_id)
                 VALUES (?, 'sortie', ?, ?, ?)`,
                [id, timeStr, dateStr, utilisateur_id]
            );

            return result.insertId;
        } catch (error) {
            console.error('Erreur enregistrerSortie stagiaire:', error);
            throw error;
        }
    }

    // Vérifier si un stagiaire est présent
    static async isPresent(id) {
        try {
            const [rows] = await db.query(
                'SELECT est_present FROM stagiaires WHERE id = ?', [id]
            );
            return rows[0] ? rows[0].est_present === 1 : false;
        } catch (error) {
            console.error('Erreur isPresent stagiaire:', error);
            throw error;
        }
    }

    // Historique des pointages d'un stagiaire
    static async getHistoriquePointages(id, dateDebut, dateFin) {
        try {
            let query  = `SELECT * FROM pointages_stagiaires WHERE stagiaire_id = ?`;
            const params = [id];
            if (dateDebut && dateFin) {
                query += ` AND date BETWEEN ? AND ?`;
                params.push(dateDebut, dateFin);
            }
            query += ` ORDER BY date DESC, heure DESC`;
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error('Erreur getHistoriquePointages:', error);
            throw error;
        }
    }

    // Tous les stagiaires avec présence et direction
    static async findAllWithPresence() {
        try {
            const [rows] = await db.query(
                `SELECT s.id, s.nom, s.prenom, s.email, s.telephone,
                        s.date_debut, s.date_fin, s.direction_id,
                        d.nom AS direction,
                        s.est_present, s.derniere_entree, s.derniere_sortie, s.created_at,
                        CASE WHEN s.est_present = 1 THEN TRUE ELSE FALSE END as est_present_flag,
                        DATE_FORMAT(s.derniere_entree, '%H:%i') as heure_entree,
                        DATE_FORMAT(s.derniere_sortie, '%H:%i') as heure_sortie
                 FROM stagiaires s
                 LEFT JOIN directions d ON s.direction_id = d.id
                 ORDER BY s.id DESC`
            );
            return rows;
        } catch (error) {
            console.error('Erreur findAllWithPresence stagiaires:', error);
            throw error;
        }
    }
}

module.exports = Stagiaire;