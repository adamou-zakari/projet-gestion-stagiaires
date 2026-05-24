const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// ─── Routes publiques ─────────────────────────────────────────────────────────
router.post('/register', authController.register);
router.post('/login',    authController.login);

// ─── Setup Wizard (premier démarrage) ────────────────────────────────────────
router.get('/setup/check',  authController.setupCheck);   // Vérifie si configuré
router.post('/setup',       authController.setupCreate);  // Crée le premier admin

// ─── Profil — accessible par tous les utilisateurs connectés ─────────────────
router.get('/me',              authMiddleware, authController.me);
router.put('/me',              authMiddleware, authController.updateMe);
router.put('/me/password',     authMiddleware, authController.updateMyPassword);

// ─── Réinitialisation système — admin uniquement ──────────────────────────────
router.delete('/reset-system', authMiddleware, roleMiddleware(['admin']), authController.resetSystem);
router.delete('/clear-data',   authMiddleware, roleMiddleware(['admin']), authController.clearData);
router.get('/users',       authMiddleware, roleMiddleware(['admin']), authController.getAllUsers);
router.put('/users/:id',   authMiddleware, roleMiddleware(['admin']), authController.updateUser);
router.delete('/users/:id',authMiddleware, roleMiddleware(['admin']), authController.deleteUser);

module.exports = router;