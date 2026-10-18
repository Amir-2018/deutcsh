/**
 * Deutschland QCM - Routes Élève
 * L'espace élève n'est accessible que via le QR Code (GET /test/:id)
 */
const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');

// GET /test/:id - Page du test (élève)
router.get('/test/:id', studentController.getTest);

// POST /test/:id/submit - Soumettre le test
router.post('/test/:id/submit', studentController.submitTest);

module.exports = router;
