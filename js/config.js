/**
 * CONFIGURATION
 * Ubah API_URL dengan URL Google Apps Script Web App Anda
 */

const CONFIG = {
    // URL Web App Google Apps Script terbaru
    API_URL: 'https://script.google.com/macros/s/AKfycbxEFazNpp9qEvE3sKEnWlZkvR1-vBcHqYEHq-rfWsr6d1oxbjY-bbiPrkSyh3ciN9Mt/exec',
    
    // Interval polling dalam milidetik
    POLLING_INTERVAL: 5000,
    
    // Interval heartbeat
    HEARTBEAT_INTERVAL: 10000,
    
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
