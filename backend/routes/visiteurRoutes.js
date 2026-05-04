const express = require('express');
const router  = express.Router();
const visiteurController = require('../controllers/visiteurController');
const authMiddleware     = require('../middleware/authMiddleware');

// Toutes les routes nécessitent d'être connecté
router.use(authMiddleware);

// ── Lecture ──────────────────────────────────────────────────────
router.get('/',              visiteurController.getAllVisiteurs);
router.get('/today',         visiteurController.getVisiteursToday);
router.get('/present',       visiteurController.getVisiteursPresent);
router.get('/date/:date',    visiteurController.getVisiteursByDate);
router.get('/deleted',       visiteurController.getDeletedVisiteurs); // ADMIN seulement
router.get('/:id',           visiteurController.getVisiteurById);

// ── Création ─────────────────────────────────────────────────────
router.post('/entree',       visiteurController.enregistrerEntree);

// ── Mise à jour ──────────────────────────────────────────────────
// sortie/:id doit être AVANT /:id pour ne pas entrer en conflit
router.put('/sortie/:id',    visiteurController.enregistrerSortie);
router.put('/:id',           visiteurController.updateVisiteur);

// ── Restauration ─────────────────────────────────────────────────
router.put('/restore/:id',   visiteurController.restoreVisiteur); // ADMIN seulement

// ── Suppression (soft delete) ───────────────────────────────────
router.delete('/:id',        visiteurController.deleteVisiteur);

module.exports = router;