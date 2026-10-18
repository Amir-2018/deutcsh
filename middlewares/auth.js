/**
 * Deutschland QCM - Middleware d'authentification
 * Protège les routes du professeur (l'espace élève reste public via QR Code)
 */
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    }
    res.redirect('/login');
}

module.exports = { requireAuth };
