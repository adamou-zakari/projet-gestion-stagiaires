-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration : directions + travailleurs (employés) + colonnes sur visiteurs
-- À exécuter dans phpMyAdmin sur la base gestion_db (MySQL / MariaDB, XAMPP)
--
-- Après exécution : remplissez la table `directions` puis `employes` (vos vraies données).
--
-- Si erreur « Duplicate column » : colonnes déjà ajoutées — ne pas réexécuter la section 3.
-- Pour direction_id seul sur visiteurs : migration_ajouter_direction_visiteurs.sql
-- ═══════════════════════════════════════════════════════════════════════════════

USE gestion_db;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Référentiel des directions (table vide au départ)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS directions (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    nom        VARCHAR(200) NOT NULL,
    code       VARCHAR(50)  NULL,
    actif      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_directions_nom (nom)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Travailleurs visités (rattachés à une direction)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS employes (
    id            INT          PRIMARY KEY AUTO_INCREMENT,
    nom           VARCHAR(100) NOT NULL,
    prenom        VARCHAR(100) NOT NULL,
    email         VARCHAR(150) UNIQUE NULL,
    telephone     VARCHAR(20)  NULL,
    direction_id  INT          NOT NULL,
    poste         VARCHAR(150) NOT NULL,
    heure_arrivee TIME         NULL,
    heure_depart  TIME         NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employe_direction
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX idx_employes_direction ON employes (direction_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Visites : stagiaire OU employé + direction de la visite
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE visiteurs
    ADD COLUMN employe_id INT NULL DEFAULT NULL AFTER stagiaire_id,
    ADD COLUMN direction_id INT NULL DEFAULT NULL AFTER employe_id,
    ADD COLUMN type_visite ENUM('stagiaire', 'employe') NOT NULL DEFAULT 'stagiaire' AFTER direction_id;

ALTER TABLE visiteurs
    ADD CONSTRAINT fk_visiteur_employe
        FOREIGN KEY (employe_id) REFERENCES employes(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_visiteur_direction
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL;
