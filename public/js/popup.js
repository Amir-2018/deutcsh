/* ===================================================
   Deutschland QCM - popup commun (côté client)
   =================================================== */

const popupOverlay = document.getElementById('app-popup');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const popupIcon = document.getElementById('popup-icon');
const popupCancel = document.getElementById('popup-cancel');
const popupConfirm = document.getElementById('popup-confirm');

let activePopupResolve = null;
let previousFocus = null;
let popupQueue = Promise.resolve();

function enqueuePopup(openPopup) {
    const result = popupQueue.then(openPopup);
    popupQueue = result.then(() => undefined);
    return result;
}

function openPopup({ title, message, type, confirm, confirmLabel }) {
    return new Promise((resolve) => {
        previousFocus = document.activeElement;
        popupTitle.textContent = title;
        popupMessage.textContent = message;
        popupIcon.className = `popup-icon popup-icon-${type}`;
        popupIcon.innerHTML = type === 'success'
            ? '<i class="fa-solid fa-circle-check"></i>'
            : type === 'warning'
                ? '<i class="fa-solid fa-triangle-exclamation"></i>'
                : '<i class="fa-solid fa-circle-info"></i>';
        popupCancel.hidden = !confirm;
        popupConfirm.textContent = confirm ? confirmLabel : 'OK';
        popupOverlay.hidden = false;
        activePopupResolve = resolve;
        popupConfirm.focus();
    });
}

function closePopup(result) {
    if (popupOverlay.hidden || !activePopupResolve) return;
    popupOverlay.hidden = true;
    const resolve = activePopupResolve;
    activePopupResolve = null;
    resolve(result);
    if (previousFocus instanceof HTMLElement && previousFocus.isConnected) {
        previousFocus.focus();
    }
}

popupConfirm.addEventListener('click', () => closePopup(true));
popupCancel.addEventListener('click', () => closePopup(false));
popupOverlay.addEventListener('click', (event) => {
    if (event.target === popupOverlay) closePopup(false);
});
document.addEventListener('keydown', (event) => {
    if (!popupOverlay.hidden && event.key === 'Escape') closePopup(false);
});

window.showPopup = (message, { title = 'Information', type = 'info' } = {}) =>
    enqueuePopup(() => openPopup({ title, message, type, confirm: false }));

window.showConfirmPopup = (message, { title = 'Confirmation', confirmLabel = 'Confirmer' } = {}) =>
    enqueuePopup(() => openPopup({ title, message, type: 'warning', confirm: true, confirmLabel }));
