const express = require('express');
const router = express.Router();
const historiqueController = require('../controllers/historiqueController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/visiteurs', historiqueController.getHistoriqueVisiteurs);
router.get('/stagiaires', historiqueController.getHistoriqueStagiaires);
router.get('/logs', historiqueController.getHistoriqueLogs);
router.get('/stats', historiqueController.getHistoriqueStats);

module.exports = router;