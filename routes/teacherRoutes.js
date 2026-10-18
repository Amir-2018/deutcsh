/**
 * Deutschland QCM - Routes Professeur (protégées)
 */
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { requireAuth } = require('../middlewares/auth');

// Toutes les routes professeur nécessitent une authentification
router.get('/', requireAuth, teacherController.getIndex);
router.post('/add-question', requireAuth, teacherController.addQuestion);
router.post('/delete-question/:index', requireAuth, teacherController.deleteQuestion);
router.post('/clear-questions', requireAuth, teacherController.clearQuestions);
router.post('/generate-test', requireAuth, teacherController.generateTest);
router.post('/clear-results', requireAuth, teacherController.clearResults);

module.exports = router;
