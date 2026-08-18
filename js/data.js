/** Data HP: stable, lightweight, self-contained table. */
let currentPage = 1;
let totalPages = 1;
let allDataHP = [];
let filteredDataHP = [];
let dataLoading = false;

function ensureDataHPUI() {
    const host = document.getElementById('dataHPContainer');
    if (!host) return null;

    if (!document.getElementById('dataTableBody')) {
        host.innerHTML = `
            <div class="datahp-table-wrap" style="overflow:auto">
                <table class="data-table">
                    <thead><tr>
                        <th>#</th><th>NAMA</th><th>NO HP</th><th>BANK</th>
                        <th>STATUS</th><th>PETUGAS</th><th>MULAI</th><th>SELESAI</th><th>AKSI</th>
                    </tr></thead>
                    <tbody id="dataTableBody">
                        <tr><td colspan="9" class="loading-text">Siap memuat data...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="pagination" style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:14px">
                <button type="button" class="btn-refresh" id="prevBtn">Sebelumnya</button>
                <span id="pageInfo">Halaman 1 dari 1</span>
                <button type="button" class="btn-refresh" id="nextBtn">Berikutnya</button>
            </div>`;

        document.getElementById('prevBtn')?.addEventListener('click', prevPage);
        document.getElementById('nextBtn')?.addEventListener('click', nextPage);
    }
    return host;
}

async function loadDataHP(force = false) {
    const host = ensureDataHPUI();
    if (!host || dataLoading) return;
    if (!force && allDataHP.length) { applyDataFilters(); return; }

    const body = document.getElementById('dataTableBody');
    if (!body) return;
    dataLoading = true;
    body.innerHTML = '<tr><td colspan="9" class="loading-text"><i class="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>';

    try {
        const response = await apiRequest('getDataHP', { page: 1, limit: 500 });
        if (!response.success) throw new Error(response.message || 'Gagal memuat data HP');
        allDataHP = Array.isArray(response.data) ? response.data : [];
        currentPage = 1;
        totalPages = Math.max(1, Number(response.totalPages) || Math.ceil(allDataHP.length / CONFIG.ITEMS_PER_PAGE));
        populatePetugasFilter(allDataHP);
        applyDataFilters();
    } catch (error) {
        console.error('loadDataHP:', error);
        body.innerHTML = `<tr><td colspan="9" class="loading-text">${safeText(error.message || 'Gagal memuat data')}</td></tr>`;
    } finally {
        dataLoading = false;
    }
}

function populatePetugasFilter(data) {
    const select = document.getElementById('filterPetugas');
    if (!select) return;
    const old = select.value;
    const names = [...new Set(data.map(x => x.petugas_nama).filter(Boolean))].sort((a,b) => String(a).localeCompare(String(b)));
    select.innerHTML = '<option value="">Semua Petugas</option>';
    names.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    });
    select.value = old;
}

function filterData() { currentPage = 1; applyDataFilters(); }
function normalizeDate(value) {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : d.toISOString().slice(0, 10);
}
function getReviewDate(item) { return normalizeDate(item.tanggal || item.timestamp || item.waktu_selesai || item.waktu_mulai || item.created_at); }

function applyDataFilters() {
    const search = (document.getElementById('searchData')?.value || '').toLowerCase().trim();
    const status = document.getElementById('filterStatus')?.value || '';
    const petugas = document.getElementById('filterPetugas')?.value || '';
    const from = document.getElementById('reviewDateFrom')?.value || '';
    const to = document.getElementById('reviewDateTo')?.value || '';

    filteredDataHP = allDataHP.filter(item => {
        const text = [item.nama, item.no_hp, item.bank, item.kategori, item.data, item.petugas_nama].filter(Boolean).join(' ').toLowerCase();
        const date = getReviewDate(item);
        return (!search || text.includes(search)) &&
               (!status || item.status === status) &&
               (!petugas || item.petugas_nama === petugas) &&
               (!from || !date || date >= from) &&
               (!to || !date || date <= to);
    });

    totalPages = Math.max(1, Math.ceil(filteredDataHP.length / CONFIG.ITEMS_PER_PAGE));
    if (currentPage > totalPages) currentPage = totalPages;
    renderDataTable();
}

