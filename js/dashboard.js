/**
 * Dashboard Handler + modern UI layer
 */

function bootModernUI() {
    if (!document.querySelector('link[data-modern-ui]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/modern.css?v=2';
        link.dataset.modernUi = '1';
        document.head.appendChild(link);
    }

    document.documentElement.dataset.cmReady = '1';
    setupDateReviewFilters();
    updateSystemClock();
    setInterval(updateSystemClock, 1000);
}

function updateSystemClock() {
    const el = document.getElementById('headerTime');
    if (!el) return;
    el.textContent = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
}

function setupDateReviewFilters() {
    const toolbar = document.querySelector('#page-datahp .search-filters');
    if (!toolbar || toolbar.dataset.reviewReady) return;
    toolbar.dataset.reviewReady = '1';

    const makeDate = (id, label) => {
        const wrap = document.createElement('label');
        wrap.className = 'cm-date-filter';
        wrap.innerHTML = `<span>${label}</span><input type="date" id="${id}">`;
        wrap.querySelector('input').addEventListener('change', applyReviewDateFilter);
        return wrap;
    };

    toolbar.appendChild(makeDate('reviewDateFrom', 'Dari'));
    toolbar.appendChild(makeDate('reviewDateTo', 'Sampai'));

    const clear = document.createElement('button');
    clear.type = 'button';
    clear.className = 'cm-clear-filter';
    clear.innerHTML = '<i class="fas fa-rotate-left"></i> Reset';
    clear.addEventListener('click', () => {
        ['reviewDateFrom', 'reviewDateTo'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
        if (typeof applyDataFilters === 'function') applyDataFilters();
    });
    toolbar.appendChild(clear);
}

function applyReviewDateFilter() {
    if (typeof applyDataFilters === 'function') applyDataFilters();
}

async function loadDashboard() {
    bootModernUI();
    try {
        const response = await apiRequest('getDashboardStats', {});
        if (response.success && response.data) {
            const stats = response.data;
            document.getElementById('statOnline').textContent = stats.online || 0;
            document.getElementById('statChecking').textContent = stats.checking || 0;
            document.getElementById('statCompleted').textContent = stats.completed || 0;
            document.getElementById('statPending').textContent = stats.pending || 0;
            document.getElementById('onlineCount').textContent = stats.online || 0;
        }
    } catch (e) {
        console.error('Load dashboard error:', e);
    }

    loadLiveActivities();
    loadOnlineUsersList();
}

async function loadLiveActivities() {
    const container = document.getElementById('liveActivities');
    if (!container) return;
    try {
        const response = await apiRequest('getRecentActivities', { limit: 20 });
        if (response.success && response.data && response.data.length > 0) {
            container.innerHTML = response.data.map(item => `
                <div class="activity-item">
                    <span class="activity-time">${formatTime(item.timestamp)}</span>
                    <span class="activity-user">${escapeHTML(item.nama || item.user || '-')}</span>
                    <span class="activity-action">${escapeHTML(item.action || '-')}</span>
                    <span class="activity-detail">${escapeHTML(item.detail || '')}</span>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="loading-text">Belum ada aktivitas</div>';
        }
    } catch (e) {
        container.innerHTML = '<div class="loading-text">Gagal memuat aktivitas</div>';
    }
}

async function loadOnlineUsersList() {
    const container = document.getElementById('onlineUsersList');
    if (!container) return;
    try {
        const response = await apiRequest('getOnlineUsers', {});
        if (response.success && response.data) {
            const users = response.data;
            if (users.length === 0) {
                container.innerHTML = '<div class="loading-text">Tidak ada user online</div>';
                return;
            }
            container.innerHTML = users.map(user => `
                <div class="online-user-item">
                    <span class="user-status-dot ${user.status === 'ONLINE' ? 'online pulse' : user.status === 'CHECKING' ? 'checking' : 'offline'}"></span>
                    <div class="user-monitor-info">
                        <div class="name">${escapeHTML(user.nama || user.username || '-')}</div>
                        <div class="role">${escapeHTML(user.role || '-')}</div>
                        ${user.current_no_hp ? `<div class="checking-data"><i class="fas fa-phone"></i> ${escapeHTML(user.current_no_hp)}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<div class="loading-text">Gagal memuat user online</div>';
    }
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
    }[char]));
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    try {
        const date = new Date(timestamp);
        return date.toLocaleTimeString('id-ID', { hour12: false });
    } catch (e) {
        return timestamp;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootModernUI);
} else {
    bootModernUI();
}
