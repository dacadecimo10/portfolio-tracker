import express from 'express';
import db from '../db.js';

const router = express.Router();

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

async function fetchPrice(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
  const resp = await fetch(url, { headers: YF_HEADERS });

  if (!resp.ok) {
    throw new Error(`Yahoo Finance returned ${resp.status} for ${ticker}`);
  }

  const data = await resp.json();
  const result = data?.chart?.result?.[0];
  if (!result) {
    throw new Error(`No data found for ticker "${ticker}"`);
  }

  const meta = result.meta;
  return {
    price: meta.regularMarketPrice,
    currency: meta.currency || 'USD',
    name: meta.shortName || meta.longName || ticker,
  };
}

// GET /api/portfolio
router.get('/', async (req, res) => {
  try {
    const positions = db.prepare('SELECT * FROM positions ORDER BY created_at ASC').all();

    if (positions.length === 0) {
      return res.json({ positions: [], summary: { totalValue: 0, totalCost: 0, totalGain: 0, totalGainPct: 0 } });
    }

    const priceData = await Promise.all(
      positions.map(async (pos) => {
        try {
          const data = await fetchPrice(pos.ticker);
          return { ...pos, ...data, error: null };
        } catch (err) {
          return { ...pos, price: null, name: pos.ticker, currency: 'EUR', error: err.message };
        }
      })
    );

    let totalValue = 0;
    let totalCost = 0;

    const enriched = priceData.map((pos) => {
      const cost = pos.quantity * pos.avg_buy_price;
      const value = pos.price != null ? pos.quantity * pos.price : null;
      const gain = value != null ? value - cost : null;
      const gainPct = gain != null && cost > 0 ? (gain / cost) * 100 : null;

      if (value != null) totalValue += value;
      totalCost += cost;

      return { ...pos, cost, value, gain, gainPct };
    });

    const totalGain = totalValue - totalCost;
    const totalGainPct = totalCost > 0 ? (totalGain / totalCost) * 100 : 0;

    const today = new Date().toISOString().split('T')[0];
    db.prepare(`
      INSERT INTO portfolio_snapshots (total_value, total_cost, snapshot_date)
      VALUES (?, ?, ?)
      ON CONFLICT(snapshot_date) DO UPDATE SET total_value = excluded.total_value, total_cost = excluded.total_cost
    `).run(totalValue, totalCost, today);

    res.json({ positions: enriched, summary: { totalValue, totalCost, totalGain, totalGainPct } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/portfolio
router.post('/', (req, res) => {
  const { ticker, quantity, avgBuyPrice } = req.body;

  if (!ticker || !quantity || !avgBuyPrice) {
    return res.status(400).json({ error: 'ticker, quantity, and avgBuyPrice are required' });
  }
  if (quantity <= 0 || avgBuyPrice <= 0) {
    return res.status(400).json({ error: 'quantity and avgBuyPrice must be positive' });
  }

  try {
    db.prepare(`
      INSERT INTO positions (ticker, quantity, avg_buy_price)
      VALUES (?, ?, ?)
      ON CONFLICT(ticker) DO UPDATE SET quantity = excluded.quantity, avg_buy_price = excluded.avg_buy_price
    `).run(ticker.toUpperCase(), quantity, avgBuyPrice);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/portfolio/:ticker
router.delete('/:ticker', (req, res) => {
  const { ticker } = req.params;
  try {
    const result = db.prepare('DELETE FROM positions WHERE ticker = ?').run(ticker.toUpperCase());
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/history
router.get('/history', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT snapshot_date as date, total_value as value, total_cost as cost
      FROM portfolio_snapshots
      ORDER BY snapshot_date ASC
      LIMIT 365
    `).all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/validate/:ticker
router.get('/validate/:ticker', async (req, res) => {
  try {
    const data = await fetchPrice(req.params.ticker.toUpperCase());
    res.json({ valid: true, ...data });
  } catch (err) {
    res.status(404).json({ valid: false, error: err.message });
  }
});

export default router;
