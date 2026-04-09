import React, { useState } from 'react';
import { portfolioApi } from '../services/api';

function AddStockForm({ onAdded }) {
  const [ticker, setTicker] = useState('');
  const [quantity, setQuantity] = useState('');
  const [avgBuyPrice, setAvgBuyPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate ticker first
      await portfolioApi.validateTicker(ticker.toUpperCase());
      await portfolioApi.addPosition({
        ticker: ticker.toUpperCase(),
        quantity: parseFloat(quantity),
        avgBuyPrice: parseFloat(avgBuyPrice),
      });
      setTicker('');
      setQuantity('');
      setAvgBuyPrice('');
      setOpen(false);
      onAdded();
    } catch (err) {
      const msg = err.response?.data?.error || err.message;
      setError(msg.includes('Failed to fetch') ? `"${ticker.toUpperCase()}" is not a valid ticker symbol.` : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          <span className="text-lg leading-none">+</span>
          Add Position
        </button>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-semibold text-lg">Add Position</h3>
            <button
              onClick={() => { setOpen(false); setError(null); }}
              className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                  Ticker Symbol
                </label>
                <input
                  type="text"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  placeholder="e.g. AAPL"
                  required
                  className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                  Quantity (shares)
                </label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 10"
                  min="0.0001"
                  step="any"
                  required
                  className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                  Avg Buy Price (€)
                </label>
                <input
                  type="number"
                  value={avgBuyPrice}
                  onChange={(e) => setAvgBuyPrice(e.target.value)}
                  placeholder="e.g. 150.00"
                  min="0.0001"
                  step="any"
                  required
                  className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl px-4 py-3 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null); }}
                className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Validating...
                  </>
                ) : (
                  'Add to Portfolio'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default AddStockForm;
