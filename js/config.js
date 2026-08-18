/**
 * CONFIGURATION
 * Ubah API_URL dengan URL Google Apps Script Web App Anda
 */

const CONFIG = {
    // Ganti dengan URL Web App Anda setelah deploy
    API_URL: 'https://script.google.com/macros/s/AKfycbz7RsJM_Z7MVffs_AhXY8-ckKwpSb3TUOaCVHHEg8-r1p-hoThnuSJpK1bO_cKr3M3T/exec',
    
    // Interval polling dalam milidetik
    POLLING_INTERVAL: 5000, // 5 detik
    
    // Interval heartbeat
    HEARTBEAT_INTERVAL: 10000, // 10 detik
    
    // Timeout offline (detik)
    OFFLINE_TIMEOUT: 30,
    
    // Items per page
    ITEMS_PER_PAGE: 20,
    
    // Versi
    VERSION: '1.0.0'
};

// Storage keys
const STORAGE_KEYS = {
    TOKEN: 'authToken',
    USER: 'userData'
};
