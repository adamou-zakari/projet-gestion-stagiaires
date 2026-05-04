-- À utiliser SEULEMENT si vous avez déjà `employe_id` et `type_visite` sur `visiteurs`
-- (ancienne migration) mais pas encore `direction_id`.
-- Sinon, utilisez migration_directions_et_employes.sql en entier.

USE gestion_db;

ALTER TABLE visiteurs
    ADD COLUMN direction_id INT NULL DEFAULT NULL AFTER employe_id;

ALTER TABLE visiteurs
    ADD CONSTRAINT fk_visiteur_direction
        FOREIGN KEY (direction_id) REFERENCES directions(id) ON DELETE SET NULL;
