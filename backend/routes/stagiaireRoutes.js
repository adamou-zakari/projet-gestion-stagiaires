const express = require('express');
const router = express.Router();
const stagiaireController = require('../controllers/stagiaireController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Toutes les routes nécessitent d'être connecté
router.use(authMiddleware);

// =====================================================
// ROUTES ACCESSIBLES À TOUS (admin + agent sécurité)
// =====================================================

// Récupérer tous les stagiaires (avec statut présence)
router.get('/', stagiaireController.getAllStagiairesWithPresence);

// Récupérer un stagiaire par ID
router.get('/:id', stagiaireController.getStagiaireById);

// Récupérer l'historique des pointages d'un stagiaire
router.get('/:id/historique', stagiaireController.getHistoriquePointages);

// =====================================================
// ROUTES DE POINTAGE (admin + agent sécurité)
// =====================================================

// Enregistrer l'entrée d'un stagiaire
router.post('/:id/entree', stagiaireController.enregistrerEntreeStagiaire);

// Enregistrer la sortie d'un stagiaire
router.post('/:id/sortie', stagiaireController.enregistrerSortieStagiaire);

// =====================================================
// ROUTES ADMIN UNIQUEMENT (CRUD)
// =====================================================

// Créer un stagiaire
router.post('/', roleMiddleware(['admin']), stagiaireController.createStagiaire);

// Modifier un stagiaire
router.put('/:id', roleMiddleware(['admin']), stagiaireController.updateStagiaire);

// Supprimer un stagiaire
router.delete('/:id', roleMiddleware(['admin']), stagiaireController.deleteStagiaire);

module.exports = router;