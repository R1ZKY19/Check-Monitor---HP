/**
 * Monitor Handler
 */

async function loadMonitorUsers() {
    const container = document.getElementById('monitorUsersList');
    try {
        const response = await apiRequest('getOnlineUsers', {});
        if (response.success && response.data) {
            const users = response.data;
            if (users.length === 0) {
                container.innerHTML = '<div class="loading-text">Tidak ada user online</div>';
                return;
            }
            container.innerHTML = users.map(user => `
                <div class="online-user-item" style="padding: 12px 0;">
                    <span class="user-status-dot ${user.status === 'ONLINE' ? 'online pulse' : user.status === 'CHECKING' ? 'checking' : 'offline'}"></span>
                    <div class="user-monitor-info">
                        <div class="name">${user.nama || user.username}</div>
                        <div class="role">${user.role} ${user.status === 'CHECKING' ? '🟡 Sedang Cek' : user.status === 'ONLINE' ? '🟢 Online' : '⚪ Offline'}</div>
                        ${user.current_no_hp ? `<div class="checking-data"><i class="fas fa-phone"></i> ${user.current_no_hp} | Mulai: ${formatTime(user.last_active)}</div>` : ''}
                        ${user.last_active && user.status !== 'CHECKING' ? `<div class="checking-data">Last active: ${formatTime(user.last_active)}</div>` : ''}
                    </div>
                </div>
            `).join('');
        }
    } catch (e) {
        container.innerHTML = '<div class="loading-text">Gagal memuat data monitor</div>';
    }
}
