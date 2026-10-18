/**
 * Deutschland QCM - Contrôleur d'authentification
 * Identifiants par défaut : admin / admin
 */
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

// GET /login - Formulaire de connexion
exports.getLoginForm = (req, res) => {
    res.render('login', { error: null });
};

// POST /login - Traitement de la connexion
exports.login = (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.user = username;
        return res.redirect('/');
    }

    res.render('login', { error: 'Identifiant ou mot de passe incorrect.' });
};

// GET /logout - Déconnexion
exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};