function safeText(value) {
    return String(value ?? '-').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function formatDataTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? safeText(value) : d.toLocaleTimeString('id-ID', {hour12:false});
}

function renderDataTable() {
    const body = document.getElementById('dataTableBody');
    if (!body) return;
    const start = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
    const rows = filteredDataHP.slice(start, start + CONFIG.ITEMS_PER_PAGE);
    const user = getCurrentUser();

    if (!rows.length) {
        body.innerHTML = '<tr><td colspan="9" class="loading-text">Tidak ada data sesuai filter</td></tr>';
        updatePagination();
        return;
    }

    body.innerHTML = rows.map((item, index) => {
        const status = item.status || 'BELUM_DICEK';
        const statusClass = status === 'BELUM_DICEK' ? 'belum' : status === 'SEDANG_DICEK' ? 'sedang' : 'sudah';
        const label = status === 'BELUM_DICEK' ? 'Belum Dicek' : status === 'SEDANG_DICEK' ? 'Sedang Dicek' : 'Sudah Dicek';
        let action = `<button type="button" class="btn-action btn-detail" onclick="showDetail('${safeText(item.data_id)}')"><i class="fas fa-info-circle"></i> DETAIL</button>`;
        if (status === 'BELUM_DICEK' && user && isPetugas()) action = `<button type="button" class="btn-action btn-cek" onclick="startCheck('${safeText(item.data_id)}')"><i class="fas fa-play"></i> CEK</button>`;
        else if (status === 'SEDANG_DICEK' && user && isPetugas() && String(item.petugas_id) === String(user.user_id)) action = `<button type="button" class="btn-action btn-selesai" onclick="finishCheck('${safeText(item.data_id)}')"><i class="fas fa-check"></i> SELESAI</button>`;
        else if (status === 'SEDANG_DICEK') action = `<span class="status-badge sedang">${safeText(item.petugas_nama || 'Sedang dicek')}</span>`;
        return `<tr><td>${start + index + 1}</td><td><strong>${safeText(item.nama)}</strong></td><td>${safeText(item.no_hp)}</td><td>${safeText(item.bank)}</td><td><span class="status-badge ${statusClass}">${label}</span></td><td>${safeText(item.petugas_nama)}</td><td>${formatDataTime(item.waktu_mulai)}</td><td>${formatDataTime(item.waktu_selesai)}</td><td>${action}</td></tr>`;
    }).join('');
    updatePagination();
}

function updatePagination() {
    const info = document.getElementById('pageInfo');
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if (info) info.textContent = `Halaman ${currentPage} dari ${totalPages}`;
    if (prev) prev.disabled = currentPage <= 1;
    if (next) next.disabled = currentPage >= totalPages;
}
function prevPage() { if (currentPage > 1) { currentPage--; renderDataTable(); } }
function nextPage() { if (currentPage < totalPages) { currentPage++; renderDataTable(); } }

async function startCheck(dataId) {
    if (!dataId) return;
    const r = await apiRequest('startCheck', {dataId});
    if (r.success) { showToast('Data berhasil diambil', 'success'); allDataHP=[]; await loadDataHP(true); loadDashboard(); }
    else showToast(r.message || 'Gagal mengambil data', 'error');
}
async function finishCheck(dataId) {
    if (!dataId || !confirm('Yakin data ini sudah selesai dicek?')) return;
    const r = await apiRequest('finishCheck', {dataId});
    if (r.success) { showToast('Pengecekan selesai', 'success'); allDataHP=[]; await loadDataHP(true); loadDashboard(); }
    else showToast(r.message || 'Gagal menyelesaikan', 'error');
}

