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
        const response = await apiRequest('getDataHP', {
            page: currentPage,
            limit: CONFIG.ITEMS_PER_PAGE
        });
        
        if (response.success) {
            allDataHP = response.data || [];
            totalPages = response.totalPages || 1;
            populatePetugasFilter(allDataHP);
            applyDataFilters();
        } else {
            container.innerHTML = '<tr><td colspan="8" class="loading-text">Gagal memuat data</td></tr>';
        }
    } catch (e) {
        container.innerHTML = '<tr><td colspan="8" class="loading-text">Gagal memuat data</td></tr>';
    }
}

function populatePetugasFilter(data) {
    const select = document.getElementById('filterPetugas');
    const currentValue = select.value;
    const petugas = new Set();
    data.forEach(item => {
        if (item.petugas_nama) petugas.add(item.petugas_nama);
    });
    select.innerHTML = '<option value="">Semua Petugas</option>';
    petugas.forEach(p => {
        select.innerHTML += `<option value="${p}">${p}</option>`;
    });
    select.value = currentValue;
}

function filterData() {
    applyDataFilters();
}

function applyDataFilters() {
    const search = document.getElementById('searchData').value.toLowerCase();
    const status = document.getElementById('filterStatus').value;
    const petugas = document.getElementById('filterPetugas').value;
    
    filteredDataHP = allDataHP.filter(item => {
        const matchSearch = !search || 
            item.nama?.toLowerCase().includes(search) || 
            item.no_hp?.toLowerCase().includes(search);
        const matchStatus = !status || item.status === status;
        const matchPetugas = !petugas || item.petugas_nama === petugas;
        return matchSearch && matchStatus && matchPetugas;
    });
    
    totalPages = Math.ceil(filteredDataHP.length / CONFIG.ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    renderDataTable();
}

function renderDataTable() {
    const container = document.getElementById('dataTableBody');
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const end = start + CONFIG.ITEMS_PER_PAGE;
    const pageData = filteredDataHP.slice(start, end);
    
    if (pageData.length === 0) {
        container.innerHTML = '<tr><td colspan="8" class="loading-text">Tidak ada data</td></tr>';
    } else {
        container.innerHTML = pageData.map((item, index) => {
            const no = start + index + 1;
            const statusClass = item.status === 'BELUM_DICEK' ? 'belum' : 
                               item.status === 'SEDANG_DICEK' ? 'sedang' : 'sudah';
            const statusLabel = item.status === 'BELUM_DICEK' ? 'Belum Dicek' :
                               item.status === 'SEDANG_DICEK' ? 'Sedang Dicek' : 'Sudah Dicek';
            
            let actionHtml = '';
            const user = getCurrentUser();
            
            if (item.status === 'BELUM_DICEK' && user && isPetugas()) {
                actionHtml = `<button class="btn-action btn-cek" onclick="startCheck('${item.data_id}')"><i class="fas fa-play"></i> CEK</button>`;
            } else if (item.status === 'SEDANG_DICEK' && user && isPetugas() && item.petugas_id === user.user_id) {
                actionHtml = `<button class="btn-action btn-selesai" onclick="finishCheck('${item.data_id}')"><i class="fas fa-check"></i> SELESAI</button>`;
            } else if (item.status === 'SEDANG_DICEK') {
                actionHtml = `<span class="status-badge sedang">Diproses ${item.petugas_nama || ''}</span>`;
            } else if (item.status === 'SUDAH_DICEK') {
                actionHtml = `<button class="btn-action btn-detail" onclick="showDetail('${item.data_id}')"><i class="fas fa-info-circle"></i> DETAIL</button>`;
            } else {
                actionHtml = `<button class="btn-action btn-detail" onclick="showDetail('${item.data_id}')"><i class="fas fa-info-circle"></i> DETAIL</button>`;
            }
            
            return `
                <tr>
                    <td>${no}</td>
                    <td><strong>${item.nama || '-'}</strong></td>
                    <td>${item.no_hp || '-'}</td>
                    <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
                    <td>${item.petugas_nama || '-'}</td>
                    <td>${item.waktu_mulai ? formatTime(item.waktu_mulai) : '-'}</td>
                    <td>${item.waktu_selesai ? formatTime(item.waktu_selesai) : '-'}</td>
                    <td>${actionHtml}</td>
                </tr>
            `;
        }).join('');
    }
    
    updatePagination();
}

function updatePagination() {
    document.getElementById('pageInfo').textContent = `Halaman ${currentPage} dari ${totalPages}`;
    document.getElementById('prevBtn').disabled = currentPage <= 1;
    document.getElementById('nextBtn').disabled = currentPage >= totalPages;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderDataTable();
    }
}

function nextPage() {
    if (currentPage < totalPages) {
        currentPage++;
        renderDataTable();
    }
}

