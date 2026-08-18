/**
 * CONFIGURATION
 * Check Monitor
 */
const CONFIG = {
    API_URL: 'https://script.google.com/macros/s/AKfycbyQuN32b1_u-JB5I38Da9spv7oCHTRgUh8_6s004CD1rrmcC23aanpEn90ScwS0IyUS/exec',
    POLLING_INTERVAL: 15000,
    HEARTBEAT_INTERVAL: 30000,
    OFFLINE_TIMEOUT: 60,
    ITEMS_PER_PAGE: 20,
    VERSION: '3.1.0'
};

const STORAGE_KEYS = {
    TOKEN: 'authToken',
    USER: 'userData'
};

// Brand/logo: Pull to Dashboard
const DASHBOARD_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 320" role="img" aria-label="Pull to Dashboard">
<defs>
 <radialGradient id="bg" cx="50%" cy="45%"><stop offset="0" stop-color="#242424"/><stop offset="1" stop-color="#050505"/></radialGradient>
 <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#8a4d08"/><stop offset=".28" stop-color="#ffd76a"/><stop offset=".52" stop-color="#fff0a0"/><stop offset=".75" stop-color="#d99a2b"/><stop offset="1" stop-color="#6d3805"/></linearGradient>
 <linearGradient id="phone" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d7d5e7"/><stop offset=".5" stop-color="#746f8d"/><stop offset="1" stop-color="#24212f"/></linearGradient>
 <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>
<circle cx="160" cy="160" r="154" fill="#030303" stroke="url(#gold)" stroke-width="7"/>
<circle cx="160" cy="160" r="137" fill="url(#bg)" stroke="url(#gold)" stroke-width="3"/>
<path d="M64 105 A120 120 0 0 1 94 72" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
<path d="M256 105 A120 120 0 0 0 226 72" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
<path d="M64 215 A120 120 0 0 0 77 246" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
<path d="M256 215 A120 120 0 0 1 243 246" fill="none" stroke="url(#gold)" stroke-width="8" stroke-linecap="round"/>
<rect x="128" y="46" width="70" height="153" rx="16" fill="url(#phone)" stroke="#111" stroke-width="4"/>
<rect x="137" y="68" width="52" height="108" rx="9" fill="#090b0f" stroke="url(#gold)" stroke-width="2"/>
<rect x="150" y="53" width="26" height="5" rx="3" fill="#090909"/>
<path d="M104 91 C91 95 78 105 75 121 L74 146 C74 153 80 158 87 157 L98 155 L101 132 C104 119 113 111 126 105 L139 98 C146 94 148 86 143 81 C139 77 132 77 126 81 L112 90 Z" fill="url(#gold)" stroke="#5b3307" stroke-width="2" filter="url(#glow)"/>
<g fill="url(#gold)" stroke="#6d3d09" stroke-width="2"><rect x="185" y="91" width="30" height="16" rx="8"/><rect x="185" y="112" width="30" height="16" rx="8"/><rect x="185" y="133" width="30" height="16" rx="8"/><rect x="185" y="154" width="30" height="16" rx="8"/></g>
<text x="160" y="235" text-anchor="middle" fill="url(#gold)" font-family="Georgia,serif" font-size="31" font-weight="700" letter-spacing="-1">Pull to</text>
<text x="160" y="258" text-anchor="middle" fill="#d7b45d" font-family="Arial,sans-serif" font-size="10" font-weight="700" letter-spacing="4">DASHBOARD</text>
<path d="M98 267 H126 M194 267 H222" stroke="url(#gold)" stroke-width="2"/>
</svg>`;

function installBranding() {
    if (!document.head.querySelector('link[data-cm-preconnect]')) {
        ['https://script.google.com','https://fonts.googleapis.com','https://cdnjs.cloudflare.com'].forEach(href => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = href;
            link.dataset.cmPreconnect = '1';
            document.head.appendChild(link);
        });
    }

    const style = document.createElement('style');
    style.textContent = `
      .cm-brand-logo{width:52px;height:52px;display:block;object-fit:contain;filter:drop-shadow(0 8px 22px rgba(218,165,55,.28))}
      .login-logo .cm-brand-logo{width:112px;height:112px;margin:0 auto 14px}
      .sidebar-brand .cm-brand-logo{width:42px;height:42px;flex:0 0 42px}
      .sidebar-brand{display:flex;align-items:center;gap:11px}
      .login-card>h1{margin-top:0}
      .cm-brand-name{font-weight:800;letter-spacing:-.02em}
    `;
    document.head.appendChild(style);

    const loginLogo = document.querySelector('.login-logo');
    if (loginLogo) loginLogo.innerHTML = DASHBOARD_LOGO_SVG;

    const sidebarBrand = document.querySelector('.sidebar-brand');
    if (sidebarBrand) {
        const icon = sidebarBrand.querySelector('i');
        if (icon) icon.outerHTML = DASHBOARD_LOGO_SVG;
        const logo = sidebarBrand.querySelector('svg');
        if (logo) logo.classList.add('cm-brand-logo');
    }

    let favicon = document.querySelector('link[data-cm-favicon]');
    if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.dataset.cmFavicon = '1';
        document.head.appendChild(favicon);
    }
    favicon.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(DASHBOARD_LOGO_SVG);
    document.title = 'Pull to Dashboard';
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installBranding, { once: true });
else installBranding();
