const db = require('../config/db');

class Utilisateur {

    // Trouver un utilisateur par email (pour la connexion)
    static async findByEmail(email) {
        try {
            const [rows] = await db.query(
                'SELECT id, nom, prenom, login, email, role, created_at FROM utilisateurs WHERE email = ?',
                [email]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur findByEmail:', error);
            throw error;
        }
    }

    // Trouver un utilisateur par ID
    static async findById(id) {
        try {
            const [rows] = await db.query(
                'SELECT id, nom, prenom, login, email, role, created_at FROM utilisateurs WHERE id = ?',
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur findById:', error);
            throw error;
        }
    }

    // Créer un nouvel utilisateur
    static async create(utilisateurData) {
        const { nom, prenom, email, mot_de_passe, role = 'gardien' } = utilisateurData;
        
        try {
            const [result] = await db.query(
                `INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) 
                 VALUES (?, ?, ?, ?, ?)`,
                [nom, prenom, email, mot_de_passe, role]
            );
            return result.insertId;
        } catch (error) {
            console.error('Erreur create:', error);
            throw error;
        }
    }

    // Lister tous les utilisateurs
    static async findAll() {
        try {
            const [rows] = await db.query(
                'SELECT id, nom, prenom, login, email, role, created_at FROM utilisateurs'
            );
            return rows;
        } catch (error) {
            console.error('Erreur findAll:', error);
            throw error;
        }
    }
}

module.exports = Utilisateur;