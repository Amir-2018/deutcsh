/* ===================================================
   Deutschland QCM - student.js (côté client)
   Socket.io : notifie le professeur de la progression
   =================================================== */

const TEST_ID = window.TEST_ID || '';
const TOTAL_QUESTIONS = window.TOTAL_QUESTIONS || 0;

let socket = null;
let studentName = '';

document.addEventListener('DOMContentLoaded', () => {
    if (!TEST_ID || typeof io === 'undefined') return;

    socket = io();

    // Étape 1 → Étape 2
    const startBtn = document.getElementById('start-btn');
    const nameInput = document.getElementById('name-input');
    const nameStep = document.getElementById('name-step');
    const testStep = document.getElementById('test-step');
    const nameHidden = document.getElementById('name-hidden');

    startBtn.addEventListener('click', () => {
        const name = nameInput.value.trim();
        if (!name) { showPopup('Veuillez saisir votre nom.', { type: 'warning' }); return; }
        studentName = name;
        nameHidden.value = name;
        nameStep.classList.add('hidden');
        testStep.classList.remove('hidden');
        // Notifier le professeur que l'élève a commencé
        socket.emit('student_start', { testId: TEST_ID, name: name, total: TOTAL_QUESTIONS });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Comptage des réponses en temps réel
    const form = document.getElementById('test-form');
    form.addEventListener('change', (e) => {
        if (e.target.matches('input[type="radio"]')) {
            const answered = form.querySelectorAll('input[type="radio"]:checked').length;
            socket.emit('student_progress', {
                testId: TEST_ID,
                name: studentName,
                answered: answered,
                total: TOTAL_QUESTIONS
            });
        }
    });

    // À la soumission : notifier la fin puis laisser le formulaire POSTer
    form.addEventListener('submit', () => {
        const answered = form.querySelectorAll('input[type="radio"]:checked').length;
        socket.emit('student_finish', {
            testId: TEST_ID,
            name: studentName,
            answered: answered,
            total: TOTAL_QUESTIONS
        });
    });
});
