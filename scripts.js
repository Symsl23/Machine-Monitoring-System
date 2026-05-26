
// ── Clock ──
function updateClock() {
  const now = new Date();
  document.getElementById('clock').textContent = now.toTimeString().slice(0,8);
}
setInterval(updateClock, 1000);
updateClock();

// ── Simulated state ──
const state = {
  running: true,
  vibRMS: 2.8,
  freq: 50,
  temp: 54,
  current: 12.4,
  uptimeSeconds: 15791,
  sessionPeak: 2.8,
  cycles: 0,
  alerts: 0,
  tempHistory: [],
  totalTick: 0
};

// Pre-fill temp history
for (let i = 0; i < 60; i++) state.tempHistory.push(+(50 + Math.random()*8).toFixed(1));

// ── Uptime counter ──
setInterval(() => {
  if (state.running) state.uptimeSeconds++;
  const h = String(Math.floor(state.uptimeSeconds/3600)).padStart(2,'0');
  const m = String(Math.floor((state.uptimeSeconds%3600)/60)).padStart(2,'0');
  const s = String(state.uptimeSeconds%60).padStart(2,'0');
  document.getElementById('uptime').textContent = `Uptime: ${h}:${m}:${s}`;
}, 1000);

// ── Waveform chart ──
const waveCtx = document.getElementById('waveChart').getContext('2d');
const WAVE_POINTS = 80;
const waveData = Array(WAVE_POINTS).fill(0);
const waveLabels = Array(WAVE_POINTS).fill('');

