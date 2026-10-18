/**
 * Deutschland QCM - Configuration de l'application Express
 */
const express = require('express');
const path = require('path');
const session = require('express-session');
const app = express();

// Configuration du moteur de templates EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.urlencoded({ extended: true })); // parsing des formulaires (qs)
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // fichiers statiques (css, js)

// Sessions (gestion de l'authentification)
app.use(session({
    secret: 'deutschland-qcm-secret-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3600000 } // 1 heure
}));

// Rendre l'utilisateur connecté disponible dans toutes les vues (navbar)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Routes
app.use('/', require('./routes/authRoutes'));     // /login, /logout (public)
app.use('/', require('./routes/teacherRoutes'));   // / (protégé par requireAuth)
app.use('/', require('./routes/studentRoutes'));   // /test/:id (public, via QR Code)

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).render('error', { message: 'La page demandée est introuvable.' });
});

module.exports = app;
