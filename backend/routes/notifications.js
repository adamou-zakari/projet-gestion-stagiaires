const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// GET /api/notifications/last?since=timestamp
router.get('/last', async (req, res) => {
    try {
        const { since } = req.query;
        let dateSince;
        if (since) {
            dateSince = new Date(parseInt(since) * 1000);
        } else {
            // Par défaut : dernières 60 secondes
            dateSince = new Date(Date.now() - 60000);
        }

        // 1. Entrées visiteurs (créées après dateSince, non supprimés)
        const [entreesVisiteurs] = await db.query(`
            SELECT 
                'visiteur_entree' AS type,
                v.id,
                v.nom,
                v.prenom,
                v.heure_entree AS heure,
                v.created_at
            FROM visiteurs v
            WHERE v.created_at > ? AND v.deleted_at IS NULL
        `, [dateSince]);

        // 2. Sorties visiteurs (mises à jour après dateSince, avec heure_sortie non nulle)
        const [sortiesVisiteurs] = await db.query(`
            SELECT 
                'visiteur_sortie' AS type,
                v.id,
                v.nom,
                v.prenom,
                v.heure_sortie AS heure,
                v.updated_at
            FROM visiteurs v
            WHERE v.updated_at > ? AND v.heure_sortie IS NOT NULL AND v.deleted_at IS NULL
        `, [dateSince]);

        // 3. Pointages stagiaires (insérés après dateSince)
        const [pointages] = await db.query(`
            SELECT 
                CONCAT('stagiaire_', p.type) AS type,
                p.id,
                s.nom,
                s.prenom,
                p.heure,
                p.created_at
            FROM pointages_stagiaires p
            JOIN stagiaires s ON p.stagiaire_id = s.id
            WHERE p.created_at > ?
        `, [dateSince]);

        // Fusionner tous les événements
        const allEvents = [...entreesVisiteurs, ...sortiesVisiteurs, ...pointages];
        // Trier par date récente (optionnel)
        allEvents.sort((a, b) => {
            const dA = new Date(a.created_at || a.updated_at);
            const dB = new Date(b.created_at || b.updated_at);
            return dB - dA;
        });

        res.json({ events: allEvents });
    } catch (error) {
        console.error('❌ Erreur /api/notifications/last:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;