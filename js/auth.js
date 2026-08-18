/**
 * Authentication + dashboard session handler
 * Designed to keep the UI responsive and survive browser refresh.
 */

function getCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userData) return null;
    try { return JSON.parse(userData); } catch (e) { return null; }
}

function isAdmin() {
    const user = getCurrentUser();
    return !!user && user.role === 'ADMIN';
}

function isPetugas() {
    const user = getCurrentUser();
    return !!user && (user.role === 'PETUGAS' || user.role === 'ADMIN');
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (!user) return;

    const name = user.nama || user.username || 'User';
    const role = user.role || 'PETUGAS';
    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    const avatar = document.getElementById('userAvatar');
    const headerUser = document.getElementById('headerUser');

    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role;
    if (headerUser) headerUser.textContent = name;
    if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
}

async function logout() {
    try { await apiRequest('logout', {}); } catch (e) {}
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    clearIntervals();
    showLogin();
    showToast('Anda telah logout', 'info');
}

let intervals = [];
function clearIntervals() {
    intervals.forEach(id => clearInterval(id));
    intervals = [];
}
function addInterval(id) { intervals.push(id); }

function startDashboard() {
    clearIntervals();
    updateUserInfo();

    // Load only the dashboard first. Heavy pages are loaded when opened.
    if (typeof loadDashboard === 'function') loadDashboard();

    const adminMenus = document.querySelectorAll('.menu-item[data-page="users"], .menu-item[data-page="activity"]');
    adminMenus.forEach(el => { el.style.display = isAdmin() ? '' : 'none'; });

    const pollInterval = setInterval(() => {
        const active = document.querySelector('.page-content.active')?.id;
        if (active === 'page-dashboard' && typeof loadDashboard === 'function') loadDashboard();
        else if (active === 'page-monitor' && typeof loadMonitorUsers === 'function') loadMonitorUsers();
        else if (active === 'page-datahp' && typeof loadDataHP === 'function') loadDataHP();
        else if (active === 'page-activity' && typeof loadActivityLog === 'function') loadActivityLog();
    }, CONFIG.POLLING_INTERVAL);
    addInterval(pollInterval);

    const heartbeatInterval = setInterval(() => {
        if (!localStorage.getItem(STORAGE_KEYS.TOKEN)) return;
        apiRequest('heartbeat', {
            status: document.querySelector('.page-content.active')?.id === 'page-datahp' ? 'CHECKING' : 'ONLINE'
        });
    }, CONFIG.HEARTBEAT_INTERVAL);
    addInterval(heartbeatInterval);
}
