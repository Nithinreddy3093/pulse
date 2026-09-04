# Pulse — Smart Market Watchlist

> **"What meaningfully changed in my watchlist since I last checked, and what deserves my attention now?"**

Built for the Groww **"Code, by Groww"** 72-Hour Engineering Hackathon.

---

## 1. The Core Innovation: "Since You Last Checked"

Traditional watchlists are passive and noisy:
- They show raw prices and percentage changes (e.g., `+3.2%`), treating low-volatility utility stocks and high-beta tech equities identically.
- They have no memory of when you last visited, forcing you to mentally reconstruct what shifted.

**Pulse** transforms the watchlist into an active, personalized intelligence feed:
1. **Personalized Baseline**: Tracks your personal `lastSeenPrice`, `lastSeenVolume`, and `lastSeenTimestamp` securely in Firestore.
2. **Deterministic Change Engine**: Scores changes (0–100) using a multi-factor mathematical model grounded in historical volatility, volume anomalies, news velocity, corporate events, and market benchmark divergence.
3. **Evidence-Grounded AI Explanations**: Uses Google Gemini 2.5 Flash strictly to synthesize structured mathematical signals and verifiable facts into concise explanations. AI is forbidden from fabricating facts.
4. **"You're All Caught Up"**: When no anomalous shifts have occurred, Pulse intentionally avoids notification spam and confirms you are all caught up while presenting standard baseline tracking.
5. **Interactive Hackathon Demo Mode**: Built-in 1-click scenario simulation bar (`NVDA Surge`, `TSLA Dip`, `Quiet Market`, `Stale Feed`) allowing hackathon judges to verify the real-time scoring engine without waiting for live market events.

---

## 2. Deterministic Scoring Model

Every equity change score (0–100) is deterministically computed by the backend engine:

| Signal | Weight | Description |
| :--- | :---: | :--- |
| **Price Abnormality** | **25%** | Delta from personal last-seen baseline scaled by stock's normal daily range |
| **Volume Anomaly** | **20%** | Trading volume multiplier relative to 30-day average volume |
| **Historical Deviation** | **20%** | Statistical Z-score distance from 30-day mean price |
| **News Activity** | **15%** | Article frequency, velocity, and relevance score thresholding |
| **Company Events** | **15%** | High-impact corporate filings, earnings announcements, guidance shifts |
| **Market Context** | **5%** | Divergence from broader benchmark indices (S&P 500 / Nifty 50) |

### Score Classifications
- **0 – 30**: `Normal` (Within standard historical baseline)
- **31 – 55**: `Worth Watching` (Early signal emergence)
- **56 – 75**: `Important` (Substantial deviation requiring attention)
- **76 – 100**: `Major Change` (Critical divergence with volume or event confirmation)

---

## 3. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   React + Vite UI                      │
│   Dashboard • "Why?" AI Evidence Modal • Demo Bar      │
│   Interactive Recharts • Score Breakdown Bars          │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON
┌──────────────────────────▼─────────────────────────────┐
│                 Express Backend Service                │
│  /api/watchlist/changes    /api/stocks/:ticker/explain │
│  /api/watchlist/mark-seen  /api/demo/simulate          │
└──────────┬───────────────────────┬─────────────────────┘
           │                       │
┌──────────▼─────────────┐ ┌───────▼─────────────────────┐
│ Deterministic Engine   │ │ Google Gemini 2.5 Flash     │
│ 6 Weighted Signals     │ │ Evidence synthesis only     │
└──────────┬─────────────┘ └─────────────────────────────┘
           │
┌──────────▼─────────────┐
│ Firebase Auth & Cloud  │
│ User State Isolation   │
└────────────────────────┘
```

---

## 4. Hackathon Evaluation Guide

1. **Instant Access**:
   - Click **"1-Click Hackathon Evaluator Login"** on the landing page or auth modal.
   - Automatically provisions a clean test session.
2. **Test Scenarios**:
   - **NVDA Surge (+8.4%)**: Simulates abnormal price velocity (3.8x normal), 2.7x volume surge, and Q3 earnings beat -> triggers `Major Change` (Score ~79/100).
   - **TSLA Dip (-5.2%)**: Simulates regulatory investigation news -> triggers `Important` (Score ~62/100).
   - **Quiet Market**: Normalizes all prices -> triggers the **"You're all caught up"** empty state.
   - **Stale Feed Test**: Demonstrates automated data freshness tracking and discrepancy warnings.
3. **Verify AI Grounding**:
   - Click the **"Why?"** button on any stock card.
   - Observe the score breakdown bars matching the exact deterministic weights.
   - Read the Gemini explanation, which references the exact percentage move, volume multiple, and earnings/news facts provided by the engine.
4. **Mark as Seen**:
   - Click **"Mark All as Seen"**.
   - Your personal baseline updates to current prices; the dashboard immediately transitions to **"You're all caught up"**.

---

## 5. Verification & Testing

Run unit tests:
```bash
npm test
```

Build production bundle:
```bash
npm run build
```
