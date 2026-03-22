# CryptoPrecision 🚀

A fully interactive crypto trading web app built with vanilla HTML, CSS, and JavaScript. Features live market data, a trade simulator with real logic, portfolio tracking, and a responsive dark UI — no frameworks, no build tools.

---

## ✨ Features

### 📡 Live Market Data
- Real-time prices pulled from the **CoinGecko free API** for 8 major assets (BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX)
- Scrolling **ticker tape** at the top with live price and 24h change
- Auto-refreshes every 30 seconds, with simulated micro price movements every 3 seconds between API calls
- Graceful fallback to simulated data if the API is rate-limited

### 📊 Markets Table
- Filterable by category (All / DeFi / Layer 1 / Stablecoins)
- Shows rank, price, 24h change (color-coded), market cap, and a 7-day **sparkline**
- Click **Trade** on any row to load that asset directly into the trade panel

### 💹 Trade Simulator
- Start with **$10,000 in virtual funds**
- Place **Market** or **Limit** orders
- Set **leverage** from 1x up to 20x with a live risk indicator
- Use **preset buttons** (25% / 50% / 75% / 100% of balance)
- Live trade summary: estimated quantity, total exposure, fee (0.1%), and market price
- **Buy / Long** and **Sell / Short** both supported
- Open positions show **live P&L** as prices update
- Close any position at any time to lock in gains or losses

### 📖 Order Book
- Simulated bid/ask depth with volume bars
- Live spread calculation
- Refreshes every 2 seconds

### 📈 Portfolio Tracker
- **Donut chart** showing asset allocation (open positions vs cash)
- **P&L line chart** tracking your balance over closed trades
- 6 stat cards: Total P&L, Win Rate, Trades Placed, Avg Trade, Best Trade, Worst Trade

### 💾 Persistent State
- Your balance, open positions, and full trade history are saved to **localStorage**
- Everything survives page refreshes

---

## 📁 Project Structure

```
portfolio-v1/
├── index.html              # Main HTML — all sections and markup
├── app.js                  # All JS logic (prices, chart, trade engine, portfolio)
├── intersectionObserver.js # Scroll reveal utility (unchanged)
├── css/
│   ├── general.css         # Global resets
│   ├── styles.css          # All component styles
│   └── queries.css         # Responsive breakpoints
└── assets/
    ├── images/             # Hero, icons, brand logos
    └── icons/              # Favicon
```

---

## 🚀 Getting Started

No build step needed. Just open the project in a browser:

```bash
# Clone the repo
git clone https://github.com/hossam43/portfolio-v1.git
cd portfolio-v1

# Open directly in browser
open index.html

# Or use a local dev server (recommended for module imports)
npx serve .
# or
python3 -m http.server 8080
```

> **Note:** The app uses ES modules (`type="module"` in the script tag), so you need to serve it over HTTP — opening `index.html` directly via `file://` may block module imports in some browsers.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styling | CSS3 (custom properties, grid, flexbox, animations) |
| Logic | Vanilla JavaScript (ES6+ modules) |
| Charts | [Chart.js 4.4](https://www.chartjs.org/) via CDN |
| Icons | [Ionicons 7](https://ionic.io/ionicons) via CDN |
| Fonts | [Syne](https://fonts.google.com/specimen/Syne) + [Space Mono](https://fonts.google.com/specimen/Space+Mono) via Google Fonts |
| Prices | [CoinGecko Free API](https://www.coingecko.com/en/api) |
| Storage | Browser localStorage |

---

## 🔒 Safe to Modify

The codebase is structured so changes stay isolated:

- **Adding a new section?** Add HTML in `index.html`, styles in `styles.css`, responsive overrides in `queries.css`
- **Changing colors/fonts?** Edit CSS variables at the top of `styles.css`
- **Modifying trade logic?** All trading logic is in `app.js` under clearly labeled sections
- **Touching `intersectionObserver.js`?** Only do this if you need to change the scroll-reveal behavior — nothing else depends on its internals

---

## 📱 Responsive Breakpoints

| Breakpoint | Width | Behavior |
|---|---|---|
| Large desktop | > 1200px | Full layout |
| Landscape tablet | ≤ 1200px | Font scaling, trade grid stacks |
| Tablet | ≤ 995px | Mobile nav enabled |
| Small tablet | ≤ 860px | Simplified positions panel |
| Large mobile | ≤ 702px | Single column everything |
| Mobile | ≤ 520px | Compact spacing and typography |

---

## 🔮 Possible Next Steps

- [ ] Add WebSocket connection for truly real-time prices (Binance WS API)
- [ ] Add stop-loss / take-profit fields to the trade form
- [ ] Export trade history as CSV
- [ ] Add more chart types (candlestick with OHLC data)
- [ ] Add a news feed section using a crypto news API
- [ ] Dark/light mode toggle

---

## 👤 Author

**Hossam Ayman**  
Built as a frontend portfolio project showcasing real JavaScript logic, API integration, and interactive UI design.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
