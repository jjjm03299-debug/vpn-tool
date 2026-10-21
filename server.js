/**
 * VPN Command Instrument - Express Server & Vercel Dashboard
 * 
 * Includes:
 * - Full Express REST API with simulated VPN behavior
 * - Endpoints: /api/vpn/test/sleep, /api/logs, /api/version, /api/vpn/ip, /api/info
 * - Modern dark glassmorphism dashboard UI
 * - Vercel serverless deployment setup instructions
 */

const express = require('express');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mock database state
let vpnState = {
  status: 'Disconnected',
  currentCountry: null,
  ip: 'Not assigned',
  lastUpdated: 'Never',
  logs: [
    `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] [SYSTEM] Server initialized in Vercel-ready mode.`
  ],
  version: '1.4.2-stable',
  build: '2026.10.21-prod'
};

// 10 Countries Flag Data
const COUNTRIES = [
  { code: 'MD', name: 'Moldova', region: 'Europe', flag: '🇲🇩', latency: '12ms' },
  { code: 'RO', name: 'Romania', region: 'Europe', flag: '🇷🇴', latency: '24ms' },
  { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪', latency: '35ms' },
  { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸', latency: '98ms' },
  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧', latency: '42ms' },
  { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷', latency: '38ms' },
  { code: 'JP', name: 'Japan', region: 'Asia', flag: '🇯🇵', latency: '180ms' },
  { code: 'CA', name: 'Canada', region: 'North America', flag: '🇨🇦', latency: '110ms' },
  { code: 'AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺', latency: '220ms' },
  { code: 'SG', name: 'Singapore', region: 'Asia', flag: '🇸🇬', latency: '165ms' }
];

// Helper to generate a random fake VPN IP
function generateRandomIP() {
  return `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 254) + 1}`;
}

// Helper for deliberate sleep timing
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for timestamp formatting
function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { hour12: false });
}

// Helper to append to logs
function addLog(message) {
  const logEntry = `[${getTimestamp()}] ${message}`;
  vpnState.logs.unshift(logEntry);
  if (vpnState.logs.length > 50) vpnState.logs.pop(); // Keep max 50 entries
  return logEntry;
}

/* ==========================================================================
   API ENDPOINTS
   ========================================================================== */

// 1. Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    version: vpnState.version,
    timestamp: getTimestamp(),
    environment: process.env.VERCEL ? 'Vercel Serverless' : 'Standalone Node'
  });
});

// 2. Current Status
app.get('/api/status', (req, res) => {
  res.json(vpnState);
});

// 3. List Countries
app.get('/api/countries', (req, res) => {
  res.json(COUNTRIES);
});

// 4. Connect VPN
app.post('/api/connect', async (req, res) => {
  const { countryCode, delay } = req.body;
  const targetCountry = COUNTRIES.find(c => c.code === countryCode) || COUNTRIES[0];
  const waitTime = parseInt(delay) || 0;

  if (waitTime > 0) {
    await sleep(waitTime);
  }

  vpnState.status = 'Connected';
  vpnState.currentCountry = targetCountry;
  vpnState.ip = generateRandomIP();
  vpnState.lastUpdated = getTimestamp();

  addLog(`[CONNECT] Tunnel established via ${targetCountry.name} (${targetCountry.code}). IP assigned: ${vpnState.ip}. Delay: ${waitTime}ms`);

  res.json({ success: true, state: vpnState });
});

// 5. Disconnect VPN
app.post('/api/disconnect', async (req, res) => {
  const { delay } = req.body;
  const waitTime = parseInt(delay) || 0;

  if (waitTime > 0) {
    await sleep(waitTime);
  }

  vpnState.status = 'Disconnected';
  vpnState.currentCountry = null;
  vpnState.ip = 'Not assigned';
  vpnState.lastUpdated = getTimestamp();

  addLog(`[DISCONNECT] Tunnel closed gracefully. Delay: ${waitTime}ms`);

  res.json({ success: true, state: vpnState });
});

// 6. Address Pool Generator
app.get('/api/pool', (req, res) => {
  const count = parseInt(req.query.count) || 3;
  const addresses = Array.from({ length: count }, () => generateRandomIP());
  res.json({ addresses });
});

