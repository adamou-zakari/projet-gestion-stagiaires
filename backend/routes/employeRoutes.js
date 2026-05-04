const express        = require('express');
const router         = express.Router();
const ctrl           = require('../controllers/employeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Toutes les routes nécessitent d'être connecté
router.use(authMiddleware);

// ── Directions ────────────────────────────────────────────────
// Lecture — tout le monde
router.get('/directions', ctrl.getAllDirections);

// Écriture directions — admin uniquement
router.post('/directions',    roleMiddleware(['admin']), ctrl.createDirection);
router.delete('/directions/:id', roleMiddleware(['admin']), ctrl.deleteDirection);

// ── Employés ──────────────────────────────────────────────────
// Lecture — tout le monde
router.get('/',    ctrl.getAllEmployes);
router.get('/:id', ctrl.getEmployeById);

// ✅ Bascule présence (accessible à tout utilisateur authentifié : agent ou admin)
router.put('/:id/presence', ctrl.togglePresenceEmploye);

// Écriture — admin uniquement
router.post('/',      roleMiddleware(['admin']), ctrl.createEmploye);
router.put('/:id',    roleMiddleware(['admin']), ctrl.updateEmploye);
router.delete('/:id', roleMiddleware(['admin']), ctrl.deleteEmploye);

module.exports = router;