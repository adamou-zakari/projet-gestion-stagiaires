-- ═══════════════════════════════════════════════════════════════════════════════
-- Ce fichier est remplacé par : migration_directions_et_employes.sql
-- Il contenait une version avec colonne "direction" en texte sur employes.
-- La version à jour utilise la table `directions` et `direction_id` (plus propre).
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Utilisez : database/migration_directions_et_employes.sql
--
-- ═══════════════════════════════════════════════════════════════
-- ÉTAPE 1 : Table des directions (gérée par l'admin)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS directions (
    id         INT          PRIMARY KEY AUTO_INCREMENT,
    nom        VARCHAR(200) NOT NULL UNIQUE,
    created_at TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

-- Directions officielles ANSI Niger (de base)
INSERT INTO directions (nom) VALUES
    ('Direction Générale'),
    ('Direction des Systèmes d\'Information'),
    ('Direction de la Cybersécurité'),
    ('Direction des Ressources Humaines'),
    ('Direction Financière'),
    ('Direction Juridique');

-- ═══════════════════════════════════════════════════════════════
-- ÉTAPE 2 : Table des employés (sans email, telephone, poste)
-- ═══════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS employes (
    id           INT          PRIMARY KEY AUTO_INCREMENT,
    nom          VARCHAR(100) NOT NULL,
    prenom       VARCHAR(100) NOT NULL,
    direction_id INT          NOT NULL,
    heure_arrivee TIME,
    heure_depart  TIME,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employe_direction
        FOREIGN KEY (direction_id) REFERENCES directions(id)
        ON DELETE RESTRICT
);

-- ═══════════════════════════════════════════════════════════════
-- ÉTAPE 3 : Modifier la table visiteurs
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE visiteurs
    ADD COLUMN employe_id  INT  NULL DEFAULT NULL AFTER stagiaire_id,
    ADD COLUMN type_visite ENUM('stagiaire','employe') NOT NULL DEFAULT 'stagiaire' AFTER employe_id,
    ADD CONSTRAINT fk_visiteur_employe
        FOREIGN KEY (employe_id) REFERENCES employes(id)
        ON DELETE SET NULL;