import { ob } from "./intersectionObserver.js";

/* ============================================================
   CRYPTO PRECISION — Main App Logic
   Sections:
   1. State Management
   2. Sticky Nav & Mobile Nav
   3. Smooth Scroll
   4. Live Price Engine (CoinGecko free API)
   5. Ticker Tape
   6. Market Table
   7. Price Chart (Chart.js candlestick simulation)
   8. Order Book
   9. Trade Simulator
   10. Portfolio Tracker
   11. Counter Animation (hero stats)
   12. Intersection Observer Reveals
============================================================ */

// ─────────────────────────────────────────
// 1. STATE
// ─────────────────────────────────────────
const STATE = {
  prices: {},           // { BTC: 65000, ETH: 3500, ... }
  changes: {},          // { BTC: 2.3, ETH: -1.1, ... }
  marketCaps: {},
  selectedAsset: "BTC",
  timeframe: "1m",
  tradeSide: "buy",
  orderType: "market",
  virtualBalance: parseFloat(localStorage.getItem("cp_balance") || "10000"),
  positions: JSON.parse(localStorage.getItem("cp_positions") || "[]"),
  history: JSON.parse(localStorage.getItem("cp_history") || "[]"),
  pnlHistory: JSON.parse(localStorage.getItem("cp_pnl") || "[]"),
  chartData: [],        // simulated candles
  priceChartInstance: null,
  allocationChartInstance: null,
  pnlChartInstance: null,
};

// Symbol → CoinGecko id map
const COIN_IDS = {
  BTC: "bitcoin", ETH: "ethereum", BNB: "binancecoin",
  SOL: "solana", XRP: "ripple", ADA: "cardano",
  DOGE: "dogecoin", AVAX: "avalanche-2",
};

const COIN_CATEGORIES = {
  BTC: "layer1", ETH: "layer1", BNB: "layer1", SOL: "layer1",
  XRP: "layer1", ADA: "layer1", DOGE: "layer1", AVAX: "layer1",
};

const COLORS = {
  BTC: "#f7931a", ETH: "#627eea", BNB: "#f0b90b",
  SOL: "#9945ff", XRP: "#00aae4", ADA: "#0033ad",
  DOGE: "#c2a633", AVAX: "#e84142",
};

// ─────────────────────────────────────────
// 2. MOBILE NAV & STICKY
// ─────────────────────────────────────────
const btnNavEl = document.querySelector(".btn-mobile-nav");
const headerEl = document.querySelector(".header");
btnNavEl.addEventListener("click", () => headerEl.classList.toggle("nav-open"));

const sectionHeroEl = document.querySelector(".hero-section");
const stickyObs = new IntersectionObserver(
  ([entry]) => document.body.classList.toggle("sticky", !entry.isIntersecting),
  { root: null, threshold: 0, rootMargin: "-80px" }
);
stickyObs.observe(sectionHeroEl);

// ─────────────────────────────────────────
// 3. SMOOTH SCROLL
// ─────────────────────────────────────────
document.querySelector(".main-nav-list").addEventListener("click", (e) => {
  e.preventDefault();
  const id = e.target.getAttribute("href");
  if (e.target.classList.contains("main-nav-link") && id?.startsWith("#")) {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    headerEl.classList.remove("nav-open");
  }
});
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = document.querySelector(id);
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
  });
});

// ─────────────────────────────────────────
// 4. LIVE PRICE ENGINE
// ─────────────────────────────────────────
async function fetchPrices() {
  const ids = Object.values(COIN_IDS).join(",");
  try {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
    );
    const data = await res.json();
    Object.entries(COIN_IDS).forEach(([symbol, id]) => {
      if (data[id]) {
        STATE.prices[symbol] = data[id].usd;
        STATE.changes[symbol] = data[id].usd_24h_change || 0;
        STATE.marketCaps[symbol] = data[id].usd_market_cap || 0;
      }
    });
    updateTicker();
    updateMarketTable();
    updateChartHeader();
    updateTradeSummary();
    updatePositionsPnL();
    updatePortfolioStats();
    updateAllocationChart();
  } catch (err) {
    // Fallback: simulate small random price moves if API fails
    simulatePriceMove();
  }
}

