/* ===================================================
   Deutschland QCM - teacher.js (côté client)
   QR Code, PDF, Socket.io (progression + classement)
   =================================================== */

const QUESTIONS = window.QUESTIONS || [];
const TEST_ID = window.TEST_ID || null;

// ---- Avatar (côté client, pour les mises à jour temps réel) ----
const AVATAR_COLORS = [
    '#B8D52F', '#3A7D2F', '#5A8C3A', '#7CA82E',
    '#D4E86A', '#2E5A1F', '#8FB339', '#6BAE3F',
    '#9CBE2F', '#4A7C2A', '#A3BD26', '#111C1A'
];
function getInitials(name) {
    const parts = (name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
function getColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

document.addEventListener('DOMContentLoaded', () => {
    // Champs de réponse par défaut (2)
    addAnswerInput();
    addAnswerInput();
    document.getElementById('add-answer-btn').onclick = addAnswerInput;

    // Validation du formulaire d'ajout de question
    document.getElementById('question-form').addEventListener('submit', (e) => {
        const questionText = document.getElementById('question-text').value.trim();
        const answerRows = document.querySelectorAll('#answers-container .answer-row');
        const correctRadio = document.querySelector('input[name="correctIndex"]:checked');
        if (!questionText) { e.preventDefault(); showPopup('Veuillez saisir une question.', { type: 'warning' }); return; }
        let hasEmpty = false;
        answerRows.forEach(r => { if (!r.querySelector('input[type="text"]').value.trim()) hasEmpty = true; });
        if (hasEmpty) { e.preventDefault(); showPopup('Veuillez remplir tous les champs de réponse.', { type: 'warning' }); return; }
        if (!correctRadio) { e.preventDefault(); showPopup('Veuillez marquer la bonne réponse.', { type: 'warning' }); return; }
    });

    document.getElementById('generate-pdf-btn').onclick = generatePDF;

    const clearQ = document.getElementById('clear-questions-form');
    if (clearQ) clearQ.addEventListener('submit', (e) => {
        e.preventDefault();
        showConfirmPopup('Voulez-vous vraiment supprimer toutes les questions ?').then((confirmed) => {
            if (confirmed) clearQ.submit();
        });
    });
    const clearR = document.getElementById('clear-results-form');
    if (clearR) clearR.addEventListener('submit', (e) => {
        e.preventDefault();
        showConfirmPopup('Voulez-vous vraiment supprimer tous les résultats ?').then((confirmed) => {
            if (confirmed) clearR.submit();
        });
    });

    const resultsList = document.getElementById('results-list');
    const answersModal = document.getElementById('answers-modal');
    const answersModalTitle = document.getElementById('answers-modal-title');
    const answersModalContent = document.getElementById('answers-modal-content');
    const closeAnswersModal = () => answersModal.classList.add('hidden');

    resultsList.addEventListener('click', (event) => {
        const button = event.target.closest('.result-answers-btn');
        if (!button) return;

        const resultItem = button.closest('.result-item');
        let answers;
        try {
            answers = JSON.parse(resultItem.dataset.answers || '[]');
        } catch (error) {
            console.error('Impossible de lire les réponses de cet élève :', error);
            showPopup('Les réponses de cet élève ne peuvent pas être affichées.', { type: 'warning' });
            return;
        }

        answersModalTitle.textContent = `Réponses de ${resultItem.dataset.name}`;
        answersModalContent.replaceChildren();

        if (answers.length === 0) {
            const notice = document.createElement('p');
            notice.className = 'answers-unavailable';
            notice.textContent = 'Les réponses détaillées ne sont pas disponibles pour ce résultat.';
            answersModalContent.appendChild(notice);
        } else {
            answers.forEach((answer, index) => {
                const row = document.createElement('div');
                row.className = `answer-review ${answer.isCorrect ? 'answer-review-correct' : 'answer-review-incorrect'}`;

                const question = document.createElement('h4');
                question.textContent = `Question ${index + 1} : ${answer.question}`;
                row.appendChild(question);

                const selected = document.createElement('p');
                selected.textContent = `Réponse de l'élève : ${answer.selectedAnswer ?? 'Aucune réponse'}`;
                row.appendChild(selected);

                const correct = document.createElement('p');
                correct.textContent = `Bonne réponse : ${answer.correctAnswer}`;
                row.appendChild(correct);

                answersModalContent.appendChild(row);
            });
        }

        answersModal.classList.remove('hidden');
        document.getElementById('answers-modal-close').focus();
    });

    document.getElementById('answers-modal-close').addEventListener('click', closeAnswersModal);
    answersModal.addEventListener('click', (event) => {
        if (event.target === answersModal) closeAnswersModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !answersModal.classList.contains('hidden')) closeAnswersModal();
    });

    if (TEST_ID) {
        generateQR(TEST_ID);
        openQrModal();
    }

    // ---- Popup QR Code : fermeture ----
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) {
        qrModal.addEventListener('click', (e) => {
            if (e.target === qrModal) closeQrModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeQrModal();
        });
    }

    // ---- Socket.io : écoute temps réel ----
    if (typeof io !== 'undefined') {
        const socket = io();
        socket.emit('join_teacher');

        const liveBox = document.getElementById('live-progress');
        const liveStudents = {}; // name -> élément DOM

        // Un élève commence un test
        socket.on('student_start', (data) => {
            if (liveStudents[data.name]) return;
            createLiveStudent(data.name, 0, data.total || 0);
        });

        // Progression d'un élève (réponse à une question)
        socket.on('student_progress', (data) => {
            if (!liveStudents[data.name]) {
                createLiveStudent(data.name, data.answered, data.total);
            } else {
                updateLiveStudent(data.name, data.answered, data.total);
            }
        });

        // Un élève a terminé : on le retire de "en cours" et on l'ajoute aux résultats
        socket.on('student_result', (data) => {
            if (liveStudents[data.name]) {
                liveStudents[data.name].remove();
                delete liveStudents[data.name];
                checkLiveEmpty();
            }
            addResultToList(data);
            updateLeaderboard(data);
        });

        // Un élève se déconnecte
        socket.on('student_disconnect', () => { /* géré par nom si nécessaire */ });

        function createLiveStudent(name, answered, total) {
            const empty = liveBox.querySelector('.empty-hint');
            if (empty) empty.remove();
            const item = document.createElement('div');
            item.className = 'live-student';
            const color = getColor(name);
            const initials = getInitials(name);
            item.innerHTML = `
                <div class="avatar" style="background:${color}">${initials}</div>
                <div class="live-info">
                    <div class="live-name">${escapeHtml(name)}</div>
                    <div class="live-bar-wrap">
                        <div class="live-bar"></div>
                    </div>
                    <div class="live-count">0 / ${total}</div>
                </div>
            `;
            liveBox.appendChild(item);
            liveStudents[name] = item;
            updateLiveStudent(name, answered, total);
        }

        function updateLiveStudent(name, answered, total) {
            const item = liveStudents[name];
            if (!item) return;
            const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
            item.querySelector('.live-bar').style.width = pct + '%';
            item.querySelector('.live-count').textContent = `${answered} / ${total}`;
        }

        function checkLiveEmpty() {
            if (Object.keys(liveStudents).length === 0) {
                liveBox.innerHTML = '<p class="empty-hint">Aucun élève ne passe le test actuellement.</p>';
            }
        }

        function addResultToList(data) {
            const list = document.getElementById('results-list');
            const empty = list.querySelector('.empty-hint');
            if (empty) empty.remove();
            // éviter les doublons
            if (list.querySelector(`.result-item[data-name="${cssEscape(data.name)}"]`)) return;
            const item = document.createElement('div');
            item.className = 'result-item';
            item.setAttribute('data-name', data.name);
            item.setAttribute('data-percentage', data.percentage);
            item.setAttribute('data-answers', JSON.stringify(data.answers || []));
            item.innerHTML = `
                <div class="result-left">
                    <div class="avatar" style="background:${data.avatar.color}">${data.avatar.initials}</div>
                    <div>
                        <span class="result-name">${escapeHtml(data.name)}</span>
                        <span class="result-date"> — ${data.date || ''}</span>
                    </div>
                </div>
                <div class="result-score">${data.score}/${data.total} (${data.percentage}%)</div>
                <div class="result-bar">
                    <div class="result-bar-fill" style="width: ${data.percentage}%"></div>
                </div>
                <button type="button" class="btn btn-icon btn-secondary result-answers-btn" title="Voir les réponses de ${escapeHtml(data.name)}" aria-label="Voir les réponses de ${escapeHtml(data.name)}">
                    <i class="fa-solid fa-eye" aria-hidden="true"></i>
                </button>
            `;
            list.appendChild(item);
            const sortedItems = [...list.querySelectorAll('.result-item')]
                .sort((a, b) => Number(b.dataset.percentage) - Number(a.dataset.percentage));
            sortedItems.forEach((result) => list.appendChild(result));
        }

        function updateLeaderboard(data) {
            // Récupère tous les résultats (DOM) et recalcule le top 2
            const items = [...document.querySelectorAll('#results-list .result-item')];
            const all = items.map(it => {
                const scoreText = it.querySelector('.result-score').textContent;
                const m = scoreText.match(/(\d+)\/(\d+)\s*\((\d+)%\)/);
                return { name: it.getAttribute('data-name'), percentage: m ? parseInt(m[3]) : 0 };
            });
            all.sort((a, b) => b.percentage - a.percentage);
            renderLeaderboard(all.slice(0, 2));
        }

        function renderLeaderboard(top) {
            const lb = document.getElementById('leaderboard-list');
            if (top.length === 0) {
                lb.innerHTML = '<p class="leaderboard-empty">Aucun élève pour le moment</p>';
                return;
            }
            lb.innerHTML = top.map((r, i) => `
                <div class="leaderboard-item rank-${i + 1}">
                    <div class="rank-badge">${i + 1}</div>
                    <div class="avatar" style="background:${getColor(r.name)}">${getInitials(r.name)}</div>
                    <div class="leaderboard-info">
                        <span class="leaderboard-name">${escapeHtml(r.name)}</span>
                        <span class="leaderboard-score">${r.percentage}%</span>
                    </div>
                </div>
            `).join('');
        }
    }
});