/* --- NEW REQUESTED ENDPOINTS --- */

// 7. /api/vpn/test/sleep - Test response delay execution
app.all('/api/vpn/test/sleep', async (req, res) => {
  const ms = parseInt(req.query.ms || req.body.ms || 1000);
  const clampedMs = Math.min(Math.max(ms, 0), 10000); // Max 10s safety limit
  const start = Date.now();
  
  await sleep(clampedMs);
  const elapsed = Date.now() - start;

  addLog(`[TEST/SLEEP] Executed intentional server delay of ${clampedMs}ms (actual: ${elapsed}ms)`);

  res.json({
    status: 'completed',
    requestedDelayMs: clampedMs,
    elapsedMs: elapsed,
    timestamp: getTimestamp()
  });
});

// 8. /api/logs - Fetch raw logs list
app.get('/api/logs', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json({
    count: vpnState.logs.length,
    logs: vpnState.logs.slice(0, limit)
  });
});

// 9. /api/version - Get detailed application versioning details
app.get('/api/version', (req, res) => {
  res.json({
    version: vpnState.version,
    build: vpnState.build,
    nodeVersion: process.version,
    platform: process.platform,
    vercelDeployment: !!process.env.VERCEL
  });
});

// 10. /api/vpn/ip - Get current IP address and assignment details
app.get('/api/vpn/ip', (req, res) => {
  res.json({
    ip: vpnState.ip,
    status: vpnState.status,
    country: vpnState.currentCountry ? vpnState.currentCountry.name : null,
    countryCode: vpnState.currentCountry ? vpnState.currentCountry.code : null,
    isProtected: vpnState.status === 'Connected',
    lastAssigned: vpnState.lastUpdated
  });
});

// 11. /api/info - General system summary & route inspection
app.get('/api/info', (req, res) => {
  res.json({
    appName: 'VPN Command Instrument',
    version: vpnState.version,
    deploymentTarget: process.env.VERCEL ? 'Vercel Serverless Platform' : 'Local / Node.js Engine',
    uptime: process.uptime(),
    activeRoutesCount: COUNTRIES.length,
    currentState: {
      status: vpnState.status,
      assignedIp: vpnState.ip,
      activeCountry: vpnState.currentCountry ? vpnState.currentCountry.name : 'None'
    },
    availableEndpoints: [
      'GET  /api/health',
      'GET  /api/status',
      'GET  /api/countries',
      'POST /api/connect',
      'POST /api/disconnect',
      'GET  /api/pool?count=3',
      'ALL  /api/vpn/test/sleep?ms=1000',
      'GET  /api/logs?limit=20',
      'GET  /api/version',
      'GET  /api/vpn/ip',
      'GET  /api/info'
    ]
  });
});

/* ==========================================================================
   HTML DASHBOARD FRONTEND
   ========================================================================== */