function simulatePriceMove() {
  const basePrices = { BTC: 65000, ETH: 3400, BNB: 580, SOL: 145, XRP: 0.58, ADA: 0.44, DOGE: 0.12, AVAX: 35 };
  Object.keys(basePrices).forEach((sym) => {
    if (!STATE.prices[sym]) STATE.prices[sym] = basePrices[sym];
    const move = STATE.prices[sym] * (Math.random() * 0.002 - 0.001);
    STATE.prices[sym] = parseFloat((STATE.prices[sym] + move).toFixed(6));
    STATE.changes[sym] = STATE.changes[sym] || (Math.random() * 10 - 5);
  });
  updateTicker();
  updateMarketTable();
  updateChartHeader();
  updateTradeSummary();
}

fetchPrices();
setInterval(fetchPrices, 30000);
setInterval(simulatePriceMove, 3000); // small moves between API calls

// ─────────────────────────────────────────
// 5. TICKER TAPE
// ─────────────────────────────────────────
function updateTicker() {
  document.querySelectorAll(".ticker-item").forEach((el) => {
    const sym = el.dataset.symbol;
    const price = STATE.prices[sym];
    const change = STATE.changes[sym];
    if (!price) return;
    el.querySelector(".ticker-price").textContent = `$${formatPrice(price)}`;
    const chEl = el.querySelector(".ticker-change");
    const sign = change >= 0 ? "+" : "";
    chEl.textContent = `${sign}${change.toFixed(2)}%`;
    chEl.className = `ticker-change ${change >= 0 ? "up" : "down"}`;
  });
}

// ─────────────────────────────────────────
// 6. MARKET TABLE
// ─────────────────────────────────────────
let activeFilter = "all";
document.querySelectorAll(".market-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".market-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    activeFilter = tab.dataset.filter;
    renderMarketTable();
  });
});

function updateMarketTable() { renderMarketTable(); }

function renderMarketTable() {
  const tbody = document.getElementById("market-table-body");
  const symbols = Object.keys(COIN_IDS).filter((s) => {
    if (activeFilter === "all") return true;
    return COIN_CATEGORIES[s] === activeFilter;
  });

  tbody.innerHTML = "";
  symbols.forEach((sym, i) => {
    const price = STATE.prices[sym] || 0;
    const change = STATE.changes[sym] || 0;
    const mcap = STATE.marketCaps[sym] || 0;
    const changeClass = change >= 0 ? "up" : "down";
    const sign = change >= 0 ? "+" : "";

    const tr = document.createElement("tr");
    tr.className = "market-row";
    tr.innerHTML = `
      <td class="rank">${i + 1}</td>
      <td class="asset-cell">
        <span class="asset-dot" style="background:${COLORS[sym]}"></span>
        <span class="asset-name">${sym}</span>
      </td>
      <td class="price-cell">$${formatPrice(price)}</td>
      <td class="change-cell ${changeClass}">${sign}${change.toFixed(2)}%</td>
      <td class="mcap-cell">${formatMarketCap(mcap)}</td>
      <td class="spark-cell"><canvas class="sparkline" id="spark-${sym}" width="80" height="30"></canvas></td>
      <td><button class="trade-row-btn" data-asset="${sym}">Trade</button></td>
    `;
    tbody.appendChild(tr);
    drawSparkline(`spark-${sym}`, sym);
  });

  // Trade button from market table
  document.querySelectorAll(".trade-row-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const asset = btn.dataset.asset;
      document.getElementById("trade-asset").value = asset;
      switchAsset(asset);
      document.querySelector("#section--2").scrollIntoView({ behavior: "smooth" });
    });
  });
}

