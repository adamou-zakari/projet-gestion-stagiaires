const db = require('../config/db');

class Visiteur {
    static async findAll() {
        try {
            const [rows] = await db.query(`
                SELECT v.*,
                       e.nom    AS employe_nom,
                       e.prenom AS employe_prenom,
                       d.nom    AS direction
                FROM visiteurs v
                LEFT JOIN employes   e ON v.employe_id = e.id
                LEFT JOIN directions d ON e.direction_id = d.id
                ORDER BY v.date_visite DESC, v.heure_entree DESC
            `);
            return rows;
        } catch (error) {
            console.error('Erreur findAll visiteurs:', error);
            throw error;
        }
    }

    static async findToday() {
        try {
            const [rows] = await db.query(`
                SELECT v.*,
                       e.nom    AS employe_nom,
                       e.prenom AS employe_prenom,
                       d.nom    AS direction
                FROM visiteurs v
                LEFT JOIN employes   e ON v.employe_id = e.id
                LEFT JOIN directions d ON e.direction_id = d.id
                WHERE v.date_visite = CURDATE()
                ORDER BY v.heure_entree DESC
            `);
            return rows;
        } catch (error) {
            console.error('❌ Erreur findToday:', error);
            throw error;
        }
    }

    static async findByDate(date) {
        try {
            const [rows] = await db.query(`
                SELECT v.*,
                       e.nom    AS employe_nom,
                       e.prenom AS employe_prenom,
                       d.nom    AS direction
                FROM visiteurs v
                LEFT JOIN employes   e ON v.employe_id = e.id
                LEFT JOIN directions d ON e.direction_id = d.id
                WHERE v.date_visite = ?
                ORDER BY v.heure_entree DESC
            `, [date]);
            return rows;
        } catch (error) {
            console.error('Erreur findByDate visiteurs:', error);
            throw error;
        }
    }

    static async findById(id) {
        try {
            const [rows] = await db.query(`
                SELECT v.*,
                       e.nom    AS employe_nom,
                       e.prenom AS employe_prenom,
                       d.nom    AS direction
                FROM visiteurs v
                LEFT JOIN employes   e ON v.employe_id = e.id
                LEFT JOIN directions d ON e.direction_id = d.id
                WHERE v.id = ?
            `, [id]);
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur findById visiteur:', error);
            throw error;
        }
    }

    static async findPresent() {
        try {
            const [rows] = await db.query(`
                SELECT v.*,
                       e.nom    AS employe_nom,
                       e.prenom AS employe_prenom,
                       d.nom    AS direction
                FROM visiteurs v
                LEFT JOIN employes   e ON v.employe_id = e.id
                LEFT JOIN directions d ON e.direction_id = d.id
                WHERE v.heure_sortie IS NULL
                  AND v.date_visite = CURDATE()
                  AND v.deleted_at IS NULL
            `);
            return rows;
        } catch (error) {
            console.error('Erreur findPresent visiteurs:', error);
            throw error;
        }
    }

    static async enregistrerEntree(visiteurData) {
        const { date_visite, heure_entree, nom, prenom, telephone, service_dorigine, employe_id, type_visite, utilisateur_id } = visiteurData;
        try {
            const [result] = await db.query(`
                INSERT INTO visiteurs
                (date_visite, heure_entree, nom, prenom, telephone, service_dorigine, employe_id, type_visite, utilisateur_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                date_visite,
                heure_entree,
                nom,
                prenom           || null,
                telephone        || null,
                service_dorigine || null,
                employe_id       || null,
                type_visite,
                utilisateur_id   || null
            ]);
            return result.insertId;
        } catch (error) {
            console.error('❌ Erreur enregistrerEntree:', error);
            throw error;
        }
    }

    static async enregistrerSortie(id) {
        try {
            const [result] = await db.query(`
                UPDATE visiteurs
                SET heure_sortie = CURTIME()
                WHERE id = ? AND heure_sortie IS NULL
            `, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur enregistrerSortie:', error);
            throw error;
        }
    }
}

module.exports = Visiteur;