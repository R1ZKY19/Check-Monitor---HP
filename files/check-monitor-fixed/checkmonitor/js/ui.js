/**
 * UI Helpers - Toast notifications & small shared utilities
 * (Sebelumnya showToast() dipanggil di banyak file tapi tidak pernah didefinisikan.)
 */

const TOAST_ICONS = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    warning: 'fa-triangle-exclamation',
    info: 'fa-circle-info'
};

function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('[toast]', type, message);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    const icon = TOAST_ICONS[type] || TOAST_ICONS.info;
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span class="toast-message"></span>
        <button type="button" aria-label="Tutup">&times;</button>
    `;
    toast.querySelector('.toast-message').textContent = message;

    const remove = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('button').addEventListener('click', remove);
    container.appendChild(toast);

    if (duration > 0) setTimeout(remove, duration);
}

function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}
