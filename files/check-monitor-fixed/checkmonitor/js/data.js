/**
 * Data HP & Activity Handler
 */

let currentPage = 1;
let totalPages = 1;
let allDataHP = [];
let filteredDataHP = [];

async function loadDataHP() {
    const container = document.getElementById('dataTableBody');
    container.innerHTML = '<tr><td colspan="8" class="loading-text">Memuat data...</td></tr>';
    try {
        const response = await apiRequest('getDataHP', { page: currentPage, limit: CONFIG.ITEMS_PER_PAGE });
        if (response.success) {
            allDataHP = response.data || [];
            totalPages = response.totalPages || 1;
            populatePetugasFilter(allDataHP);
            applyDataFilters();
        } else container.innerHTML = '<tr><td colspan="8" class="loading-text">Gagal memuat data</td></tr>';
    } catch (e) {
        container.innerHTML = '<tr><td colspan="8" class="loading-text">Gagal memuat data</td></tr>';
    }
}

function populatePetugasFilter(data) {
    const select = document.getElementById('filterPetugas');
    if (!select) return;
    const currentValue = select.value;
    const petugas = new Set();
    data.forEach(item => { if (item.petugas_nama) petugas.add(item.petugas_nama); });
    select.innerHTML = '<option value="">Semua Petugas</option>';
    petugas.forEach(p => {
        const option = document.createElement('option');
        option.value = p;
        option.textContent = p;
        select.appendChild(option);
    });
    select.value = currentValue;
}

function filterData() { applyDataFilters(); }

function normalizeDate(value) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
    return d.toISOString().slice(0, 10);
}

function getReviewDate(item) {
    return normalizeDate(item.tanggal || item.timestamp || item.waktu_selesai || item.waktu_mulai || item.created_at);
}

