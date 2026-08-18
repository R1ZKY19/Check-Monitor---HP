/** Live monitor */
async function loadMonitorUsers(){
 const container=document.getElementById('monitorUsersList');
 if(!container)return;
 container.innerHTML='<div class="loading-text">Memuat data monitor...</div>';
 try{
  const response=await apiRequest('getOnlineUsers',{});
  const users=response&&response.success&&Array.isArray(response.data)?response.data:[];
  if(!users.length){container.innerHTML='<div class="loading-text">Tidak ada user online</div>';return;}
  container.innerHTML=users.map(user=>`<div class="online-user-item" style="padding:12px 0"><span class="user-status-dot ${user.status==='ONLINE'?'online pulse':user.status==='CHECKING'?'checking':'offline'}"></span><div class="user-monitor-info"><div class="name">${escapeHTML(user.nama||user.username||'-')}</div><div class="role">${escapeHTML(user.role||'-')} ${user.status==='CHECKING'?'🟡 Sedang Cek':user.status==='ONLINE'?'🟢 Online':'⚪ Offline'}</div>${user.current_no_hp?`<div class="checking-data"><i class="fas fa-phone"></i> ${escapeHTML(user.current_no_hp)} | Mulai: ${formatTime(user.last_active)}</div>`:''}${user.last_active&&user.status!=='CHECKING'?`<div class="checking-data">Last active: ${formatTime(user.last_active)}</div>`:''}</div></div>`).join('');
 }catch(e){console.error('loadMonitorUsers:',e);container.innerHTML='<div class="loading-text">Gagal memuat data monitor</div>'}
}
function escapeHTML(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
