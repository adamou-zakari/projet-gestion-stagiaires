const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Récupérer toutes les directions
router.get('/', authMiddleware, async (req, res) => {
    try {
        const [directions] = await db.query('SELECT * FROM directions ORDER BY nom');
        res.json(directions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Ajouter une direction
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const { nom } = req.body;
        if (!nom) {
            return res.status(400).json({ message: 'Le nom est requis' });
        }
        const [result] = await db.query('INSERT INTO directions (nom) VALUES (?)', [nom]);
        res.status(201).json({ id: result.insertId, message: 'Direction ajoutée' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

// Supprimer une direction
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    try {
        const { id } = req.params;
        
        // Vérifier si des employés sont dans cette direction
        const [employes] = await db.query('SELECT COUNT(*) as total FROM employes WHERE direction_id = ?', [id]);
        if (employes[0].total > 0) {
            return res.status(400).json({ 
                message: `Impossible : ${employes[0].total} employé(s) dans cette direction` 
            });
        }
        
        const [result] = await db.query('DELETE FROM directions WHERE id = ?', [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Direction non trouvée' });
        }
        res.json({ message: 'Direction supprimée' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
});

module.exports = router;