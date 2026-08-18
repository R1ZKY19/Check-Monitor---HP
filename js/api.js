/**
 * API Client untuk Google Apps Script
 */

async function apiRequest(action, data = {}) {
    const url = CONFIG.API_URL;
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const payload = {
        action: action,
        data: data,
        token: token
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: 'Gagal terhubung ke server'
        };
    }
}

// Helper untuk request dengan cache
let requestCache = {};
let lastRequestTime = {};

function apiRequestWithCache(action, data = {}, cacheTime = 5000) {
    const key = action + JSON.stringify(data);
    const now = Date.now();
    
    if (requestCache[key] && (now - lastRequestTime[key] < cacheTime)) {
        return Promise.resolve(requestCache[key]);
    }
    
    return apiRequest(action, data).then(result => {
        requestCache[key] = result;
        lastRequestTime[key] = now;
        return result;
    });
}
