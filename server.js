/**
 * Deutschland QCM - Point d'entrée du serveur
 */
const app = require('./app');
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🇩🇪 Deutschland QCM serveur démarré sur http://localhost:${PORT}`);
});
