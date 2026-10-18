/**
 * Deutschland QCM - Contrôleur Élève
 */
const store = require('../data/store');
const { getAvatar } = require('../utils/avatar');

// GET /test/:id - Page du test (élève) - accessible uniquement via le QR Code
exports.getTest = (req, res) => {
    const test = store.tests.get(req.params.id);
    if (!test) {
        return res.render('test', { test: null, error: 'Test introuvable ou expiré.' });
    }
    res.render('test', { test, error: null });
};

// POST /test/:id/submit - Soumettre le test et calculer le score
exports.submitTest = (req, res) => {
    const test = store.tests.get(req.params.id);
    if (!test) {
        return res.redirect('/');
    }

    const name = (req.body.name || '').trim();
    if (!name) {
        return res.redirect('/test/' + req.params.id);
    }

    const answers = req.body.answers || {};

    // Calcul du score
    let score = 0;
    test.questions.forEach((q, i) => {
        if (answers[i] !== undefined && parseInt(answers[i]) === q.correct) {
            score++;
        }
    });

    const total = test.questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

    const result = {
        testId: test.id,
        name: name,
        score: score,
        total: total,
        percentage: percentage,
        date: new Date().toLocaleString('fr-FR')
    };

    // Sauvegarde du résultat dans le store + fichier JSON
    store.results.push(result);
    store.saveResults();

    // Notification temps réel au professeur (résultat final + avatar)
    const io = req.app.get('io');
    if (io) {
        io.to('teachers').emit('student_result', {
            ...result,
            avatar: getAvatar(name)
        });
    }

    // Message et emoji selon le pourcentage
    let emoji = '😕', message = 'Continuez à pratiquer !';
    if (percentage >= 90) { emoji = '🏆'; message = 'Excellent !'; }
    else if (percentage >= 75) { emoji = '🎉'; message = 'Très bien !'; }
    else if (percentage >= 50) { emoji = '👍'; message = 'Bien fait !'; }
    else if (percentage >= 25) { emoji = '🙂'; message = 'Pas mal !'; }

    res.render('result', { result, emoji, message });
};