async function showDetail(dataId) {
    const modal=document.getElementById('detailModal'), body=document.getElementById('detailModalBody');
    if (!dataId || !modal || !body) return;
    modal.classList.remove('hidden'); body.innerHTML='<div class="loading-text">Memuat detail...</div>';
    try {
        const r=await apiRequest('getDetailData',{dataId});
        if (!r.success || !r.data) throw new Error(r.message || 'Gagal memuat detail');
        const d=r.data;
        const history=Array.isArray(d.history)&&d.history.length ? d.history.map(h=>`<div class="history-item"><span class="time">${formatDataTime(h.timestamp)}</span> ${safeText(h.nama_petugas||h.user)} - ${safeText(h.action||h.aksi)} ${h.detail?'- '+safeText(h.detail):''}</div>`).join(''):'<div class="history-item">Tidak ada riwayat</div>';
        body.innerHTML=`<div class="detail-row"><span class="detail-label">Data ID</span><span class="detail-value">${safeText(d.data_id)}</span></div><div class="detail-row"><span class="detail-label">Nama</span><span class="detail-value">${safeText(d.nama)}</span></div><div class="detail-row"><span class="detail-label">No HP</span><span class="detail-value">${safeText(d.no_hp)}</span></div><div class="detail-row"><span class="detail-label">Bank</span><span class="detail-value">${safeText(d.bank)}</span></div><div class="detail-row"><span class="detail-label">Status</span><span class="detail-value">${safeText(d.status)}</span></div><div class="detail-row"><span class="detail-label">Petugas</span><span class="detail-value">${safeText(d.petugas_nama)}</span></div><div class="detail-row"><span class="detail-label">Mulai</span><span class="detail-value">${d.waktu_mulai?new Date(d.waktu_mulai).toLocaleString('id-ID'):'-'}</span></div><div class="detail-row"><span class="detail-label">Selesai</span><span class="detail-value">${d.waktu_selesai?new Date(d.waktu_selesai).toLocaleString('id-ID'):'-'}</span></div>${d.durasi?`<div class="detail-row"><span class="detail-label">Durasi</span><span class="detail-value">${safeText(d.durasi)}</span></div>`:''}<div class="detail-history"><h4>Riwayat Pengecekan</h4>${history}</div>`;
    } catch(e) { body.innerHTML=`<div class="loading-text">${safeText(e.message||'Gagal memuat detail')}</div>`; }
}
function closeDetailModal(){document.getElementById('detailModal')?.classList.add('hidden')}

let activityPage=1, activityTotalPages=1;
async function loadActivityLog(){
    const body=document.getElementById('activityLogBody'); if(!body)return;
    body.innerHTML='<tr><td colspan="4" class="loading-text">Memuat activity log...</td></tr>';
    try{const r=await apiRequest('getActivityLog',{page:activityPage,limit:CONFIG.ITEMS_PER_PAGE});if(!r.success)throw new Error(r.message||'Gagal memuat activity log');const data=Array.isArray(r.data)?r.data:[];activityTotalPages=Number(r.totalPages)||1;body.innerHTML=data.length?data.map(i=>`<tr><td>${i.timestamp?new Date(i.timestamp).toLocaleString('id-ID'):'-'}</td><td><strong>${safeText(i.nama||i.user)}</strong></td><td>${safeText(i.action)}</td><td>${safeText(i.detail)}</td></tr>`).join(''):'<tr><td colspan="4" class="loading-text">Tidak ada aktivitas</td></tr>';updateActivityPagination()}catch(e){body.innerHTML=`<tr><td colspan="4" class="loading-text">${safeText(e.message||'Gagal memuat activity log')}</td></tr>`}
}
function updateActivityPagination(){const i=document.getElementById('activityPageInfo'),p=document.getElementById('prevActivityBtn'),n=document.getElementById('nextActivityBtn');if(i)i.textContent=`Halaman ${activityPage} dari ${activityTotalPages}`;if(p)p.disabled=activityPage<=1;if(n)n.disabled=activityPage>=activityTotalPages}
function prevActivityPage(){if(activityPage>1){activityPage--;loadActivityLog()}}
function nextActivityPage(){if(activityPage<activityTotalPages){activityPage++;loadActivityLog()}}
function filterActivity(){const i=document.getElementById('searchActivity'),s=(i?.value||'').toLowerCase();document.querySelectorAll('#activityLogBody tr').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(s)?'':'none')}