// ---- Helpers ----
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function cssEscape(t) { return (t || '').replace(/"/g, '\\"'); }

// ---- Ajouter / supprimer un champ de réponse ----
function addAnswerInput() {
    const container = document.getElementById('answers-container');
    const index = container.children.length;
    const row = document.createElement('div');
    row.className = 'answer-row';
    row.innerHTML = `
        <input type="radio" name="correctIndex" value="${index}" title="Bonne réponse">
        <input type="text" name="answers[]" placeholder="Réponse ${index + 1}">
        <button type="button" class="remove-answer" onclick="removeAnswerInput(this)" title="Supprimer"><i class="fa-solid fa-xmark"></i></button>
    `;
    container.appendChild(row);
}
function removeAnswerInput(btn) {
    const container = document.getElementById('answers-container');
    if (container.children.length <= 2) { showPopup('Au moins deux réponses sont requises.', { type: 'warning' }); return; }
    btn.parentElement.remove();
    const rows = container.querySelectorAll('.answer-row');
    rows.forEach((row, i) => { row.querySelector('input[type="radio"]').value = i; });
}

// ---- QR Code ----
function openQrModal() {
    const m = document.getElementById('qr-modal');
    if (m) m.classList.remove('hidden');
}
function closeQrModal() {
    const m = document.getElementById('qr-modal');
    if (m) m.classList.add('hidden');
}

function generateQR(testId) {
    const testUrl = window.location.origin + '/test/' + testId;
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: testUrl, width: 256, height: 256,
        colorDark: '#111C1A', colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
    });
    document.getElementById('test-link').value = testUrl;
}
function copyLink() {
    const link = document.getElementById('test-link');
    link.select(); link.setSelectionRange(0, 99999);
    document.execCommand('copy'); showPopup('Lien copié !', { type: 'success' });
}

