function updateDate() {
  const now = new Date();

  const days = [
    "Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"
  ];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayName = days[now.getDay()];
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();

  const formatted = `${dayName}, ${day} ${month} ${year}`;

  document.getElementById("date").textContent = formatted;
}

updateDate();

const SHEET_URL =
  "https://docs.google.com/spreadsheets/d/1EXY9uL0_pyWCFyNQxFrFWjkZ5V9qQGuLOq1vusJTKZA/export?format=csv&gid=0";

// ======================
// DATA STORAGE
// ======================
let tempData = [];
let humiData = [];
let vibData = [];
let labels = [];

// ======================
// CHART OBJECTS
// ======================
let tempChart, humiChart, vibChart;

// ======================
// FETCH GOOGLE SHEET
// ======================
async function fetchSheetData() {
  try {
    const res = await fetch(SHEET_URL);
    const text = await res.text();

    const rows = text.trim().split("\n").map(r => r.split(","));
    rows.shift(); // remove header

    // reset arrays
    tempData = [];
    humiData = [];
    vibData = [];
    labels = [];

    rows.forEach((row, i) => {
      tempData.push(parseFloat(row[1]));
      humiData.push(parseFloat(row[2]));
      vibData.push(parseFloat(row[6]));
      //labels.push(i + 1);
      const timeOnly = row[0].split(" ")[1] || row[0];
      labels.push(timeOnly);
    });

    // latest row
    const latest = rows[rows.length - 1];

    updateUI({
      timestamp: latest[0],
      temp: parseFloat(latest[1]),
      humi: parseFloat(latest[2]),
      vib: parseFloat(latest[6]),
      status: latest[7],
      uptime: latest[8]
    });

    updateCharts();
  } catch (err) {
    console.error("Sheet fetch error:", err);
  }
}

