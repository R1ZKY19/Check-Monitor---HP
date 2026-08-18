/**
 * Users Management
 */

async function loadUsers() {
    const body = document.getElementById('usersTableBody');
    body.innerHTML = '<tr><td colspan="7" class="loading-text">Memuat data user...</td></tr>';
    
    try {
        const response = await apiRequest('getUsers', {});
        if (response.success && response.data) {
            const users = response.data;
            if (users.length === 0) {
                body.innerHTML = '<tr><td colspan="7" class="loading-text">Tidak ada user</td></tr>';
                return;
            }
            
            const currentUser = getCurrentUser();
            body.innerHTML = users.map(user => `
                <tr>
                    <td>${user.user_id || '-'}</td>
                    <td><strong>${user.nama || '-'}</strong></td>
                    <td>${user.username || '-'}</td>
                    <td><span class="status-badge ${user.role === 'ADMIN' ? 'sudah' : 'belum'}">${user.role || 'PETUGAS'}</span></td>
                    <td><span class="status-badge ${user.status === 'AKTIF' ? 'sudah' : 'belum'}">${user.status || 'NONAKTIF'}</span></td>
                    <td>${user.last_login ? new Date(user.last_login).toLocaleString('id-ID') : '-'}</td>
                    <td>
                        ${isAdmin() && user.user_id !== currentUser?.user_id ? `
                            <button class="btn-action btn-detail" onclick="editUser('${user.user_id}')"><i class="fas fa-edit"></i></button>
                            <button class="btn-action ${user.status === 'AKTIF' ? 'btn-danger' : 'btn-cek'}" onclick="toggleUserStatus('${user.user_id}', '${user.status}')">
                                <i class="fas ${user.status === 'AKTIF' ? 'fa-ban' : 'fa-check'}"></i>
                            </button>
                        ` : user.user_id === currentUser?.user_id ? '<span class="text-muted">(Anda)</span>' : '-'}
                    </td>
                </tr>
            `).join('');
        } else {
            body.innerHTML = '<tr><td colspan="7" class="loading-text">Gagal memuat user</td></tr>';
        }
    } catch (e) {
        body.innerHTML = '<tr><td colspan="7" class="loading-text">Gagal memuat user</td></tr>';
    }
}

function showAddUserModal() {
    if (!isAdmin()) {
        showToast('Hanya admin yang dapat menambah user', 'error');
        return;
    }
    document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Tambah User';
    document.getElementById('editUserId').value = '';
    document.getElementById('userForm').reset();
    document.getElementById('userFormPassword').required = true;
    document.getElementById('userModal').classList.remove('hidden');
}

function editUser(userId) {
    if (!isAdmin()) {
        showToast('Hanya admin yang dapat mengedit user', 'error');
        return;
    }
    
    // Load user data
    apiRequest('getUser', { userId })
        .then(response => {
            if (response.success && response.data) {
                const user = response.data;
                document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-edit"></i> Edit User';
                document.getElementById('editUserId').value = userId;
                document.getElementById('userFormName').value = user.nama || '';
                document.getElementById('userFormUsername').value = user.username || '';
                document.getElementById('userFormPassword').value = '';
                document.getElementById('userFormPassword').required = false;
                document.getElementById('userFormRole').value = user.role || 'PETUGAS';
                document.getElementById('userFormStatus').value = user.status || 'AKTIF';
                document.getElementById('userModal').classList.remove('hidden');
            } else {
                showToast('Gagal memuat data user', 'error');
            }
        })
        .catch(() => showToast('Terjadi kesalahan', 'error'));
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function toggleUserStatus(userId, currentStatus) {
    if (!isAdmin()) {
        showToast('Hanya admin yang dapat mengubah status user', 'error');
        return;
    }
    
    const newStatus = currentStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    const confirmMsg = currentStatus === 'AKTIF' ? 
        'Yakin ingin menonaktifkan user ini?' : 
        'Yakin ingin mengaktifkan user ini?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await apiRequest('updateUser', {
            userId: userId,
            status: newStatus
        });
        
        if (response.success) {
            showToast(`User berhasil ${newStatus === 'AKTIF' ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
            loadUsers();
        } else {
            showToast(response.message || 'Gagal mengubah status', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
    }
}
