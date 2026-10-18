/* ===================================================
   Deutschland QCM - student.js (côté client)
   Socket.io : notifie le professeur de la progression
   =================================================== */

const TEST_ID = window.TEST_ID || '';
const TOTAL_QUESTIONS = window.TOTAL_QUESTIONS || 0;

let socket = null;
let studentName = '';

document.addEventListener('DOMContentLoaded', () => {
    if (!TEST_ID) return;
    if (typeof io !== 'undefined') socket = io();

    // Étape 1 → Étape 2
    const startBtn = document.getElementById('start-btn');
    const nameInput = document.getElementById('name-input');
    const nameStep = document.getElementById('name-step');
    const testStep = document.getElementById('test-step');
    const nameHidden = document.getElementById('name-hidden');
    if (!startBtn || !nameInput || !nameStep || !testStep || !nameHidden) return;

    let testStarted = false;
    const startTest = () => {
        if (testStarted) return;
        const name = nameInput.value.trim();
        if (!name) { showPopup('Veuillez saisir votre nom.', { type: 'warning' }); return; }
        testStarted = true;
        studentName = name;
        nameHidden.value = name;
        nameInput.readOnly = true;
        startBtn.disabled = true;
        startBtn.classList.add('start-btn-started');
        startBtn.innerHTML = '<i class="fa-solid fa-circle-check"></i> Test commencé';
        nameStep.querySelector('p').textContent = 'Le test a commencé. Bonne chance !';
        testStep.classList.remove('hidden');
        // Notifier le professeur que l'élève a commencé
        if (socket) socket.emit('student_start', { testId: TEST_ID, name: name, total: TOTAL_QUESTIONS });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    startBtn.addEventListener('click', startTest);
    nameInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            startTest();
        }
    });

    // Comptage des réponses en temps réel
    const form = document.getElementById('test-form');
    if (!form) return;
    const submitBtn = document.getElementById('submit-test-btn');
    if (!submitBtn) return;

    const updateSubmitButton = () => {
        const answered = form.querySelectorAll('input[type="radio"]:checked').length;
        submitBtn.hidden = TOTAL_QUESTIONS === 0 || answered < TOTAL_QUESTIONS;
        return answered;
    };

    form.addEventListener('change', (e) => {
        if (!e.target.matches('input[type="radio"]')) return;
        const answered = updateSubmitButton();
        if (socket) socket.emit('student_progress', {
            testId: TEST_ID,
            name: studentName,
            answered: answered,
            total: TOTAL_QUESTIONS
        });
    });

    // À la soumission : notifier la fin puis laisser le formulaire POSTer
    form.addEventListener('submit', (event) => {
        const answered = updateSubmitButton();
        if (answered < TOTAL_QUESTIONS || TOTAL_QUESTIONS === 0) {
            event.preventDefault();
            showPopup('Veuillez répondre à toutes les questions avant de soumettre le test.', { type: 'warning' });
            return;
        }
        if (socket) socket.emit('student_finish', {
            testId: TEST_ID,
            name: studentName,
            answered: answered,
            total: TOTAL_QUESTIONS
        });
    });

    updateSubmitButton();
});