app.get('/', (req, res) => {
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VPN Command Instrument Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #09090b;
      --surface: rgba(20, 20, 23, 0.7);
      --surface-border: rgba(255, 255, 255, 0.08);
      --surface-muted: #1c1c21;
      --border: #27272a;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
      --primary: #3b82f6;
      --primary-hover: #2563eb;
      --success: #10b981;
      --danger: #ef4444;
      --accent-purple: #8b5cf6;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg);
      background-image: 
        radial-gradient(at 10% 10%, rgba(59, 130, 246, 0.08) 0px, transparent 50%),
        radial-gradient(at 90% 90%, rgba(139, 92, 246, 0.06) 0px, transparent 50%);
      color: var(--text);
      padding: 2rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
      min-height: 100vh;
    }

    header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 1rem;
    }

    header h1 {
      font-size: 1.85rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.4rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    header p {
      color: var(--text-muted);
      font-size: 0.95rem;
      max-width: 650px;
      line-height: 1.5;
    }

    .badge-group {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .badge {
      font-family: 'JetBrains Mono', monospace;
      background: var(--surface-muted);
      padding: 0.3rem 0.6rem;
      border-radius: 6px;
      font-size: 0.75rem;
      color: var(--primary);
      border: 1px solid var(--border);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .badge-vercel {
      color: #000;
      background: #fff;
      border-color: #fff;
      font-weight: 700;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    @media(max-width: 868px) {
      .grid { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--surface);
      backdrop-filter: blur(12px);
      border: 1px solid var(--surface-border);
      border-radius: 14px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
    }

    .card-title {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 700;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 50px;
      font-size: 0.8rem;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .status-Disconnected {
      background: rgba(239, 68, 68, 0.1);
      color: var(--danger);
      border: 1px solid rgba(239, 68, 68, 0.2);
    }

    .status-Connected {
      background: rgba(16, 185, 129, 0.1);
      color: var(--success);
      border: 1px solid rgba(16, 185, 129, 0.2);
    }

    .metric-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .metric-row:last-child { border-bottom: none; }
    .metric-label { color: var(--text-muted); font-size: 0.9rem; }
    .metric-value { font-weight: 600; font-size: 0.95rem; }
    .metric-value.mono { font-family: 'JetBrains Mono', monospace; }

    .btn {
      width: 100%;
      padding: 0.85rem;
      background: var(--primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.5rem;
    }

    .btn:hover { opacity: 0.9; transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn-danger { background: var(--danger); }
    .btn-secondary { background: var(--surface-muted); border: 1px solid var(--border); color: var(--text); }
    .btn-secondary:hover { background: #27272a; }

    .country-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 0.75rem;
      max-height: 240px;
      overflow-y: auto;
      padding-right: 0.25rem;
    }

    .country-item {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      padding: 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      text-align: center;
      transition: all 0.2s;
    }

    .country-item:hover, .country-item.selected {
      border-color: var(--primary);
      background: rgba(59, 130, 246, 0.1);
    }

    .country-flag { font-size: 1.5rem; margin-bottom: 0.25rem; }
    .country-name { font-size: 0.85rem; font-weight: 600; }
    .country-code { font-size: 0.75rem; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

    .slider-container { margin: 1.25rem 0; }
    .slider-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      margin-bottom: 0.5rem;
      color: var(--text-muted);
    }

    input[type=range] { width: 100%; accent-color: var(--primary); }

    .pool-ips {
      background: var(--bg);
      border: 1px solid var(--border);
      padding: 0.75rem;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      margin-top: 1rem;
      min-height: 48px;
      white-space: pre-line;
      color: var(--success);
    }

    .logs-box {
      background: #000;
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      max-height: 220px;
      overflow-y: auto;
      color: #a1a1aa;
      line-height: 1.6;
    }

    .log-entry {
      margin-bottom: 0.35rem;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      padding-bottom: 0.25rem;
    }

    .counter-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .counter-btn {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-family: monospace;
      font-size: 1rem;
    }

    .counter-val {
      font-family: 'JetBrains Mono', monospace;
      font-weight: bold;
      padding: 0 0.5rem;
    }

    .api-badge-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.5rem;
    }

    .api-chip {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.7rem;
      padding: 0.2rem 0.5rem;
      background: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      border-radius: 4px;
      color: var(--text-muted);
      cursor: pointer;
    }

    .api-chip:hover { border-color: var(--primary); color: var(--primary); }

    /* Modal Styling for API inspector */
    .modal-overlay {
      display: none;
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(4px);
      z-index: 100;
      justify-content: center;
      align-items: center;
    }

    .modal-content {
      background: var(--surface-muted);
      border: 1px solid var(--border);
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      padding: 1.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.8);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .modal-title { font-weight: 700; font-size: 1rem; }
    .close-btn { cursor: pointer; color: var(--text-muted); font-size: 1.2rem; }

    pre {
      background: #000;
      padding: 1rem;
      border-radius: 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      max-height: 300px;
      overflow: auto;
      color: #34d399;
    }
  </style>
</head>
<body>

  <header>
    <div>
      <h1>🌐 VPN Command Instrument</h1>
      <p>Control tunnel simulation, manage endpoint networks, test latency sleep behaviors, and inspect direct serverless APIs.</p>
    </div>
    <div class="badge-group">
      <span class="badge badge-vercel">▲ Vercel Ready</span>
      <span class="badge" id="versionBadge">v1.4.2-stable</span>
    </div>
  </header>

  <div class="grid">
    <!-- LEFT COLUMN: CONTROL PANEL -->
    <div>
      <div class="card">
        <div class="card-title">01 / Choose Route Endpoint</div>
        <div class="country-grid" id="countryGrid"></div>
      </div>

      <div class="card">
        <div class="card-title">02 / Address Pool Generator</div>
        <div class="counter-controls">
          <span class="metric-label">Pool Count:</span>
          <button class="counter-btn" onclick="adjustCount(-1)">-</button>
          <span class="counter-val" id="poolCount">3</span>
          <button class="counter-btn" onclick="adjustCount(1)">+</button>
        </div>
        <button class="btn btn-secondary" onclick="generatePool()">Issue Pool Addresses (/api/pool)</button>
        <div class="pool-ips" id="poolIps">Generated pool IPs will appear here...</div>
      </div>

      <div class="card">
        <div class="card-title">03 / Simulator Delay & Tunnel Control</div>
        <div class="slider-container">
          <div class="slider-header">
            <span>Sleep Deliberate Delay</span>
            <span id="delayVal" style="font-family: 'JetBrains Mono'; color: var(--primary);">750 ms</span>
          </div>
          <input type="range" id="delaySlider" min="0" max="3000" step="250" value="750" oninput="updateDelayLabel(this.value)">
        </div>
        <button id="actionBtn" class="btn" onclick="toggleConnection()">Connect Tunnel</button>
      </div>
    </div>

    <!-- RIGHT COLUMN: MONITOR & STATUS -->
    <div>
      <div class="card" style="border-left: 4px solid var(--primary);">
        <div class="card-title">
          <span>Live Tunnel State</span>
          <span id="statusBadge" class="status-badge status-Disconnected">Standby</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Route Endpoint</span>
          <span class="metric-value" id="currentEndpoint">No active tunnel</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Assigned Virtual IP</span>
          <span class="metric-value mono" id="privateAddress">Not assigned</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Session Updated</span>
          <span class="metric-value mono" id="sessionUpdated">00:00:00</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Transport State</span>
          <span class="metric-value" id="transportState" style="color: var(--text-muted);">Available / Idle</span>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span>Live Diagnostic Logs</span>
          <button onclick="fetchLogs()" style="background:transparent; border:none; color:var(--primary); cursor:pointer; font-size:0.75rem;">Refresh</button>
        </div>
        <div class="logs-box" id="logsBox">
          <div class="log-entry">[00:00:00] System initialized. Ready for route selection.</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">API Endpoint Inspector</div>
        <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">Click an endpoint to perform a live test query:</p>
        <div class="api-badge-list">
          <span class="api-chip" onclick="inspectApi('/api/vpn/ip')">GET /api/vpn/ip</span>
          <span class="api-chip" onclick="inspectApi('/api/version')">GET /api/version</span>
          <span class="api-chip" onclick="inspectApi('/api/info')">GET /api/info</span>
          <span class="api-chip" onclick="inspectApi('/api/logs?limit=5')">GET /api/logs</span>
          <span class="api-chip" onclick="inspectApi('/api/vpn/test/sleep?ms=500')">ALL /api/vpn/test/sleep</span>
          <span class="api-chip" onclick="inspectApi('/api/health')">GET /api/health</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div class="modal-overlay" id="apiModal">
    <div class="modal-content">
      <div class="modal-header">
        <div class="modal-title" id="modalTitle">API Response</div>
        <span class="close-btn" onclick="closeModal()">&times;</span>
      </div>
      <pre id="modalJson">Loading...</pre>
    </div>
  </div>

  <script>
    let selectedCountryCode = 'MD';
    let poolAddressCount = 3;

    function updateDelayLabel(val) {
      document.getElementById('delayVal').innerText = val + ' ms';
    }

    function adjustCount(amount) {
      poolAddressCount = Math.max(1, Math.min(10, poolAddressCount + amount));
      document.getElementById('poolCount').innerText = poolAddressCount;
    }

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        const data = await res.json();
        updateUI(data);
      } catch(e) { console.error(e); }
    }

    function updateUI(data) {
      const badge = document.getElementById('statusBadge');
      const actionBtn = document.getElementById('actionBtn');
      const epElement = document.getElementById('currentEndpoint');
      const addrElement = document.getElementById('privateAddress');
      const syncElement = document.getElementById('sessionUpdated');
      const transElement = document.getElementById('transportState');

      badge.innerText = data.status === 'Connected' ? 'Protected / Active' : 'Standby';
      badge.className = 'status-badge status-' + data.status;

      if (data.status === 'Connected' && data.currentCountry) {
        actionBtn.innerText = 'Disconnect Tunnel';
        actionBtn.className = 'btn btn-danger';
        epElement.innerHTML = \`\${data.currentCountry.flag} \${data.currentCountry.name} <span style="color:var(--text-muted); font-size:0.8rem;">(\${data.currentCountry.region})</span>\`;
        addrElement.innerText = data.ip;
        transElement.innerText = 'Tunnel Connected';
        transElement.style.color = 'var(--success)';
      } else {
        actionBtn.innerText = 'Connect Tunnel';
        actionBtn.className = 'btn';
        epElement.innerText = 'No active tunnel on this endpoint';
        addrElement.innerText = 'Not assigned';
        transElement.innerText = 'Available / Idle';
        transElement.style.color = 'var(--text-muted)';
      }

      if(data.lastUpdated !== 'Never') {
        syncElement.innerText = data.lastUpdated;
      }

      if (data.logs && data.logs.length > 0) {
        renderLogs(data.logs);
      }
    }

    function renderLogs(logsArray) {
      const logsBox = document.getElementById('logsBox');
      logsBox.innerHTML = logsArray.map(log => \`<div class="log-entry">\${log}</div>\`).join('');
    }

    async function fetchLogs() {
      const res = await fetch('/api/logs?limit=15');
      const data = await res.json();
      if(data.logs) renderLogs(data.logs);
    }

    async function toggleConnection() {
      const btn = document.getElementById('actionBtn');
      btn.innerText = 'Processing Tunnel...';
      btn.disabled = true;

      const delay = document.getElementById('delaySlider').value;
      const currentBadge = document.getElementById('statusBadge').innerText;
      const isConnected = currentBadge.includes('Protected') || btn.className.includes('danger');

      const url = isConnected ? '/api/disconnect' : '/api/connect';
      const body = isConnected ? { delay } : { countryCode: selectedCountryCode, delay };

      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        updateUI(data.state);
      } catch (err) {
        console.error(err);
      } finally {
        btn.disabled = false;
      }
    }

    async function generatePool() {
      const res = await fetch(\`/api/pool?count=\${poolAddressCount}\`);
      const data = await res.json();
      document.getElementById('poolIps').innerText = data.addresses.join('\\n');
    }

    async function initCountries() {
      try {
        const res = await fetch('/api/countries');
        const countries = await res.json();
        const grid = document.getElementById('countryGrid');
        grid.innerHTML = countries.map(c => \`
          <div class="country-item \${c.code === selectedCountryCode ? 'selected' : ''}" onclick="selectCountry('\${c.code}', this)">
            <div class="country-flag">\${c.flag}</div>
            <div class="country-name">\${c.name}</div>
            <div class="country-code">\${c.code} • \${c.latency}</div>
          </div>
        \`).join('');
      } catch(e) { console.error(e); }
    }

    function selectCountry(code, element) {
      selectedCountryCode = code;
      document.querySelectorAll('.country-item').forEach(el => el.classList.remove('selected'));
      element.classList.add('selected');
    }

    async function inspectApi(endpoint) {
      document.getElementById('modalTitle').innerText = endpoint;
      document.getElementById('modalJson').innerText = 'Executing query...';
      document.getElementById('apiModal').style.display = 'flex';

      try {
        const res = await fetch(endpoint);
        const data = await res.json();
        document.getElementById('modalJson').innerText = JSON.stringify(data, null, 2);
      } catch(err) {
        document.getElementById('modalJson').innerText = 'Error fetching API endpoint: ' + err.message;
      }
    }

    function closeModal() {
      document.getElementById('apiModal').style.display = 'none';
    }

    window.onload = async () => {
      await initCountries();
      await fetchStatus();
    };
  </script>
</body>
</html>`;
  res.send(htmlContent);
});

// Export Express app for Vercel Serverless Function deployment
module.exports = app;

// Local development listener
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`VPN Command Instrument active on http://localhost:${PORT}`);
  });
}
