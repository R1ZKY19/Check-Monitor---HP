/**
 * Stable API client for Google Apps Script
 */
const API_TIMEOUT = 12000;
const API_LOGIN_TIMEOUT = 30000;

async function apiRequest(action, data = {}) {
    const url = CONFIG.API_URL;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    if (action === 'getCurrentUser' && token) {
        const cached = localStorage.getItem(STORAGE_KEYS.USER);
        if (cached) {
            try {
                const user = JSON.parse(cached);
                if (user && typeof user === 'object') return { success: true, data: user, local: true };
            } catch (_) {}
        }
    }

    if (!url || !/^https:\/\//i.test(url)) return { success: false, message: 'API_URL tidak valid' };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), action === 'login' ? API_LOGIN_TIMEOUT : API_TIMEOUT);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=UTF-8', 'Accept': 'application/json' },
            body: JSON.stringify({ action, data, token }),
            cache: 'no-store',
            redirect: 'follow',
            signal: controller.signal
        });

        const raw = await response.text();
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        if (!raw) throw new Error('Server mengembalikan response kosong');

        let result;
        try { result = JSON.parse(raw); }
        catch (_) { throw new Error('Response server bukan JSON yang valid'); }

        if (!result || typeof result !== 'object') throw new Error('Format response server tidak valid');
        return result;
    } catch (error) {
        const message = error?.name === 'AbortError' ? 'Server terlalu lama merespons' : (error?.message || 'Gagal terhubung ke server');
        console.error('API Error:', { action, message, error });
        return { success: false, message };
    } finally {
        clearTimeout(timeoutId);
    }
}

const apiCache = new Map();
function apiRequestWithCache(action, data = {}, cacheTime = 10000) {
    const key = action + '|' + JSON.stringify(data);
    const hit = apiCache.get(key);
    if (hit && Date.now() - hit.time < cacheTime) return Promise.resolve(hit.value);
    return apiRequest(action, data).then(value => {
        apiCache.set(key, { time: Date.now(), value });
        return value;
    });
}
function clearApiCache() { apiCache.clear(); }
