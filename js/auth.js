/** Authentication and session handling */
function getCurrentUser(){const s=localStorage.getItem(STORAGE_KEYS.USER);if(!s)return null;try{return JSON.parse(s)}catch(e){return null}}
function isAdmin(){const u=getCurrentUser();return !!u&&String(u.role).toUpperCase()==='ADMIN'}
function isPetugas(){const u=getCurrentUser();return !!u&&(String(u.role).toUpperCase()==='PETUGAS'||String(u.role).toUpperCase()==='ADMIN')}
function updateUserInfo(){const u=getCurrentUser();if(!u)return;const name=u.nama||u.username||'User',role=u.role||'PETUGAS';const h=document.getElementById('headerUser');if(h)h.textContent=name;const n=document.getElementById('userName');if(n)n.textContent=name;const r=document.getElementById('userRole');if(r)r.textContent=role}
async function logout(){try{await apiRequest('logout',{})}catch(_){}localStorage.removeItem(STORAGE_KEYS.TOKEN);localStorage.removeItem(STORAGE_KEYS.USER);clearIntervals();showLogin();showToast('Anda telah logout','info')}
let intervals=[];
function clearIntervals(){intervals.forEach(id=>clearInterval(id));intervals=[]}
function addInterval(id){intervals.push(id)}
function startDashboard(){
    clearIntervals(); updateUserInfo();
    if(typeof loadDashboard==='function') loadDashboard();
    document.querySelectorAll('.menu-item[data-page="users"],.menu-item[data-page="activity"]').forEach(el=>el.style.display=isAdmin()?'':'none');
    addInterval(setInterval(()=>{const active=document.querySelector('.page-content.active')?.id;if(active==='page-dashboard'&&typeof loadDashboard==='function')loadDashboard();else if(active==='page-monitor'&&typeof loadMonitorUsers==='function')loadMonitorUsers()},60000));
    addInterval(setInterval(()=>{if(localStorage.getItem(STORAGE_KEYS.TOKEN))apiRequest('heartbeat',{status:document.querySelector('.page-content.active')?.id==='page-datahp'?'CHECKING':'ONLINE'})},60000));
}