// ======================
// UPDATE UI
// ======================
function updateUI(d) {
  // Temperature
  document.getElementById("tempVal").innerText = d.temp;
  document.getElementById("tempBar").style.width = Math.min(d.temp, 100) + "%";

  // Threshold color logic
  const tempCard = document.getElementById("cardTemp");
  const tempValue = document.getElementById("tempVal");

  if (d.temp >= 75) {

    // RED
    tempCard.className = "metric-card danger";
    tempValue.className = "metric-value danger";
    document.getElementById("tempBar").style.background = "var(--danger)";

  }
  else if (d.temp >= 45) {

    // ORANGE
    tempCard.className = "metric-card warn";
    tempValue.className = "metric-value warn";
    document.getElementById("tempBar").style.background = "var(--warn)";

  }
  else {

    // GREEN
    tempCard.className = "metric-card ok";
    tempValue.className = "metric-value";
    document.getElementById("tempBar").style.background = "var(--accent)";

  }

  // Humidity
  document.getElementById("humiVal").innerText = d.humi;
  document.getElementById("humiBar").style.width = d.humi + "%";

  // Threshold color logic
  const humiCard = document.getElementById("cardHumi");
  const humiValue = document.getElementById("humiVal");

  if (d.humi >= 85) {

    // RED
    humiCard.className = "metric-card danger";
    humiValue.className = "metric-value danger";
    document.getElementById("humiBar").style.background = "var(--danger)";

  }
  else if (d.humi >= 70) {

    // ORANGE
    humiCard.className = "metric-card warn";
    humiValue.className = "metric-value warn";
    document.getElementById("humiBar").style.background = "var(--warn)";

  }
  else {

    // GREEN
    humiCard.className = "metric-card ok";
    humiValue.className = "metric-value";
    document.getElementById("humiBar").style.background = "var(--accent)";

  }

  // Vibration
  document.getElementById("vibVal").innerText = d.vib;
  //document.getElementById("vibBar").style.width = Math.min(d.vib * 10, 100) + "%";

  // Scale vibration bar to 0-20 mm/s range
  const vibPercent = (d.vib / 20) * 100;

  document.getElementById("vibBar").style.width = 
    Math.min(vibPercent, 100) + "%";

  // Threshold color logic
  const vibCard = document.getElementById("cardVib");
  const vibValue = document.getElementById("vibVal");

  if (d.vib >= 15) {

    // RED
    vibCard.className = "metric-card danger";
    vibValue.className = "metric-value danger";
    document.getElementById("vibBar").style.background = "var(--danger)";

  }
  else if (d.vib >= 10) {

    // ORANGE
    vibCard.className = "metric-card warn";
    vibValue.className = "metric-value warn";
    document.getElementById("vibBar").style.background = "var(--warn)";

  }
  else {

    // GREEN
    vibCard.className = "metric-card ok";
    vibValue.className = "metric-value";
    document.getElementById("vibBar").style.background = "var(--accent)";

  }

  // ======================
  // STATUS LOGIC
  // ======================
  const status = (d.status || "").toLowerCase();

  const statusBadge = document.getElementById("statusBadge");
  const statusLarge = document.getElementById("statusLarge");
  const rotor = document.getElementById("rotorEl");

  // ======================================
  // NORMAL = RUNNING + SPINNING
  // ======================================
  if (status === "normal") {

    // Top badge
    statusBadge.className = "status-badge running";
    document.getElementById("statusText").innerText = "Running";

    // Rotor spin
    rotor.classList.add("spinning");

    // Real-time motor status card
    statusLarge.className = "status-large running";
    statusLarge.innerText = "NORMAL";

    document.getElementById("cardStatus").className =
    "metric-card status-card ok";
  } 

  // ======================================
  // ABNORMAL = STOPPED + NO SPIN
  // ======================================
  else if (status === "abnormal") {

    // Top badge
    statusBadge.className = "status-badge stopped";
    document.getElementById("statusText").innerText = "Stopped";

    // Stop rotor
    rotor.classList.remove("spinning");

    // Real-time motor status card
    statusLarge.className = "status-large stopped";
    statusLarge.innerText = "ABNORMAL";

    document.getElementById("cardStatus").className =
    "metric-card status-card danger";
  } 

  // ======================================
  // UNKNOWN
  // ======================================
  else {

    statusBadge.className = "status-badge stopped";
    document.getElementById("statusText").innerText = "Unknown";

    rotor.classList.remove("spinning");

    statusLarge.className = "status-large stopped";
    statusLarge.innerText = "UNKNOWN";

  }

  // Uptime
  document.getElementById("uptimeTxt").innerText = "Uptime: " + d.uptime;
  document.getElementById("uptimeTxt2").innerText = "Uptime: " + d.uptime;

  // Clock Current Time
  document.getElementById("clock").innerText =
    new Date().toLocaleTimeString();

  // Last Updated from Google Sheet Timestamp column
  document.getElementById("lastUpdated").innerText =
    "Last updated: " + d.timestamp;
}

function createChart(canvasId, label, color) {
  return new Chart(document.getElementById(canvasId), {
    type: "line",

    data: {
      labels: [],
      datasets: [{
        label: label,
        data: [],
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 5,
        hitRadius: 30
      }]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          callbacks: {
            title: function(context) {
              return "Time: " + context[0].label;
            }
          }
        }
      },

      scales: {
        x: {
          ticks: {
            color: "#7a8494",
            maxTicksLimit: 8
          },
          grid: {
            color: "rgba(255,255,255,0.03)"
          }
        },

        y: {
          ticks: {
            color: "#7a8494"
          },
          grid: {
            color: "rgba(255,255,255,0.05)"
          }
        }
      }
    }
  });
}

function initCharts() {

  tempChart = createChart(
    "tempHistChart",
    "Temperature",
    "#ffb38a"
  );

  humiChart = createChart(
    "humiHistChart",
    "Humidity",
    "#4d9fff"
  );

  vibChart = createChart(
    "vibHistChart",
    "Vibration",
    "#a78bfa"
  );
}

// ======================
// UPDATE CHART DATA
// ======================
function updateCharts() {
  tempChart.data.labels = labels;
  tempChart.data.datasets[0].data = tempData;
  tempChart.update();

  humiChart.data.labels = labels;
  humiChart.data.datasets[0].data = humiData;
  humiChart.update();

  vibChart.data.labels = labels;
  vibChart.data.datasets[0].data = vibData;
  vibChart.update();
}

// ======================
// START APP
// ======================
initCharts();
fetchSheetData();
setInterval(fetchSheetData, 2000);
