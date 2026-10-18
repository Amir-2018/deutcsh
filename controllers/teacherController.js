/**
 * Deutschland QCM - Contrôleur Professeur
 */
const store = require('../data/store');

// GET / - Page professeur (affichée par défaut)
exports.getIndex = (req, res) => {
    const testId = req.query.generated || null;
    res.render('teacher', {
        questions: store.questions,
        results: store.results,
        testId: testId,
        error: req.query.error || null
    });
};

// POST /add-question - Ajouter une nouvelle question
exports.addQuestion = (req, res) => {
    const { questionText, answers, correctIndex } = req.body;

    if (!questionText || !questionText.trim()) {
        return res.redirect('/?error=' + encodeURIComponent('Veuillez saisir une question.'));
    }

    // Les réponses arrivent sous forme de tableau grâce au name="answers[]"
    let answerArray = Array.isArray(answers) ? answers : [answers];
    answerArray = answerArray.map(a => (a || '').trim());
    const hasEmpty = answerArray.some(a => a === '');

    if (answerArray.length < 2 || hasEmpty) {
        return res.redirect('/?error=' + encodeURIComponent('Veuillez remplir au moins deux réponses.'));
    }

    if (correctIndex === undefined || correctIndex === '') {
        return res.redirect('/?error=' + encodeURIComponent('Veuillez marquer la bonne réponse.'));
    }

    store.questions.push({
        id: Date.now(),
        text: questionText.trim(),
        options: answerArray,
        correct: parseInt(correctIndex)
    });

    res.redirect('/');
};

// POST /delete-question/:index - Supprimer une question
exports.deleteQuestion = (req, res) => {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < store.questions.length) {
        store.questions.splice(index, 1);
    }
    res.redirect('/');
};

// POST /clear-questions - Supprimer toutes les questions
exports.clearQuestions = (req, res) => {
    store.questions = [];
    res.redirect('/');
};

// POST /generate-test - Générer un test (crée un ID pour le QR Code)
exports.generateTest = (req, res) => {
    if (store.questions.length === 0) {
        return res.redirect('/?error=' + encodeURIComponent("Veuillez d'abord ajouter des questions."));
    }
    const testId = 'test_' + Date.now();
    // Snapshot des questions actuelles
    store.tests.set(testId, {
        id: testId,
        questions: JSON.parse(JSON.stringify(store.questions)),
        createdAt: new Date()
    });
    res.redirect('/?generated=' + testId);
};

// POST /clear-results - Supprimer tous les résultats
exports.clearResults = (req, res) => {
    store.results = [];
    res.redirect('/');
};
