/**
 * API Client untuk Google Apps Script
 * Versi lebih stabil untuk Web App cross-origin.
 */

const API_TIMEOUT = 15000;

async function apiRequest(action, data = {}) {
    const url = CONFIG.API_URL;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    // Refresh-safe session: the browser already has the last verified user.
    // Do not block F5 on a cold Google Apps Script request.
    if (action === 'getCurrentUser' && token) {
        const cachedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (cachedUser) {
            try {
                const user = JSON.parse(cachedUser);
                if (user && typeof user === 'object') {
                    return { success: true, data: user, cached: true };
                }
            } catch (e) {
                localStorage.removeItem(STORAGE_KEYS.USER);
            }
        }
    }

    const payload = {
        action,
        data,
        token
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
        if (!url || !/^https:\/\//i.test(url)) {
            throw new Error('API_URL tidak valid');
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain;charset=UTF-8',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload),
            cache: 'no-store',
            redirect: 'follow',
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${response.statusText}`);
        }

        const raw = await response.text();

        if (!raw) {
            throw new Error('Server mengembalikan response kosong');
        }

        let result;
        try {
            result = JSON.parse(raw);
        } catch (parseError) {
            console.error('API mengembalikan response bukan JSON:', raw.slice(0, 500));
            throw new Error('Response server bukan JSON yang valid');
        }

        if (!result || typeof result !== 'object') {
            throw new Error('Format response server tidak valid');
        }

        return result;
    } catch (error) {
        const isTimeout = error?.name === 'AbortError';
        const message = isTimeout
            ? 'Server terlalu lama merespons'
            : (error?.message || 'Gagal terhubung ke server');

        console.error('API Error:', {
            action,
            url,
            message,
            error
        });

        return {
            success: false,
            message
        };
    } finally {
        clearTimeout(timeoutId);
    }
}

let requestCache = {};
let lastRequestTime = {};

function apiRequestWithCache(action, data = {}, cacheTime = 5000) {
    const key = action + JSON.stringify(data);
    const now = Date.now();

    if (
        Object.prototype.hasOwnProperty.call(requestCache, key) &&
        (now - lastRequestTime[key] < cacheTime)
    ) {
        return Promise.resolve(requestCache[key]);
    }

    return apiRequest(action, data).then(result => {
        requestCache[key] = result;
        lastRequestTime[key] = Date.now();
        return result;
    });
}

function clearApiCache() {
    requestCache = {};
    lastRequestTime = {};
}