function drawSparkline(canvasId, symbol) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const basePrice = STATE.prices[symbol] || 100;
  const points = Array.from({ length: 12 }, (_, i) => {
    const noise = (Math.random() - 0.48) * basePrice * 0.02;
    return basePrice + noise * (i + 1);
  });
  const min = Math.min(...points);
  const max = Math.max(...points);
  const isUp = points[points.length - 1] >= points[0];

  ctx.clearRect(0, 0, 80, 30);
  ctx.beginPath();
  points.forEach((p, i) => {
    const x = (i / (points.length - 1)) * 80;
    const y = 28 - ((p - min) / (max - min || 1)) * 24;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.strokeStyle = isUp ? "#22c55e" : "#ef4444";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

// ─────────────────────────────────────────
// 7. PRICE CHART
// ─────────────────────────────────────────
function generateCandles(basePrice, count = 60) {
  const candles = [];
  let price = basePrice;
  const now = Date.now();
  const tfMs = { "1m": 60000, "5m": 300000, "15m": 900000, "1h": 3600000 };
  const interval = tfMs[STATE.timeframe] || 60000;

  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * price * 0.015;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * price * 0.005;
    const low = Math.min(open, close) - Math.random() * price * 0.005;
    candles.push({ t: now - i * interval, o: open, h: high, l: low, c: close });
    price = close;
  }
  return candles;
}

function initPriceChart() {
  const canvas = document.getElementById("priceChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const base = STATE.prices[STATE.selectedAsset] || 65000;
  STATE.chartData = generateCandles(base);

  const labels = STATE.chartData.map((c) => new Date(c.t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const closes = STATE.chartData.map((c) => c.c);
  const opens = STATE.chartData.map((c) => c.o);

  // Use line chart to simulate price movement (no candlestick plugin needed)
  const gradientUp = ctx.createLinearGradient(0, 0, 0, 300);
  gradientUp.addColorStop(0, "rgba(110, 100, 250, 0.3)");
  gradientUp.addColorStop(1, "rgba(110, 100, 250, 0.0)");

  if (STATE.priceChartInstance) STATE.priceChartInstance.destroy();

  STATE.priceChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: STATE.selectedAsset + "/USDT",
        data: closes,
        borderColor: "#6e64fa",
        backgroundColor: gradientUp,
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.3,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      scales: {
        x: {
          ticks: { color: "#adb5bd", maxTicksLimit: 8, font: { size: 10 } },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
        y: {
          position: "right",
          ticks: { color: "#adb5bd", font: { size: 10 }, callback: (v) => "$" + formatPrice(v) },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(17,16,29,0.95)",
          borderColor: "#6e64fa",
          borderWidth: 1,
          titleColor: "#e9ecef",
          bodyColor: "#adb5bd",
          callbacks: {
            label: (ctx) => ` $${formatPrice(ctx.raw)}`,
          },
        },
      },
    },
  });
}

// Live candle tick every 3 seconds
function tickChart() {
  if (!STATE.priceChartInstance || !STATE.chartData.length) return;
  const last = STATE.chartData[STATE.chartData.length - 1];
  const price = STATE.prices[STATE.selectedAsset] || last.c;
  const newCandle = {
    t: Date.now(),
    o: last.c, h: Math.max(last.c, price), l: Math.min(last.c, price), c: price,
  };
  STATE.chartData.push(newCandle);
  STATE.chartData.shift();
  const chart = STATE.priceChartInstance;
  chart.data.labels.push(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  chart.data.labels.shift();
  chart.data.datasets[0].data.push(price);
  chart.data.datasets[0].data.shift();
  chart.update("none");
}
setInterval(tickChart, 3000);

// Timeframe buttons
document.querySelectorAll(".chart-tf").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chart-tf").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    STATE.timeframe = btn.dataset.tf;
    initPriceChart();
  });
});

function updateChartHeader() {
  const price = STATE.prices[STATE.selectedAsset] || 0;
  const change = STATE.changes[STATE.selectedAsset] || 0;
  document.getElementById("chart-price").textContent = `$${formatPrice(price)}`;
  document.getElementById("chart-symbol").textContent = `${STATE.selectedAsset}/USDT`;
  const chEl = document.getElementById("chart-change");
  const sign = change >= 0 ? "+" : "";
  chEl.textContent = `${sign}${change.toFixed(2)}%`;
  chEl.className = `chart-change ${change >= 0 ? "up" : "down"}`;
}