const waveChart = new Chart(waveCtx, {
  type: 'line',
  data: {
    labels: waveLabels,
    datasets: [{
      data: waveData,
      borderColor: '#4d9fff',
      borderWidth: 1.5,
      tension: 0.3,
      pointRadius: 0,
      fill: { target: 'origin', above: 'rgba(77,159,255,0.06)', below: 'rgba(77,159,255,0.06)' }
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: {
        min: -12, max: 12,
        grid: { color: 'rgba(255,255,255,0.04)', lineWidth: 1 },
        ticks: { color: '#4a5260', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 5 },
        border: { color: 'transparent' }
      }
    }
  }
});

// ── Vibration historical chart ──
const VH = 60;
const vhLabels = Array.from({length:VH}, (_,i) => i===0?'60m ago':i===VH-1?'now':'');
const vhRMS = Array.from({length:VH}, () => +(1.5+Math.random()*4).toFixed(2));
const vhPeak = vhRMS.map(v => +(v * (1.2+Math.random()*0.5)).toFixed(2));

const vibHistCtx = document.getElementById('vibHistChart').getContext('2d');
const vibHistChart = new Chart(vibHistCtx, {
  type: 'line',
  data: {
    labels: vhLabels,
    datasets: [
      {
        label: 'Peak', data: vhPeak,
        borderColor: '#4d9fff', borderWidth: 1.5, pointRadius: 0, tension: 0.3,
        fill: false, borderDash: [4,3]
      },
      {
        label: 'RMS', data: vhRMS,
        borderColor: '#00c896', borderWidth: 1.5, pointRadius: 0, tension: 0.3,
        fill: { target: 'origin', above: 'rgba(0,200,150,0.07)' }
      }
    ]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1a1e25',
      borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
      titleColor: '#7a8494', bodyColor: '#e8ecf0',
      titleFont: { family: 'DM Mono', size: 10 },
      bodyFont: { family: 'DM Mono', size: 11 },
      callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} mm/s` }
    }},
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4a5260', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 4 }, border: { color: 'transparent' } },
      y: {
        min: 0, suggestedMax: 10,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#4a5260', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 4 },
        border: { color: 'transparent' }
      }
    }
  }
});

// ── Motor status history chart ──
const statusData = Array.from({length:VH}, () => Math.random() > 0.12 ? 1 : 0);

const statusHistCtx = document.getElementById('statusHistChart').getContext('2d');
const statusHistChart = new Chart(statusHistCtx, {
  type: 'bar',
  data: {
    labels: vhLabels,
    datasets: [{
      data: statusData,
      backgroundColor: statusData.map(v => v ? 'rgba(0,200,150,0.7)' : 'rgba(224,80,80,0.7)'),
      borderRadius: 2,
      borderSkipped: false
    }]
  },
  options: {
    responsive: true, maintainAspectRatio: false,
    animation: { duration: 300 },
    plugins: { legend: { display: false }, tooltip: {
      backgroundColor: '#1a1e25',
      borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
      titleColor: '#7a8494', bodyColor: '#e8ecf0',
      titleFont: { family: 'DM Mono', size: 10 },
      bodyFont: { family: 'DM Mono', size: 11 },
      callbacks: {
        label: ctx => ` Status: ${ctx.parsed.y === 1 ? 'Running' : 'Stopped'}`
      }
    }},
    scales: {
      x: { grid: { display: false }, ticks: { color: '#4a5260', font: { family: 'DM Mono', size: 10 }, maxTicksLimit: 4 }, border: { color: 'transparent' } },
      y: {
        min: 0, max: 1.4,
        grid: { display: false },
        ticks: { display: false },
        border: { color: 'transparent' }
      }
    },
    categoryPercentage: 0.95,
    barPercentage: 0.95
  }
});

// ── Event log ──
const events = [];
function addEvent(type, msg) {
  const now = new Date();
  const t = now.toTimeString().slice(0,8);
  events.unshift({ time: t, type, msg });
  if (events.length > 30) events.pop();
  renderEvents();
  if (type === 'warn' || type === 'alert') { state.alerts++; document.getElementById('statAlerts').textContent = state.alerts; }
}
function renderEvents() {
  const el = document.getElementById('eventList');
  el.innerHTML = events.slice(0,8).map(e => `
    <div class="event-item">
      <span class="event-time">${e.time}</span>
      <span class="event-tag tag-${e.type}">${e.type}</span>
      <span class="event-msg">${e.msg}</span>
    </div>
  `).join('');
  document.getElementById('eventCount').textContent = `${events.length} events`;
}

// Initial events
addEvent('info', 'System initialized — motor A1 online');
addEvent('normal', 'Vibration within normal range (2.8 mm/s RMS)');
addEvent('info', 'Sensor calibration OK — all channels active');

// ── Metric update helpers ──
function setMetric(id, val, unit, barPct, level) {
  const valEl = document.getElementById(id+'Val');
  const barEl = document.getElementById(id+'Bar');
  const cardEl = document.getElementById('card'+id.charAt(0).toUpperCase()+id.slice(1));
  if (valEl) { valEl.textContent = val; valEl.className = 'metric-value' + (level ? ' '+level : ''); }
  if (barEl) { barEl.style.width = Math.min(barPct,100)+'%'; barEl.className = 'metric-bar' + (level ? ' '+level : ''); }
  if (cardEl) { cardEl.className = 'metric-card' + (level ? ' '+level : ''); }
}

// ── Motor status update ──
function updateStatus(running) {
  const badge = document.getElementById('statusBadge');
  const txt = document.getElementById('statusText');
  const rotor = document.getElementById('rotorEl');
  badge.className = 'status-badge ' + (running ? 'running' : 'stopped');
  txt.textContent = running ? 'Running' : 'Stopped';
  rotor.className = 'rotor ' + (running ? 'spinning' : 'stopped');
}

// ── Main simulation tick ──
let lastStatus = true;
let lastAlertVib = false;
let lastWarnTemp = false;

function tick() {
  state.totalTick++;

  // Random motor stop/start events (rare)
  if (Math.random() < 0.003) {
    state.running = !state.running;
    if (!state.running) { state.cycles++; document.getElementById('statCycles').textContent = state.cycles; }
    updateStatus(state.running);
    addEvent(state.running ? 'normal' : 'alert', state.running ? 'Motor started — returning to normal operation' : 'Motor stopped — run command lost');
  }
  lastStatus = state.running;

  // Vibration simulation
  const baseVib = state.running ? 2.5 + Math.sin(state.totalTick/20)*0.3 : 0.1;
  const noise = (Math.random()-0.5)*0.6;
  state.vibRMS = Math.max(0, +(baseVib + noise).toFixed(2));
  if (Math.random() < 0.005) state.vibRMS = +(5 + Math.random()*4).toFixed(2); // spike

  if (state.vibRMS > state.sessionPeak) {
    state.sessionPeak = state.vibRMS;
    document.getElementById('statPeak').textContent = state.sessionPeak.toFixed(2);
  }

  const vibLevel = state.vibRMS > 7.1 ? 'danger' : state.vibRMS > 4.5 ? 'warn' : '';
  setMetric('vib', state.vibRMS.toFixed(2), 'mm/s', (state.vibRMS/10)*100, vibLevel);
  if (state.vibRMS > 7.1 && !lastAlertVib) { addEvent('alert', `High vibration detected: ${state.vibRMS.toFixed(2)} mm/s — exceeds limit`); lastAlertVib = true; }
  else if (state.vibRMS <= 7.1) lastAlertVib = false;

  // Frequency
  state.freq = state.running ? +(49.5 + (Math.random()-0.5)*1.5).toFixed(1) : 0;
  setMetric('freq', state.freq, 'Hz', (state.freq/200)*100, '');

  // Temperature
  const tempDrift = (Math.random()-0.4)*0.3;
  state.temp = Math.max(20, Math.min(100, +(state.temp + tempDrift).toFixed(1)));
  const tempLevel = state.temp > 80 ? 'danger' : state.temp > 65 ? 'warn' : '';
  setMetric('temp', state.temp, '°C', ((state.temp-20)/80)*100, tempLevel);
  if (state.temp > 80 && !lastWarnTemp) { addEvent('warn', `Temperature elevated: ${state.temp}°C — check cooling`); lastWarnTemp = true; }
  else if (state.temp <= 80) lastWarnTemp = false;

  // Current
  const baseCur = state.running ? 12 + Math.sin(state.totalTick/15)*0.5 : 0;
  state.current = Math.max(0, +(baseCur + (Math.random()-0.5)*0.4).toFixed(1));
  const curLevel = state.current > 18 ? 'danger' : state.current > 15 ? 'warn' : '';
  setMetric('cur', state.current, 'A', (state.current/20)*100, curLevel);

  // Avg temp stat
  state.tempHistory.push(state.temp);
  if (state.tempHistory.length > 60) state.tempHistory.shift();
  const avgT = (state.tempHistory.reduce((a,b)=>a+b,0)/state.tempHistory.length).toFixed(1);
  document.getElementById('statAvgTemp').textContent = avgT;

  // Waveform
  const amp = state.running ? state.vibRMS*1.2 : 0.2;
  const newPoint = +(amp*(Math.random()*2-1)).toFixed(3);
  waveData.push(newPoint);
  waveData.shift();
  waveChart.data.datasets[0].data = [...waveData];
  waveChart.update('none');

  // Every 60 ticks (~1 min) update historical
  if (state.totalTick % 60 === 0) {
    vhRMS.push(state.vibRMS);  vhRMS.shift();
    vhPeak.push(+(state.vibRMS*(1.2+Math.random()*0.5)).toFixed(2));  vhPeak.shift();
    vibHistChart.data.datasets[0].data = [...vhPeak];
    vibHistChart.data.datasets[1].data = [...vhRMS];
    vibHistChart.update();

    statusData.push(state.running ? 1 : 0);  statusData.shift();
    statusHistChart.data.datasets[0].data = [...statusData];
    statusHistChart.data.datasets[0].backgroundColor = statusData.map(v => v ? 'rgba(0,200,150,0.7)' : 'rgba(224,80,80,0.7)');
    statusHistChart.update();
  }
}

// Initialize
updateStatus(true);
setInterval(tick, 200);
tick();
