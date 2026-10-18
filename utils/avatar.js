/**
 * Deutschland QCM - Utilitaire avatar
 * Génère initiales + couleur à partir du nom de l'élève
 */
const COLORS = [
    '#B8D52F', '#3A7D2F', '#5A8C3A', '#7CA82E',
    '#D4E86A', '#2E5A1F', '#8FB339', '#6BAE3F',
    '#9CBE2F', '#4A7C2A', '#A3BD26', '#111C1A'
];

function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) {
        return parts[0].substring(0, 2).toUpperCase();
    }
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
}

function getColor(name) {
    const n = name || '';
    let hash = 0;
    for (let i = 0; i < n.length; i++) {
        hash = n.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
}

function getAvatar(name) {
    return { initials: getInitials(name), color: getColor(name) };
}

module.exports = { getInitials, getColor, getAvatar };