// ---- PDF ----
function generatePDF() {
    if (QUESTIONS.length === 0) { showPopup("Veuillez d'abord ajouter des questions.", { type: 'warning' }); return; }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = 210, pageHeight = 297;
    let y = 0;
    doc.setFillColor(184, 213, 47); doc.rect(0, 0, pageWidth, 8, 'F');
    doc.setFillColor(17, 28, 26); doc.rect(0, 8, pageWidth, 22, 'F');
    y = 48;
    doc.setFontSize(22); doc.setTextColor(17, 28, 26); doc.setFont(undefined, 'bold');
    doc.text('Deutschland QCM', pageWidth / 2, y, { align: 'center' }); y += 10;
    doc.setFontSize(14); doc.setTextColor(58, 125, 47);
    doc.text('Test avec les bonnes réponses', pageWidth / 2, y, { align: 'center' }); y += 8;
    doc.setFontSize(10); doc.setTextColor(120, 120, 120); doc.setFont(undefined, 'normal');
    const dateStr = new Date().toLocaleDateString('fr-FR');
    doc.text('Créé le : ' + dateStr, pageWidth / 2, y, { align: 'center' }); y += 8;
    doc.setDrawColor(184, 213, 47); doc.setLineWidth(0.5); doc.line(20, y, pageWidth - 20, y); y += 10;
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    QUESTIONS.forEach((q, i) => {
        if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        doc.setFontSize(12); doc.setTextColor(17, 28, 26); doc.setFont(undefined, 'bold');
        const qLines = doc.splitTextToSize(`Question ${i + 1} : ${q.text}`, pageWidth - 40);
        doc.text(qLines, 20, y); y += qLines.length * 6 + 2;
        doc.setFont(undefined, 'normal'); doc.setFontSize(11);
        q.options.forEach((opt, j) => {
            if (y > pageHeight - 25) { doc.addPage(); y = 20; }
            const isCorrect = (j === q.correct);
            const optText = `${isCorrect ? '[X]' : '[ ]'}  ${letters[j]}) ${opt}`;
            if (isCorrect) { doc.setTextColor(58, 125, 47); doc.setFont(undefined, 'bold'); }
            else { doc.setTextColor(80, 80, 80); doc.setFont(undefined, 'normal'); }
            const optLines = doc.splitTextToSize(optText, pageWidth - 45);
            doc.text(optLines, 25, y); y += optLines.length * 6;
            if (isCorrect) { doc.setTextColor(58, 125, 47); doc.setFontSize(9); doc.text('', pageWidth - 20, y - 1, { align: 'right' }); doc.setFontSize(11); }
        });
        y += 6; doc.setDrawColor(212, 232, 106); doc.setLineWidth(0.3); doc.line(20, y, pageWidth - 20, y); y += 8;
    });
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p); doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.setFont(undefined, 'normal');
        doc.text(`Deutschland QCM - Page ${p} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }
    doc.save(`Deutschland_QCM_${dateStr.replace(/\//g, '-')}.pdf`);
}