// ─────────────────────────────────────────
// 8. ORDER BOOK (simulated)
// ─────────────────────────────────────────
function renderOrderBook() {
  const price = STATE.prices[STATE.selectedAsset] || 65000;
  const asksList = document.getElementById("asks-list");
  const bidsList = document.getElementById("bids-list");
  const spreadEl = document.getElementById("spread-display");
  if (!asksList) return;

  const spread = price * 0.0002;
  const asks = Array.from({ length: 6 }, (_, i) => ({
    price: price + spread / 2 + i * (price * 0.0003),
    amount: (Math.random() * 2 + 0.1).toFixed(4),
  }));
  const bids = Array.from({ length: 6 }, (_, i) => ({
    price: price - spread / 2 - i * (price * 0.0003),
    amount: (Math.random() * 2 + 0.1).toFixed(4),
  }));

  asksList.innerHTML = asks.reverse().map((a) =>
    `<div class="ob-row ask"><span>$${formatPrice(a.price)}</span><span>${a.amount}</span><div class="ob-bar" style="width:${Math.random()*80+10}%;background:rgba(239,68,68,0.12)"></div></div>`
  ).join("");

  bidsList.innerHTML = bids.map((b) =>
    `<div class="ob-row bid"><span>$${formatPrice(b.price)}</span><span>${b.amount}</span><div class="ob-bar" style="width:${Math.random()*80+10}%;background:rgba(34,197,94,0.12)"></div></div>`
  ).join("");

  spreadEl.textContent = `Spread: $${spread.toFixed(2)} (${((spread / price) * 100).toFixed(3)}%)`;
}
setInterval(renderOrderBook, 2000);

// ─────────────────────────────────────────
// 9. TRADE SIMULATOR
// ─────────────────────────────────────────
function switchAsset(symbol) {
  STATE.selectedAsset = symbol;
  updateChartHeader();
  initPriceChart();
  updateTradeSummary();
  renderOrderBook();
}

document.getElementById("trade-asset").addEventListener("change", (e) => switchAsset(e.target.value));

// Trade side tabs
document.querySelectorAll(".trade-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".trade-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    STATE.tradeSide = tab.dataset.side;
    const btn = document.getElementById("trade-submit-btn");
    btn.className = `trade-submit-btn ${STATE.tradeSide === "buy" ? "buy-btn" : "sell-btn"}`;
    btn.textContent = STATE.tradeSide === "buy" ? "Place Buy Order" : "Place Sell Order";
  });
});

// Order type
document.getElementById("order-type").addEventListener("change", (e) => {
  STATE.orderType = e.target.value;
  document.getElementById("limit-price-group").style.display =
    e.target.value === "limit" ? "block" : "none";
  updateTradeSummary();
});

// Amount presets
document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const pct = parseInt(btn.dataset.pct) / 100;
    document.getElementById("trade-amount").value = (STATE.virtualBalance * pct).toFixed(2);
    updateTradeSummary();
  });
});

// Leverage slider
const leverageSlider = document.getElementById("leverage-slider");
const leverageDisplay = document.getElementById("leverage-display");
const leverageRisk = document.getElementById("leverage-risk");
leverageSlider.addEventListener("input", () => {
  const lev = parseInt(leverageSlider.value);
  leverageDisplay.textContent = `${lev}x`;
  const risk = lev <= 3 ? "Low" : lev <= 8 ? "Medium" : lev <= 15 ? "High" : "Extreme";
  const col = lev <= 3 ? "#22c55e" : lev <= 8 ? "#f59e0b" : "#ef4444";
  leverageRisk.textContent = `Risk: ${risk}`;
  leverageRisk.style.color = col;
  updateTradeSummary();
});

document.getElementById("trade-amount").addEventListener("input", updateTradeSummary);
document.getElementById("limit-price").addEventListener("input", updateTradeSummary);

function updateTradeSummary() {
  const amount = parseFloat(document.getElementById("trade-amount").value) || 0;
  const leverage = parseInt(leverageSlider.value);
  const price = STATE.orderType === "limit"
    ? parseFloat(document.getElementById("limit-price").value) || STATE.prices[STATE.selectedAsset] || 0
    : STATE.prices[STATE.selectedAsset] || 0;
  const total = amount * leverage;
  const qty = price > 0 ? total / price : 0;
  const fee = total * 0.001;

  document.getElementById("est-qty").textContent = qty > 0 ? `${qty.toFixed(6)} ${STATE.selectedAsset}` : "--";
  document.getElementById("est-total").textContent = total > 0 ? `$${total.toFixed(2)}` : "--";
  document.getElementById("est-fee").textContent = fee > 0 ? `$${fee.toFixed(2)}` : "--";
  document.getElementById("est-price").textContent = price > 0 ? `$${formatPrice(price)}` : "--";
}

