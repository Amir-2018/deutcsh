/**
 * Deutschland QCM - Point d'entrée du serveur
 */
const http = require('http');
const app = require('./app');
const { Server } = require('socket.io');

// Création du serveur HTTP + Socket.io
const server = http.createServer(app);
const io = new Server(server);

// Rendre io accessible depuis les contrôleurs via req.app.get('io')
app.set('io', io);

// Gestionnaire d'événements Socket.io
require('./socket/socketHandler')(io);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🇩🇪 Deutschland QCM serveur démarré sur http://localhost:${PORT}`);
});
