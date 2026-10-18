/**
 * Deutschland QCM - Routes d'authentification (publiques)
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET /login - Formulaire de connexion
router.get('/login', authController.getLoginForm);

// POST /login - Traitement de la connexion
router.post('/login', authController.login);

// GET /logout - Déconnexion
router.get('/logout', authController.logout);

module.exports = router;