function applyDataFilters() {
    const search = (document.getElementById('searchData')?.value || '').toLowerCase().trim();
    const status = document.getElementById('filterStatus')?.value || '';
    const petugas = document.getElementById('filterPetugas')?.value || '';
    const from = document.getElementById('reviewDateFrom')?.value || '';
    const to = document.getElementById('reviewDateTo')?.value || '';

    filteredDataHP = allDataHP.filter(item => {
        const haystack = [item.nama, item.no_hp, item.bank, item.kategori, item.data, item.petugas_nama]
            .filter(Boolean).join(' ').toLowerCase();
        const date = getReviewDate(item);
        const matchSearch = !search || haystack.includes(search);
        const matchStatus = !status || item.status === status;
        const matchPetugas = !petugas || item.petugas_nama === petugas;
        const matchFrom = !from || !date || date >= from;
        const matchTo = !to || !date || date <= to;
        return matchSearch && matchStatus && matchPetugas && matchFrom && matchTo;
    });

    totalPages = Math.max(1, Math.ceil(filteredDataHP.length / CONFIG.ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    renderDataTable();
}

function safeText(value) {
    return String(value ?? '-').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function renderDataTable() {
    const container = document.getElementById('dataTableBody');
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const pageData = filteredDataHP.slice(start, start + CONFIG.ITEMS_PER_PAGE);

    if (!pageData.length) {
        container.innerHTML = '<tr><td colspan="8" class="loading-text">Tidak ada data sesuai filter</td></tr>';
    } else {
        container.innerHTML = pageData.map((item, index) => {
            const no = start + index + 1;
            const statusClass = item.status === 'BELUM_DICEK' ? 'belum' : item.status === 'SEDANG_DICEK' ? 'sedang' : 'sudah';
            const statusLabel = item.status === 'BELUM_DICEK' ? 'Belum Dicek' : item.status === 'SEDANG_DICEK' ? 'Sedang Dicek' : 'Sudah Dicek';
            let actionHtml = '';
            const user = getCurrentUser();

            if (item.status === 'BELUM_DICEK' && user && isPetugas()) {
                actionHtml = `<button class="btn-action btn-cek" onclick="startCheck('${safeText(item.data_id)}')"><i class="fas fa-play"></i> CEK</button>`;
            } else if (item.status === 'SEDANG_DICEK' && user && isPetugas() && item.petugas_id === user.user_id) {
                actionHtml = `<button class="btn-action btn-selesai" onclick="finishCheck('${safeText(item.data_id)}')"><i class="fas fa-check"></i> SELESAI</button>`;
            } else if (item.status === 'SEDANG_DICEK') {
                actionHtml = `<span class="status-badge sedang">Diproses ${safeText(item.petugas_nama || '')}</span>`;
            } else {
                actionHtml = `<button class="btn-action btn-detail" onclick="showDetail('${safeText(item.data_id)}')"><i class="fas fa-info-circle"></i> DETAIL</button>`;
            }

            return `<tr>
                <td>${no}</td>
                <td><strong>${safeText(item.nama)}</strong></td>
                <td>${safeText(item.no_hp)}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                <td>${safeText(item.petugas_nama)}</td>
                <td>${item.waktu_mulai ? formatTime(item.waktu_mulai) : '-'}</td>
                <td>${item.waktu_selesai ? formatTime(item.waktu_selesai) : '-'}</td>
                <td>${actionHtml}</td>
            </tr>`;
        }).join('');
    }
    updatePagination();
}

function updatePagination() {
    document.getElementById('pageInfo').textContent = `Halaman ${currentPage} dari ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function prevPage() { if (currentPage > 1) { currentPage--; renderDataTable(); } }
function nextPage() { if (currentPage < totalPages) { currentPage++; renderDataTable(); } }

async function startCheck(dataId) {
    if (!dataId) return;
    try {
        const response = await apiRequest('startCheck', { dataId });
        if (response.success) { showToast('Data berhasil diambil', 'success'); loadDataHP(); loadDashboard(); }
        else showToast(response.message || 'Gagal mengambil data', 'error');
    } catch (e) { showToast('Terjadi kesalahan', 'error'); }
}

async function finishCheck(dataId) {
    if (!dataId || !confirm('Yakin data ini sudah selesai dicek?')) return;
    try {
        const response = await apiRequest('finishCheck', { dataId });
        if (response.success) { showToast('Pengecekan selesai!', 'success'); loadDataHP(); loadDashboard(); }
        else showToast(response.message || 'Gagal menyelesaikan', 'error');
    } catch (e) { showToast('Terjadi kesalahan', 'error'); }
}

async function showDetail(dataId) {
    if (!dataId) return;
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('detailModalBody');
    modal.classList.remove('hidden');
    body.innerHTML = '<div class="loading-text">Memuat detail...</div>';
    try {
        const response = await apiRequest('getDetailData', { dataId });
        if (response.success && response.data) {
            const d = response.data;
            const historyHtml = d.history?.length ? d.history.map(h => `<div class="history-item"><span class="time">${formatTime(h.timestamp)}</span>${safeText(h.nama_petugas || h.user)} - ${safeText(h.action || h.aksi)} ${h.detail ? '- ' + safeText(h.detail) : ''}</div>`).join('') : '<div class="history-item">Tidak ada riwayat</div>';
            const statusClass = d.status === 'BELUM_DICEK' ? 'belum' : d.status === 'SEDANG_DICEK' ? 'sedang' : 'sudah';
            body.innerHTML = `
                <div class="detail-row"><span class="detail-label">Data ID</span><span class="detail-value">${safeText(d.data_id)}</span></div>
                <div class="detail-row"><span class="detail-label">Nama</span><span class="detail-value">${safeText(d.nama)}</span></div>
                <div class="detail-row"><span class="detail-label">No HP</span><span class="detail-value">${safeText(d.no_hp)}</span></div>
                <div class="detail-row"><span class="detail-label">Status</span><span class="detail-value"><span class="status-badge ${statusClass}">${safeText(d.status)}</span></span></div>
                <div class="detail-row"><span class="detail-label">Petugas</span><span class="detail-value">${safeText(d.petugas_nama)}</span></div>
                <div class="detail-row"><span class="detail-label">Waktu Mulai</span><span class="detail-value">${d.waktu_mulai ? new Date(d.waktu_mulai).toLocaleString('id-ID') : '-'}</span></div>
                <div class="detail-row"><span class="detail-label">Waktu Selesai</span><span class="detail-value">${d.waktu_selesai ? new Date(d.waktu_selesai).toLocaleString('id-ID') : '-'}</span></div>
                ${d.durasi ? `<div class="detail-row"><span class="detail-label">Durasi</span><span class="detail-value">${safeText(d.durasi)}</span></div>` : ''}
                <div class="detail-history"><h4>Riwayat Pengecekan</h4>${historyHtml}</div>`;
        } else body.innerHTML = '<div class="loading-text">Gagal memuat detail</div>';
    } catch (e) { body.innerHTML = '<div class="loading-text">Gagal memuat detail</div>'; }
}

function closeDetailModal() { document.getElementById('detailModal').classList.add('hidden'); }

let activityPage = 1;
let activityTotalPages = 1;

async function loadActivityLog() {
    const body = document.getElementById('activityLogBody');
    body.innerHTML = '<tr><td colspan="4" class="loading-text">Memuat activity log...</td></tr>';
    try {
        const response = await apiRequest('getActivityLog', { page: activityPage, limit: CONFIG.ITEMS_PER_PAGE });
        if (response.success) {
            const data = response.data || [];
            activityTotalPages = response.totalPages || 1;
            body.innerHTML = data.length ? data.map(item => `<tr><td>${item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '-'}</td><td><strong>${safeText(item.nama || item.user)}</strong></td><td>${safeText(item.action)}</td><td>${safeText(item.detail)}</td></tr>`).join('') : '<tr><td colspan="4" class="loading-text">Tidak ada aktivitas</td></tr>';
            updateActivityPagination();
        } else body.innerHTML = '<tr><td colspan="4" class="loading-text">Gagal memuat activity log</td></tr>';
    } catch (e) { body.innerHTML = '<tr><td colspan="4" class="loading-text">Gagal memuat activity log</td></tr>'; }
}

function updateActivityPagination() {
    document.getElementById('activityPageInfo').textContent = `Halaman ${activityPage} dari ${activityTotalPages}`;
    document.getElementById('prevActivityBtn').disabled = activityPage <= 1;
    document.getElementById('nextActivityBtn').disabled = activityPage >= activityTotalPages;
}
function prevActivityPage() { if (activityPage > 1) { activityPage--; loadActivityLog(); } }
function nextActivityPage() { if (activityPage < activityTotalPages) { activityPage++; loadActivityLog(); } }
function filterActivity() {
    const search = document.getElementById('searchActivity').value.toLowerCase();
    document.querySelectorAll('#activityLogBody tr').forEach(row => row.style.display = row.textContent.toLowerCase().includes(search) ? '' : 'none');
}
