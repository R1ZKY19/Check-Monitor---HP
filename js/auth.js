/**
 * Authentication Handler
 */

// Get current user
function getCurrentUser() {
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Check if user is admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.role === 'ADMIN';
}

// Check if user is petugas
function isPetugas() {
    const user = getCurrentUser();
    return user && (user.role === 'PETUGAS' || user.role === 'ADMIN');
}

// Update user info in sidebar
function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('userName').textContent = user.nama || user.username;
        document.getElementById('userRole').textContent = user.role || 'PETUGAS';
        const avatar = document.getElementById('userAvatar');
        avatar.textContent = (user.nama || user.username || 'U')[0].toUpperCase();
    }
}

// Logout
async function logout() {
    try {
        await apiRequest('logout', {});
    } catch (e) {
        // ignore
    }
    
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    clearIntervals();
    showLogin();
    showToast('Anda telah logout', 'info');
}

// Clear intervals
let intervals = [];

function clearIntervals() {
    intervals.forEach(id => clearInterval(id));
    intervals = [];
}

function addInterval(id) {
    intervals.push(id);
}

// Start dashboard (called after login)
function startDashboard() {
    updateUserInfo();
    loadDashboard();
    loadDataHP();
    loadMonitorUsers();
    loadActivityLog();
    
    // Show/hide admin menu
    const adminMenus = document.querySelectorAll('.menu-item[data-page="users"], .menu-item[data-page="activity"]');
    if (isAdmin()) {
        adminMenus.forEach(el => el.style.display = 'flex');
    } else {
        adminMenus.forEach(el => el.style.display = 'none');
    }
    
    // Start polling
    const pollInterval = setInterval(() => {
        if (document.getElementById('page-dashboard').classList.contains('active')) {
            loadDashboard();
        }
        if (document.getElementById('page-monitor').classList.contains('active')) {
            loadMonitorUsers();
        }
        if (document.getElementById('page-datahp').classList.contains('active')) {
            loadDataHP();
        }
        if (document.getElementById('page-activity').classList.contains('active')) {
            loadActivityLog();
        }
    }, CONFIG.POLLING_INTERVAL);
    addInterval(pollInterval);
    
    // Start heartbeat
    const heartbeatInterval = setInterval(() => {
        apiRequest('heartbeat', {
            status: document.querySelector('.page-content.active')?.id === 'page-datahp' ? 'CHECKING' : 'ONLINE'
        });
    }, CONFIG.HEARTBEAT_INTERVAL);
    addInterval(heartbeatInterval);
}
