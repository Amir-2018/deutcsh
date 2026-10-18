/* ===================================================
   Deutschland QCM - teacher.js (côté client)
   Gestion : ajout de réponses, QR Code, PDF
   =================================================== */

// Données injectées par le serveur (EJS)
const QUESTIONS = window.QUESTIONS || [];
const TEST_ID = window.TEST_ID || null;

document.addEventListener('DOMContentLoaded', () => {
    // Champs de réponse par défaut (2)
    addAnswerInput();
    addAnswerInput();

    // Bouton "+ Réponse"
    document.getElementById('add-answer-btn').onclick = addAnswerInput;

    // Validation côté client du formulaire d'ajout de question
    document.getElementById('question-form').addEventListener('submit', (e) => {
        const questionText = document.getElementById('question-text').value.trim();
        const answerRows = document.querySelectorAll('#answers-container .answer-row');
        const correctRadio = document.querySelector('input[name="correctIndex"]:checked');

        if (!questionText) {
            e.preventDefault();
            alert('Veuillez saisir une question.');
            return;
        }

        let hasEmpty = false;
        answerRows.forEach(row => {
            if (!row.querySelector('input[type="text"]').value.trim()) hasEmpty = true;
        });
        if (hasEmpty) {
            e.preventDefault();
            alert('Veuillez remplir tous les champs de réponse.');
            return;
        }

        if (!correctRadio) {
            e.preventDefault();
            alert('Veuillez marquer la bonne réponse.');
            return;
        }
    });

    // Bouton PDF
    document.getElementById('generate-pdf-btn').onclick = generatePDF;

    // Confirmations de suppression
    const clearQ = document.getElementById('clear-questions-form');
    if (clearQ) {
        clearQ.addEventListener('submit', (e) => {
            if (!confirm('Voulez-vous vraiment supprimer toutes les questions ?')) e.preventDefault();
        });
    }
    const clearR = document.getElementById('clear-results-form');
    if (clearR) {
        clearR.addEventListener('submit', (e) => {
            if (!confirm('Voulez-vous vraiment supprimer tous les résultats ?')) e.preventDefault();
        });
    }

    // Générer le QR Code si un test vient d'être créé
    if (TEST_ID) {
        generateQR(TEST_ID);
    }
});

// ===== Ajouter un champ de réponse =====
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
    if (container.children.length <= 2) {
        alert('Au moins deux réponses sont requises.');
        return;
    }
    btn.parentElement.remove();
    // Renuméroter les radios
    const rows = container.querySelectorAll('.answer-row');
    rows.forEach((row, i) => {
        row.querySelector('input[type="radio"]').value = i;
    });
}

// ===== Générer le QR Code =====
function generateQR(testId) {
    const testUrl = window.location.origin + '/test/' + testId;
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
        text: testUrl,
        width: 256,
        height: 256,
        colorDark: '#111C1A',
        colorLight: '#FFFFFF',
        correctLevel: QRCode.CorrectLevel.M
    });
    document.getElementById('test-link').value = testUrl;
}

function copyLink() {
    const link = document.getElementById('test-link');
    link.select();
    link.setSelectionRange(0, 99999);
    document.execCommand('copy');
    alert('Lien copié !');
}

// ===== Générer le PDF avec les réponses =====
function generatePDF() {
    if (QUESTIONS.length === 0) {
        alert("Veuillez d'abord ajouter des questions.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    let y = 0;

    // Palette : lime #B8D52F (184,213,47) / dark #111C1A (17,28,26)
    // Bande lime en haut
    doc.setFillColor(184, 213, 47);
    doc.rect(0, 0, pageWidth, 8, 'F');
    // Bande foncée
    doc.setFillColor(17, 28, 26);
    doc.rect(0, 8, pageWidth, 22, 'F');

    y = 48;

    // Titre
    doc.setFontSize(22);
    doc.setTextColor(17, 28, 26);
    doc.setFont(undefined, 'bold');
    doc.text('Deutschland QCM', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(14);
    doc.setTextColor(58, 125, 47);
    doc.text('Test avec les bonnes réponses', pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setFontSize(10);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'normal');
    const dateStr = new Date().toLocaleDateString('fr-FR');
    doc.text('Créé le : ' + dateStr, pageWidth / 2, y, { align: 'center' });
    y += 8;

    doc.setDrawColor(184, 213, 47);
    doc.setLineWidth(0.5);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Questions
    const letters = ['a', 'b', 'c', 'd', 'e', 'f'];
    QUESTIONS.forEach((q, i) => {
        if (y > pageHeight - 40) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setTextColor(17, 28, 26);
        doc.setFont(undefined, 'bold');
        const qText = `Question ${i + 1} : ${q.text}`;
        const qLines = doc.splitTextToSize(qText, pageWidth - 40);
        doc.text(qLines, 20, y);
        y += qLines.length * 6 + 2;

        doc.setFont(undefined, 'normal');
        doc.setFontSize(11);

        q.options.forEach((opt, j) => {
            if (y > pageHeight - 25) {
                doc.addPage();
                y = 20;
            }

            const isCorrect = (j === q.correct);
            const prefix = isCorrect ? '[X]' : '[ ]';
            const optText = `${prefix}  ${letters[j]}) ${opt}`;

            if (isCorrect) {
                doc.setTextColor(58, 125, 47);
                doc.setFont(undefined, 'bold');
            } else {
                doc.setTextColor(80, 80, 80);
                doc.setFont(undefined, 'normal');
            }

            const optLines = doc.splitTextToSize(optText, pageWidth - 45);
            doc.text(optLines, 25, y);
            y += optLines.length * 6;

            if (isCorrect) {
                doc.setTextColor(58, 125, 47);
                doc.setFontSize(9);
                doc.text('>> Bonne réponse', pageWidth - 20, y - 1, { align: 'right' });
                doc.setFontSize(11);
            }
        });

        y += 6;
        doc.setDrawColor(212, 232, 106);
        doc.setLineWidth(0.3);
        doc.line(20, y, pageWidth - 20, y);
        y += 8;
    });

    // Pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let p = 1; p <= pageCount; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont(undefined, 'normal');
        doc.text(`Deutschland QCM - Page ${p} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    const filename = `Deutschland_QCM_${dateStr.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
}