// Submit trade
document.getElementById("trade-submit-btn").addEventListener("click", placeTrade);

function placeTrade() {
  const amount = parseFloat(document.getElementById("trade-amount").value);
  if (!amount || amount <= 0) { showToast("Enter a valid amount.", "error"); return; }
  if (amount > STATE.virtualBalance) { showToast("Insufficient balance.", "error"); return; }

  const price = STATE.orderType === "limit"
    ? parseFloat(document.getElementById("limit-price").value) || STATE.prices[STATE.selectedAsset]
    : STATE.prices[STATE.selectedAsset];

  if (!price || price <= 0) { showToast("Price not available yet. Try again.", "error"); return; }

  const leverage = parseInt(leverageSlider.value);
  const total = amount * leverage;
  const qty = total / price;
  const fee = total * 0.001;
  const side = STATE.tradeSide;

  // Deduct margin (not full leveraged amount)
  STATE.virtualBalance -= (amount + fee);

  const position = {
    id: Date.now(),
    symbol: STATE.selectedAsset,
    side,
    entryPrice: price,
    qty,
    margin: amount,
    leverage,
    total,
    fee,
    openTime: new Date().toLocaleTimeString(),
    currentPnl: 0,
  };

  STATE.positions.push(position);
  saveState();
  updateBalanceDisplay();
  renderPositions();
  updateTradeSummary();
  updatePortfolioStats();
  updateAllocationChart();
  document.getElementById("trade-amount").value = "";

  showToast(
    `${side === "buy" ? "🟢 Bought" : "🔴 Shorted"} ${qty.toFixed(6)} ${STATE.selectedAsset} @ $${formatPrice(price)}`,
    "success"
  );
}

function updatePositionsPnL() {
  STATE.positions.forEach((pos) => {
    const currentPrice = STATE.prices[pos.symbol] || pos.entryPrice;
    const priceDiff = currentPrice - pos.entryPrice;
    const direction = pos.side === "buy" ? 1 : -1;
    pos.currentPnl = priceDiff * pos.qty * direction;
  });
  renderPositions();
  updatePortfolioStats();
}

