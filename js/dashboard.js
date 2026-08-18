/**
 * Dashboard Handler
 * Keep the existing dashboard behavior, but bind to the actual HTML IDs.
 */

function loadModernStyles() {
    ['css/modern.css?v=3', 'css/review.css?v=2'].forEach((href, index) => {
        if (!document.querySelector(`link[data-cm-style="${index}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.dataset.cmStyle = String(index);
            document.head.appendChild(link);
        }
    });
}

function bootModernUI() {
    loadModernStyles();
    document.documentElement.dataset.cmReady = '1';
    updateSystemClock();
}

function updateSystemClock() {
    const el = document.getElementById('headerTime');
    if (!el) return;
    el.textContent = new Date().toLocaleString('id-ID', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
}

async function loadDashboard() {
    bootModernUI();
    try {
        const response = await apiRequest('getDashboardStats', {});
        if (response && response.success && response.data) {
            const stats = response.data;
            setText('statOnline', stats.online);
            setText('statChecking', stats.checking);
            setText('statCompleted', stats.completed);
            setText('statPending', stats.pending);
        }
    } catch (e) {
        console.error('Load dashboard stats error:', e);
    }

    // These are independent requests. One failing endpoint must not break the rest.
    await Promise.allSettled([loadLiveActivities(), loadOnlineUsersList()]);
}

async function loadLiveActivities() {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    try {
        const response = await apiRequest('getRecentActivities', { limit: 20 });
        const data = response && response.success && Array.isArray(response.data) ? response.data : [];
        if (!data.length) {
            container.innerHTML = '<div class="loading-text">Belum ada aktivitas</div>';
            return;
        }
        container.innerHTML = data.map(item => `
            <div class="activity-item">
                <span class="activity-time">${formatTime(item.timestamp)}</span>
                <span class="activity-user">${escapeHTML(item.nama || item.user || '-')}</span>
                <span class="activity-action">${escapeHTML(item.action || '-')}</span>
                <span class="activity-detail">${escapeHTML(item.detail || '')}</span>
            </div>
        `).join('');
    } catch (e) {
        console.error('Load activities error:', e);
        container.innerHTML = '<div class="loading-text">Gagal memuat aktivitas</div>';
    }
}

async function loadOnlineUsersList() {
    // The current HTML does not have a separate online-user card.
    // Do not throw when that optional panel is absent.
    const container = document.getElementById('onlineUsersList');
    if (!container) return;
    try {
        const response = await apiRequest('getOnlineUsers', {});
        const users = response && response.success && Array.isArray(response.data) ? response.data : [];
        if (!users.length) {
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
    } catch (e) {
        console.error('Load online users error:', e);
        container.innerHTML = '<div class="loading-text">Gagal memuat user online</div>';
    }
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? 0;
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[char]));
}

function formatTime(timestamp) {
    if (!timestamp) return '-';
    try { return new Date(timestamp).toLocaleTimeString('id-ID', { hour12: false }); }
    catch (e) { return String(timestamp); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootModernUI, { once: true });
else bootModernUI();
