const db = require('../config/db');

class Employe {

    // ─── Tous les employés avec le nom de la direction ────────────────────
    static async findAll() {
        const [rows] = await db.query(`
            SELECT e.id, e.nom, e.prenom, e.email, e.telephone,
                   e.heure_arrivee, e.heure_depart,
                   e.direction_id, d.nom AS direction, e.created_at
            FROM employes e
            JOIN directions d ON e.direction_id = d.id
            ORDER BY d.nom, e.nom, e.prenom
        `);
        return rows;
    }

    // ─── Un employé par ID ────────────────────────────────────────────────
    static async findById(id) {
        const [rows] = await db.query(`
            SELECT e.id, e.nom, e.prenom, e.email, e.telephone,
                   e.heure_arrivee, e.heure_depart,
                   e.direction_id, d.nom AS direction, e.created_at
            FROM employes e
            JOIN directions d ON e.direction_id = d.id
            WHERE e.id = ?
        `, [id]);
        return rows[0] || null;
    }

    // ─── Créer un employé ────────────────────────────────────────────────
    static async create(data) {
        const { nom, prenom, direction_id, heure_arrivee, heure_depart, email, telephone } = data;
        const [result] = await db.query(
            `INSERT INTO employes (nom, prenom, direction_id, heure_arrivee, heure_depart, email, telephone)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [nom, prenom, direction_id, heure_arrivee || null, heure_depart || null, email || null, telephone || null]
        );
        return result.insertId;
    }

    // ─── Modifier un employé ─────────────────────────────────────────────
    static async update(id, data) {
        const { nom, prenom, direction_id, heure_arrivee, heure_depart, email, telephone } = data;
        const [result] = await db.query(
            `UPDATE employes
             SET nom=?, prenom=?, direction_id=?, heure_arrivee=?, heure_depart=?, email=?, telephone=?
             WHERE id = ?`,
            [nom, prenom, direction_id, heure_arrivee || null, heure_depart || null, email || null, telephone || null, id]
        );
        return result.affectedRows > 0;
    }

    // ─── Supprimer un employé ────────────────────────────────────────────
    static async delete(id) {
        const [result] = await db.query('DELETE FROM employes WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

// ─── Gestion des directions ───────────────────────────────────────────────────
class Direction {

    static async findAll() {
        const [rows] = await db.query('SELECT * FROM directions ORDER BY nom');
        return rows;
    }

    static async create(nom) {
        const [result] = await db.query(
            'INSERT INTO directions (nom) VALUES (?)', [nom]
        );
        return result.insertId;
    }

    static async delete(id) {
        // Vérifie si des employés sont dans cette direction avant de supprimer
        const [employes] = await db.query(
            'SELECT COUNT(*) as total FROM employes WHERE direction_id = ?', [id]
        );
        if (employes[0].total > 0) {
            throw new Error(`Impossible : ${employes[0].total} employé(s) dans cette direction`);
        }
        const [result] = await db.query('DELETE FROM directions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = { Employe, Direction };