function renderPositions() {
  const list = document.getElementById("positions-list");
  if (!STATE.positions.length) {
    list.innerHTML = `<p class="no-positions">No open positions. Place a trade above.</p>`;
    document.getElementById("positions-pnl-total").textContent = "";
    return;
  }

  const totalPnl = STATE.positions.reduce((sum, p) => sum + p.currentPnl, 0);
  const sign = totalPnl >= 0 ? "+" : "";
  document.getElementById("positions-pnl-total").textContent = `${sign}$${totalPnl.toFixed(2)}`;
  document.getElementById("positions-pnl-total").className = `pnl-total ${totalPnl >= 0 ? "up" : "down"}`;

  list.innerHTML = STATE.positions.map((pos) => {
    const pnlSign = pos.currentPnl >= 0 ? "+" : "";
    const pnlClass = pos.currentPnl >= 0 ? "up" : "down";
    const currentPrice = STATE.prices[pos.symbol] || pos.entryPrice;
    return `
      <div class="position-row">
        <div class="pos-info">
          <span class="pos-symbol">${pos.symbol}</span>
          <span class="pos-side ${pos.side}">${pos.side.toUpperCase()} ${pos.leverage}x</span>
        </div>
        <div class="pos-prices">
          <span class="pos-entry">Entry: $${formatPrice(pos.entryPrice)}</span>
          <span class="pos-current">Now: $${formatPrice(currentPrice)}</span>
        </div>
        <div class="pos-pnl ${pnlClass}">${pnlSign}$${pos.currentPnl.toFixed(2)}</div>
        <button class="close-pos-btn" data-id="${pos.id}">Close</button>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".close-pos-btn").forEach((btn) => {
    btn.addEventListener("click", () => closePosition(parseInt(btn.dataset.id)));
  });
}

function closePosition(id) {
  const idx = STATE.positions.findIndex((p) => p.id === id);
  if (idx === -1) return;
  const pos = STATE.positions[idx];
  const currentPrice = STATE.prices[pos.symbol] || pos.entryPrice;
  const priceDiff = currentPrice - pos.entryPrice;
  const direction = pos.side === "buy" ? 1 : -1;
  const pnl = priceDiff * pos.qty * direction;
  const closeTime = new Date().toLocaleTimeString();

  // Return margin + pnl
  STATE.virtualBalance += pos.margin + pnl;
  STATE.positions.splice(idx, 1);

  // Add to history
  STATE.history.unshift({
    symbol: pos.symbol,
    side: pos.side,
    entryPrice: pos.entryPrice,
    closePrice: currentPrice,
    qty: pos.qty,
    pnl,
    time: closeTime,
  });

  // Track pnl over time
  STATE.pnlHistory.push({ time: closeTime, balance: STATE.virtualBalance });

  saveState();
  updateBalanceDisplay();
  renderPositions();
  renderHistory();
  updatePortfolioStats();
  updatePnlChart();
  updateAllocationChart();

  const sign = pnl >= 0 ? "+" : "";
  showToast(`Position closed: ${sign}$${pnl.toFixed(2)} P&L`, pnl >= 0 ? "success" : "error");
}

function renderHistory() {
  const list = document.getElementById("history-list");
  if (!STATE.history.length) {
    list.innerHTML = `<p class="no-positions">No trades yet.</p>`;
    return;
  }
  list.innerHTML = STATE.history.slice(0, 10).map((h) => {
    const pnlSign = h.pnl >= 0 ? "+" : "";
    const pnlClass = h.pnl >= 0 ? "up" : "down";
    return `
      <div class="history-row">
        <span class="pos-symbol">${h.symbol}</span>
        <span class="pos-side ${h.side}">${h.side.toUpperCase()}</span>
        <span class="his-price">$${formatPrice(h.closePrice)}</span>
        <span class="pos-pnl ${pnlClass}">${pnlSign}$${h.pnl.toFixed(2)}</span>
        <span class="his-time">${h.time}</span>
      </div>
    `;
  }).join("");
}

function updateBalanceDisplay() {
  document.getElementById("virtual-balance").textContent = `$${STATE.virtualBalance.toFixed(2)}`;
}

// ─────────────────────────────────────────
// 10. PORTFOLIO TRACKER
// ─────────────────────────────────────────
function updatePortfolioStats() {
  const totalPnl = STATE.history.reduce((s, h) => s + h.pnl, 0) +
    STATE.positions.reduce((s, p) => s + p.currentPnl, 0);
  const wins = STATE.history.filter((h) => h.pnl > 0).length;
  const losses = STATE.history.filter((h) => h.pnl <= 0).length;
  const winRate = STATE.history.length ? ((wins / STATE.history.length) * 100).toFixed(1) : 0;
  const avgTrade = STATE.history.length ? (totalPnl / STATE.history.length).toFixed(2) : 0;
  const best = STATE.history.length ? Math.max(...STATE.history.map((h) => h.pnl)) : 0;
  const worst = STATE.history.length ? Math.min(...STATE.history.map((h) => h.pnl)) : 0;

  const sign = totalPnl >= 0 ? "+" : "";
  const pnlEl = document.getElementById("port-total-pnl");
  pnlEl.textContent = `${sign}$${totalPnl.toFixed(2)}`;
  pnlEl.className = `stat-value ${totalPnl >= 0 ? "green" : "red"}`;

  document.getElementById("port-win-rate").textContent = `${winRate}%`;
  document.getElementById("port-trades").textContent = STATE.history.length;
  document.getElementById("port-avg").textContent = `$${avgTrade}`;
  document.getElementById("port-best").textContent = `+$${best.toFixed(2)}`;
  document.getElementById("port-worst").textContent = `$${worst.toFixed(2)}`;
}

function updateAllocationChart() {
  const canvas = document.getElementById("allocationChart");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Count open position exposure per symbol
  const exposure = {};
  STATE.positions.forEach((p) => {
    exposure[p.symbol] = (exposure[p.symbol] || 0) + p.total;
  });

  // Add cash
  exposure["USDT (Cash)"] = STATE.virtualBalance;

  const labels = Object.keys(exposure);
  const values = Object.values(exposure);
  const colors = labels.map((l) => COLORS[l] || "#6e64fa");

  if (STATE.allocationChartInstance) STATE.allocationChartInstance.destroy();

  STATE.allocationChartInstance = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: "#11101d",
        borderWidth: 3,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(17,16,29,0.95)",
          borderColor: "#6e64fa",
          borderWidth: 1,
          callbacks: {
            label: (c) => ` $${c.raw.toFixed(2)} (${((c.raw / values.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`,
          },
        },
      },
    },
  });

  // Legend
  const legend = document.getElementById("allocation-legend");
  legend.innerHTML = labels.map((l, i) => `
    <div class="legend-item">
      <span class="legend-dot" style="background:${colors[i]}"></span>
      <span>${l}</span>
    </div>
  `).join("");
}

function updatePnlChart() {
  const canvas = document.getElementById("pnlChart");
  if (!canvas || !STATE.pnlHistory.length) return;
  const ctx = canvas.getContext("2d");

  const labels = STATE.pnlHistory.map((p) => p.time);
  const values = STATE.pnlHistory.map((p) => p.balance);

  if (STATE.pnlChartInstance) STATE.pnlChartInstance.destroy();

  const grad = ctx.createLinearGradient(0, 0, 0, 260);
  grad.addColorStop(0, "rgba(110, 100, 250, 0.3)");
  grad.addColorStop(1, "rgba(110, 100, 250, 0.0)");

  STATE.pnlChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data: values,
        borderColor: "#6e64fa",
        backgroundColor: grad,
        borderWidth: 2,
        pointRadius: 3,
        pointBackgroundColor: "#6e64fa",
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: false,
      scales: {
        x: { ticks: { color: "#adb5bd", font: { size: 10 } }, grid: { color: "rgba(255,255,255,0.05)" } },
        y: {
          ticks: { color: "#adb5bd", font: { size: 10 }, callback: (v) => `$${v.toFixed(0)}` },
          grid: { color: "rgba(255,255,255,0.05)" },
        },
      },
      plugins: { legend: { display: false } },
    },
  });
}

// ─────────────────────────────────────────
// 11. HERO COUNTER ANIMATION
// ─────────────────────────────────────────
function animateCounter(id, target, prefix = "") {
  const el = document.querySelector(`#${id} span`);
  if (!el) return;
  let current = 0;
  const step = target / 80;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { el.textContent = formatLargeNum(target); clearInterval(timer); return; }
    el.textContent = formatLargeNum(Math.floor(current));
  }, 20);
}

const heroObs = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    animateCounter("stat-volume", 986606);
    animateCounter("stat-tvl", 4169286);
    animateCounter("stat-borrowed", 775251);
    animateCounter("stat-markets", 543);
    heroObs.disconnect();
  }
}, { threshold: 0.3 });

const heroEl = document.querySelector(".scoial-prove-box");
if (heroEl) heroObs.observe(heroEl);

// ─────────────────────────────────────────
// 12. INTERSECTION OBSERVER REVEALS
// ─────────────────────────────────────────
const allSection = document.querySelectorAll(".section-reveal");
const optionList = { root: null, threshold: 0.1 };
ob(allSection, "element--hidden", optionList);

// ─────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────
function saveState() {
  localStorage.setItem("cp_balance", STATE.virtualBalance.toString());
  localStorage.setItem("cp_positions", JSON.stringify(STATE.positions));
  localStorage.setItem("cp_history", JSON.stringify(STATE.history));
  localStorage.setItem("cp_pnl", JSON.stringify(STATE.pnlHistory));
}

function formatPrice(price) {
  if (!price) return "0.00";
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatMarketCap(n) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
}

function formatLargeNum(n) {
  return n.toLocaleString("en-US");
}

function showToast(msg, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast ${type} show`;
  setTimeout(() => toast.classList.remove("show"), 3500);
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────
window.addEventListener("DOMContentLoaded", () => {
  updateBalanceDisplay();
  renderPositions();
  renderHistory();
  updatePortfolioStats();
  initPriceChart();
  renderOrderBook();
  updateAllocationChart();
  updatePnlChart();
});
