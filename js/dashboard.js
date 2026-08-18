/**
 * Dashboard Handler
 */

async function loadDashboard() {
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
    try {
        const response = await apiRequest('getRecentActivities', { limit: 20 });
        if (response.success && response.data && response.data.length > 0) {
            container.innerHTML = response.data.map(item => `
                <div class="activity-item">
                    <span class="activity-time">${formatTime(item.timestamp)}</span>
                    <span class="activity-user">${item.nama || item.user}</span>
                    <span class="activity-action">${item.action}</span>
                    <span class="activity-detail">${item.detail || ''}</span>
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
                        <div class="name">${user.nama || user.username}</div>
                        <div class="role">${user.role}</div>
                        ${user.current_no_hp ? `<div class="checking-data"><i class="fas fa-phone"></i> ${user.current_no_hp}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<div class="loading-text">Gagal memuat user online</div>';
    }
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