async function startCheck(dataId) {
    if (!dataId) return;
    const btn = document.querySelector(`[onclick*="startCheck('${dataId}')"]`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        const response = await apiRequest('startCheck', { dataId });
        if (response.success) {
            showToast('Data berhasil diambil', 'success');
            loadDataHP();
            loadDashboard();
        } else {
            showToast(response.message || 'Gagal mengambil data', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-play"></i> CEK';
        }
    }
}

async function finishCheck(dataId) {
    if (!dataId) return;
    if (!confirm('Yakin data ini sudah selesai dicek?')) return;
    
    const btn = document.querySelector(`[onclick*="finishCheck('${dataId}')"]`);
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }
    
    try {
        const response = await apiRequest('finishCheck', { dataId });
        if (response.success) {
            showToast('Pengecekan selesai!', 'success');
            loadDataHP();
            loadDashboard();
        } else {
            showToast(response.message || 'Gagal menyelesaikan', 'error');
        }
    } catch (e) {
        showToast('Terjadi kesalahan', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check"></i> SELESAI';
        }
    }
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
            let historyHtml = d.history && d.history.length > 0 ? 
                d.history.map(h => `
                    <div class="history-item">
                        <span class="time">${formatTime(h.timestamp)}</span>
                        ${h.nama_petugas || h.user} - ${h.action || h.aksi}
                        ${h.detail ? `- ${h.detail}` : ''}
                    </div>
                `).join('') : '<div class="history-item">Tidak ada riwayat</div>';
            
            body.innerHTML = `
                <div class="detail-row">
                    <span class="detail-label">Data ID</span>
                    <span class="detail-value">${d.data_id || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Nama</span>
                    <span class="detail-value">${d.nama || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">No HP</span>
                    <span class="detail-value">${d.no_hp || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status</span>
                    <span class="detail-value"><span class="status-badge ${d.status === 'BELUM_DICEK' ? 'belum' : d.status === 'SEDANG_DICEK' ? 'sedang' : 'sudah'}">${d.status || '-'}</span></span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Petugas</span>
                    <span class="detail-value">${d.petugas_nama || '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Waktu Mulai</span>
                    <span class="detail-value">${d.waktu_mulai ? new Date(d.waktu_mulai).toLocaleString('id-ID') : '-'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Waktu Selesai</span>
                    <span class="detail-value">${d.waktu_selesai ? new Date(d.waktu_selesai).toLocaleString('id-ID') : '-'}</span>
                </div>
                ${d.durasi ? `
                <div class="detail-row">
                    <span class="detail-label">Durasi</span>
                    <span class="detail-value">${d.durasi}</span>
                </div>
                ` : ''}
                <div class="detail-history">
                    <h4>Riwayat Pengecekan</h4>
                    ${historyHtml}
                </div>
            `;
        } else {
            body.innerHTML = '<div class="loading-text">Gagal memuat detail</div>';
        }
    } catch (e) {
        body.innerHTML = '<div class="loading-text">Gagal memuat detail</div>';
    }
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

// Activity Log
let activityPage = 1;
let activityTotalPages = 1;

async function loadActivityLog() {
    const body = document.getElementById('activityLogBody');
    body.innerHTML = '<tr><td colspan="4" class="loading-text">Memuat activity log...</td></tr>';
    
    try {
        const response = await apiRequest('getActivityLog', {
            page: activityPage,
            limit: CONFIG.ITEMS_PER_PAGE
        });
        
        if (response.success) {
            const data = response.data || [];
            activityTotalPages = response.totalPages || 1;
            
            if (data.length === 0) {
                body.innerHTML = '<tr><td colspan="4" class="loading-text">Tidak ada aktivitas</td></tr>';
            } else {
                body.innerHTML = data.map(item => `
                    <tr>
                        <td>${item.timestamp ? new Date(item.timestamp).toLocaleString('id-ID') : '-'}</td>
                        <td><strong>${item.nama || item.user || '-'}</strong></td>
                        <td>${item.action || '-'}</td>
                        <td>${item.detail || '-'}</td>
                    </tr>
                `).join('');
            }
            
            updateActivityPagination();
        } else {
            body.innerHTML = '<tr><td colspan="4" class="loading-text">Gagal memuat activity log</td></tr>';
        }
    } catch (e) {
        body.innerHTML = '<tr><td colspan="4" class="loading-text">Gagal memuat activity log</td></tr>';
    }
}

function updateActivityPagination() {
    document.getElementById('activityPageInfo').textContent = `Halaman ${activityPage} dari ${activityTotalPages}`;
    document.getElementById('prevActivityBtn').disabled = activityPage <= 1;
    document.getElementById('nextActivityBtn').disabled = activityPage >= activityTotalPages;
}

function prevActivityPage() {
    if (activityPage > 1) {
        activityPage--;
        loadActivityLog();
    }
}

function nextActivityPage() {
    if (activityPage < activityTotalPages) {
        activityPage++;
        loadActivityLog();
    }
}

function filterActivity() {
    // Simple search on client side
    const search = document.getElementById('searchActivity').value.toLowerCase();
    const rows = document.querySelectorAll('#activityLogBody tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(search) ? '' : 'none';
    });
}
