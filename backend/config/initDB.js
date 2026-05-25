const db = require('./db');

async function initDB() {
    try {
        await db.query(`CREATE TABLE IF NOT EXISTS utilisateurs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nom VARCHAR(50) NOT NULL,
            prenom VARCHAR(50) NOT NULL,
            login VARCHAR(100) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NULL,
            mot_de_passe VARCHAR(255) NOT NULL,
            role ENUM('admin', 'agent') DEFAULT 'agent',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS directions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nom VARCHAR(200) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_directions_nom (nom)
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS stagiaires (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nom VARCHAR(50) NOT NULL,
            prenom VARCHAR(50) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            telephone VARCHAR(20) NULL,
            direction_id INT NULL,
            date_debut DATE NULL,
            date_fin DATE NULL,
            est_present BOOLEAN DEFAULT FALSE,
            derniere_entree DATETIME NULL,
            derniere_sortie DATETIME NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS pointages_stagiaires (
            id INT PRIMARY KEY AUTO_INCREMENT,
            stagiaire_id INT NOT NULL,
            type ENUM('entree', 'sortie') NOT NULL,
            heure DATETIME NOT NULL,
            date DATE NOT NULL,
            utilisateur_id INT NULL,
            FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE CASCADE,
            FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS employes (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nom VARCHAR(100) NOT NULL,
            prenom VARCHAR(100) NOT NULL,
            email VARCHAR(150) UNIQUE NULL,
            telephone VARCHAR(20) NULL,
            direction_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_employe_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS visiteurs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nom VARCHAR(50) NOT NULL,
            prenom VARCHAR(50) NULL,
            numero_carte VARCHAR(30) NULL,
            telephone VARCHAR(20) NULL,
            service_dorigine VARCHAR(150) NULL,
            date_visite DATE DEFAULT (CURDATE()),
            heure_entree TIME NULL,
            heure_sortie TIME NULL,
            employe_id INT NULL,
            utilisateur_id INT NULL,
            deleted_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE SET NULL,
            FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
        )`);

        await db.query(`CREATE TABLE IF NOT EXISTS logs (
            id INT PRIMARY KEY AUTO_INCREMENT,
            action VARCHAR(100) NOT NULL,
            utilisateur_id INT NULL,
            details TEXT NULL,
            ip_adresse VARCHAR(45) NULL,
            date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
        )`);

        console.log('✅ Base de données initialisée');
    } catch (error) {
        console.error('❌ Erreur initDB:', error.message);
        throw error;
    }
}

module.exports = initDB;