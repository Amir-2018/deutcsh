/**
 * Deutschland QCM - Magasin de données en mémoire
 * (Pour une application en production, utiliser une base de données)
 */
const store = {
    questions: [],    // Questions en cours de construction par le professeur
    tests: new Map(), // Tests générés : id -> { id, questions, createdAt }
    results: []       // Résultats des élèves { testId, name, score, total, percentage, date }
};

module.exports = store;
