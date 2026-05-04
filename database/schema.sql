CREATE DATABASE IF NOT EXISTS gestion_db;
USE gestion_db;

-- Table des utilisateurs (admin + agents sécurité)
CREATE TABLE utilisateurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('admin', 'agent') DEFAULT 'agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des directions (pour les employés ANSI)
CREATE TABLE directions (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    nom        VARCHAR(200) NOT NULL,
    code       VARCHAR(50)  NULL,
    actif      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_directions_nom (nom)
);

-- =====================================================
-- TABLE STAGIAIRES (avec POINTAGE entrée/sortie)
-- =====================================================
CREATE TABLE stagiaires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telephone VARCHAR(20),
    est_present BOOLEAN DEFAULT FALSE,
    derniere_entree DATETIME NULL,
    derniere_sortie DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLE POINTAGES STAGIAIRES (historique)
-- =====================================================
CREATE TABLE pointages_stagiaires (
    id INT PRIMARY KEY AUTO_INCREMENT,
    stagiaire_id INT NOT NULL,
    type ENUM('entree', 'sortie') NOT NULL,
    heure DATETIME NOT NULL,
    date DATE NOT NULL,
    utilisateur_id INT NULL,
    FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE EMPLOYÉS ANSI (pas de pointage, juste présence)
-- =====================================================
CREATE TABLE employes (
    id            INT          PRIMARY KEY AUTO_INCREMENT,
    matricule     VARCHAR(20)  UNIQUE NOT NULL,
    nom           VARCHAR(100) NOT NULL,
    prenom        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NULL,
    telephone     VARCHAR(20)  NULL,
    direction_id  INT          NOT NULL,
    poste         VARCHAR(150) NOT NULL,
    est_present   BOOLEAN      DEFAULT FALSE,
    date_embauche DATE         NULL,
    statut        ENUM('actif', 'inactif', 'conge') DEFAULT 'actif',
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_employe_direction FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_employes_direction ON employes (direction_id);

-- =====================================================
-- TABLE VISITEURS
-- =====================================================
CREATE TABLE visiteurs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(50) NOT NULL,
    prenom VARCHAR(50) NOT NULL,
    telephone VARCHAR(20),
    motif VARCHAR(255),
    date_visite DATE DEFAULT CURDATE(),
    heure_entree TIME,
    heure_sortie TIME,
    stagiaire_id INT NULL,
    employe_id INT NULL,
    direction_id INT NULL,
    type_visite ENUM('stagiaire', 'employe') NOT NULL DEFAULT 'stagiaire',
    utilisateur_id INT NULL,
    FOREIGN KEY (stagiaire_id) REFERENCES stagiaires(id) ON DELETE SET NULL,
    FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE SET NULL,
    FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- =====================================================
-- TABLE LOGS (traçabilité)
-- =====================================================
CREATE TABLE logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    action VARCHAR(50) NOT NULL,
    utilisateur_id INT NULL,
    details TEXT,
    ip_adresse VARCHAR(45),
    date_action TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateurs(id) ON DELETE SET NULL
);

-- =====================================================
-- INSERTIONS DE DONNÉES DE TEST
-- =====================================================

-- Admin par défaut (mot de passe: admin123)
-- Le hash est pour "admin123"
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role) 
VALUES ('Super', 'Admin', 'admin@test.com', '$2b$10$9tUJqRqFgFgJqRqFgFgJqO', 'admin');

-- Quelques directions
INSERT INTO directions (nom, code) VALUES
('Direction Générale', 'DG'),
('Direction des Systèmes d\'Information', 'DSI'),
('Direction de la Cybersécurité', 'DCS'),
('Direction des Ressources Humaines', 'DRH'),
('Direction Financière', 'DF');
 
-- Quelques stagiaires (avec pointage)
INSERT INTO stagiaires (nom, prenom, email, telephone) VALUES
('Dupont', 'Jean', 'jean.dupont@exemple.com', '771234567'),
('Martin', 'Sophie', 'sophie.martin@exemple.com', '772345678'),
('Bernard', 'Lucas', 'lucas.bernard@exemple.com', '773456789');

-- Quelques employés ANSI
INSERT INTO employes (matricule, nom, prenom, email, telephone, direction_id, poste, date_embauche) VALUES
('ANSI-001', 'DIALLO', 'Amadou', 'a.diallo@ansi.sn', '771234567', 1, 'Directeur Général', '2020-01-15'),
('ANSI-002', 'NDIAYE', 'Fatou', 'f.ndiaye@ansi.sn', '772345678', 2, 'Chef de Projet', '2020-03-20'),
('ANSI-003', 'SOW', 'Mamadou', 'm.sow@ansi.sn', '773456789', 3, 'Analyste Sécurité', '2020-06-10'),
('ANSI-004', 'FALL', 'Aissatou', 'a.fall@ansi.sn', '774567890', 4, 'Responsable RH', '2020-02-01'),
('ANSI-005', 'GUEYE', 'Oumar', 'o.gueye@ansi.sn', '775678901', 5, 'Comptable', '2020-04-15');