/**
 * Deutschland QCM - Magasin de données
 * - questions/tests : en mémoire
 * - results : persistés dans data/results.json
 */
const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, 'results.json');

const store = {
    questions: [],    // Questions en cours de construction par le professeur
    tests: new Map(), // Tests générés : id -> { id, questions, createdAt }
    results: []       // Résultats des élèves (persistés dans results.json)
};

// Sauvegarder les résultats dans le fichier JSON
store.saveResults = function () {
    try {
        fs.writeFileSync(RESULTS_FILE, JSON.stringify(store.results, null, 2));
    } catch (e) {
        console.error('Erreur lors de la sauvegarde de results.json :', e.message);
    }
};

// Charger les résultats depuis le fichier JSON au démarrage
function loadResults() {
    try {
        if (fs.existsSync(RESULTS_FILE)) {
            const data = fs.readFileSync(RESULTS_FILE, 'utf-8');
            store.results = JSON.parse(data);
            console.log(`📋 ${store.results.length} résultat(s) chargé(s) depuis results.json`);
        }
    } catch (e) {
        console.error('Erreur lors du chargement de results.json :', e.message);
    }
}

loadResults();

module.exports = store;
