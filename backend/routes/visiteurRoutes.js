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
router.get('/deleted',       visiteurController.getDeletedVisiteurs); // ADMIN — AVANT /:id
router.get('/date/:date',    visiteurController.getVisiteursByDate);
router.get('/:id',           visiteurController.getVisiteurById);

// ── Création ─────────────────────────────────────────────────────
router.post('/entree',       visiteurController.enregistrerEntree);

// ── Mise à jour — routes spécifiques AVANT /:id ──────────────────
router.put('/sortie/:id',    visiteurController.enregistrerSortie);   // AVANT /:id
router.put('/restore/:id',   visiteurController.restoreVisiteur);     // AVANT /:id
router.put('/:id',           visiteurController.updateVisiteur);

// ── Suppression (soft delete) ────────────────────────────────────
router.delete('/:id',        visiteurController.deleteVisiteur);

module.exports = router;