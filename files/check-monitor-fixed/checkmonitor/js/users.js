/**
 * Users Management
 */

async function loadUsers() {
    const body = document.getElementById('usersTableBody');
    if (!body) return;

    body.innerHTML = '<tr><td colspan="7" class="loading-text">Memuat data user...</td></tr>';

    try {
        const response = await apiRequest('getUsers', {});

        if (!response.success) {
            throw new Error(response.message || 'Gagal memuat user');
        }

        const users = Array.isArray(response.data) ? response.data : [];

        if (users.length === 0) {
            body.innerHTML = '<tr><td colspan="7" class="loading-text">Tidak ada user</td></tr>';
            return;
        }

        const currentUser = getCurrentUser();

        body.innerHTML = users.map(user => {
            const isSelf = user.user_id === currentUser?.user_id;
            const canManage = isAdmin() && !isSelf;
            const roleClass = user.role === 'ADMIN' ? 'sudah' : 'belum';
            const statusClass = user.status === 'AKTIF' ? 'sudah' : 'belum';
            const lastLogin = user.last_login
                ? new Date(user.last_login).toLocaleString('id-ID')
                : '-';

            return `
                <tr>
                    <td>${escapeUserHtml(user.user_id || '-')}</td>
                    <td><strong>${escapeUserHtml(user.nama || '-')}</strong></td>
                    <td>${escapeUserHtml(user.username || '-')}</td>
                    <td><span class="status-badge ${roleClass}">${escapeUserHtml(user.role || 'PETUGAS')}</span></td>
                    <td><span class="status-badge ${statusClass}">${escapeUserHtml(user.status || 'NONAKTIF')}</span></td>
                    <td>${escapeUserHtml(lastLogin)}</td>
                    <td>
                        ${canManage ? `
                            <button class="btn-action btn-detail" onclick="editUser('${escapeJs(user.user_id)}')" title="Edit user">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action ${user.status === 'AKTIF' ? 'btn-danger' : 'btn-cek'}" onclick="toggleUserStatus('${escapeJs(user.user_id)}', '${escapeJs(user.status)}')" title="Ubah status">
                                <i class="fas ${user.status === 'AKTIF' ? 'fa-ban' : 'fa-check'}"></i>
                            </button>
                        ` : isSelf ? '<span class="text-muted">(Anda)</span>' : '-'}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (error) {
        console.error('loadUsers:', error);
        body.innerHTML = `<tr><td colspan="7" class="loading-text">${escapeUserHtml(error.message || 'Gagal memuat user')}</td></tr>`;
    }
}

function showAddUserModal() {
    if (!isAdmin()) {
        showToast('Hanya admin yang dapat menambah user', 'error');
        return;
    }

    const form = document.getElementById('userForm');
    if (form) form.reset();

    document.getElementById('userModalTitle').innerHTML = '<i class="fas fa-user-plus"></i> Tambah User';
    document.getElementById('editUserId').value = '';
    document.getElementById('userFormPassword').required = true;
    document.getElementById('userModal').classList.remove('hidden');
}

async function editUser(userId) {
    if (!isAdmin()) {
        showToast('Hanya admin yang dapat mengedit user', 'error');
        return;
    }

    try {
        const response = await apiRequest('getUser', { userId });

        if (!response.success || !response.data) {
            throw new Error(response.message || 'Gagal memuat data user');
        }

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

    } catch (error) {
        console.error('editUser:', error);
        showToast(error.message || 'Gagal memuat data user', 'error');
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.add('hidden');
}

async function saveUserForm(event) {
    event.preventDefault();

    if (!isAdmin()) {
        showToast('Hanya admin yang dapat mengelola user', 'error');
        return false;
    }

    const form = document.getElementById('userForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    const userId = document.getElementById('editUserId').value.trim();
    const nama = document.getElementById('userFormName').value.trim();
    const username = document.getElementById('userFormUsername').value.trim();
    const password = document.getElementById('userFormPassword').value;
    const role = document.getElementById('userFormRole').value;
    const status = document.getElementById('userFormStatus').value;

    if (!nama || !username) {
        showToast('Nama dan username wajib diisi', 'error');
        return false;
    }

    if (!userId && !password) {
        showToast('Password wajib diisi untuk user baru', 'error');
        return false;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        let response;

        if (userId) {
            const payload = {
                userId,
                nama,
                username,
                role,
                status
            };

            if (password) payload.password = password;
            response = await apiRequest('updateUser', payload);
        } else {
            response = await apiRequest('createUser', {
                nama,
                username,
                password,
                role
            });
        }

        if (!response || !response.success) {
            throw new Error(response?.message || 'Gagal menyimpan user');
        }

        closeUserModal();
        showToast(userId ? 'User berhasil diupdate' : 'User berhasil ditambahkan', 'success');
        await loadUsers();

    } catch (error) {
        console.error('saveUserForm:', error);
        showToast(error.message || 'Gagal menyimpan user', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }

    return false;
}

async function toggleUserStatus(userId, currentStatus) {
    if (!isAdmin()) {
        showToast('Hanya admin yang dapat mengubah status user', 'error');
        return;
    }

    const newStatus = currentStatus === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    const confirmMsg = currentStatus === 'AKTIF'
        ? 'Yakin ingin menonaktifkan user ini?'
        : 'Yakin ingin mengaktifkan user ini?';

    if (!confirm(confirmMsg)) return;

    try {
        const response = await apiRequest('updateUser', {
            userId,
            status: newStatus
        });

        if (!response.success) {
            throw new Error(response.message || 'Gagal mengubah status');
        }

        showToast(`User berhasil ${newStatus === 'AKTIF' ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
        await loadUsers();

    } catch (error) {
        console.error('toggleUserStatus:', error);
        showToast(error.message || 'Terjadi kesalahan', 'error');
    }
}

function escapeUserHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escapeJs(value) {
    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}

// Pastikan form benar-benar memiliki handler submit.
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('userForm');
    if (form) {
        form.addEventListener('submit', saveUserForm);
    }
});
