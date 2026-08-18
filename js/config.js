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

      /* Pull to Dashboard visual system */
      :root{--pt-gold:#d9a83f;--pt-gold2:#ffe69a;--pt-black:#05070b;--pt-panel:#0d1119;--pt-line:rgba(217,168,63,.18)}
      body{background:radial-gradient(900px 520px at 78% -12%,rgba(217,168,63,.13),transparent 60%),radial-gradient(720px 500px at 8% 100%,rgba(217,168,63,.06),transparent 62%),#05070b}
      .login-page{background:radial-gradient(circle at 50% 40%,rgba(217,168,63,.08),transparent 34%),#05070b}
      .login-card{border:1px solid var(--pt-line)!important;background:linear-gradient(145deg,rgba(20,20,22,.94),rgba(7,8,11,.96))!important;box-shadow:0 30px 100px rgba(0,0,0,.62),0 0 70px rgba(217,168,63,.08)!important}
      .login-card h1{font-weight:800;letter-spacing:-.045em}
      .login-card p{color:#a9a39a}
      .login-card input{border-color:rgba(217,168,63,.14)!important}
      .login-card input:focus{border-color:rgba(217,168,63,.55)!important;box-shadow:0 0 0 3px rgba(217,168,63,.08)!important}
      .btn-login{background:linear-gradient(135deg,#9b6412,#e2b84e 48%,#8a5308)!important;border:1px solid rgba(255,230,154,.25)!important;color:#fff8df!important;box-shadow:0 14px 30px rgba(180,120,25,.18)!important}
      .sidebar{background:linear-gradient(180deg,#090b10,#05070b)!important;border-right:1px solid var(--pt-line)!important}
      .sidebar-brand{height:82px!important;border-bottom:1px solid var(--pt-line)!important}
      .sidebar-brand span{font-weight:800;color:#f4e7c2}
      .menu-item.active{background:linear-gradient(90deg,rgba(217,168,63,.17),rgba(217,168,63,.035))!important;border-color:rgba(217,168,63,.2)!important;box-shadow:inset 3px 0 0 var(--pt-gold)!important}
      .menu-item.active i{color:var(--pt-gold2)}
      .main-content{background:transparent}
      .topbar{position:sticky;top:0;z-index:40;display:flex;align-items:center;justify-content:space-between;min-height:72px;padding:0 8px 0 4px;margin-bottom:24px;background:rgba(5,7,11,.78);backdrop-filter:blur(18px);border-bottom:1px solid rgba(217,168,63,.10)}
      .topbar>div:first-child{display:flex;align-items:center;gap:12px}
      .topbar strong{font-size:22px;letter-spacing:-.035em}
      .topbar-right{display:flex;align-items:center;gap:10px;color:#a9a39a;font-size:12px}
      .topbar-right span{padding:8px 11px;border:1px solid rgba(217,168,63,.10);border-radius:999px;background:rgba(255,255,255,.025)}
      .stat-card{background:linear-gradient(145deg,rgba(19,20,24,.94),rgba(9,11,15,.92))!important;border-color:rgba(217,168,63,.12)!important}
      .stat-card:hover{border-color:rgba(217,168,63,.32)!important;transform:translateY(-2px)}
      .card{background:linear-gradient(145deg,rgba(17,19,24,.92),rgba(8,10,14,.92))!important;border-color:rgba(217,168,63,.11)!important}
      .card-header{border-bottom:1px solid rgba(217,168,63,.08)}
      .page-toolbar{background:rgba(12,14,18,.84)!important;border-color:rgba(217,168,63,.12)!important}
      .btn-primary,.btn-refresh{background:linear-gradient(135deg,rgba(154,101,18,.22),rgba(217,168,63,.08))!important;border-color:rgba(217,168,63,.25)!important;color:#f6e4b7!important}
      .modal-content{background:linear-gradient(145deg,#15171c,#080a0e)!important;border-color:rgba(217,168,63,.2)!important}
      @media(max-width:760px){.topbar{min-height:62px}.topbar strong{font-size:18px}.topbar-right span:first-child{display:none}.sidebar{box-shadow:25px 0 70px rgba(0,0,0,.55)!important}}
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
