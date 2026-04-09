import React, { useEffect, useState, useCallback } from 'react';
import { portfolioApi } from './services/api';
import SummaryCard from './components/SummaryCard';
import AddStockForm from './components/AddStockForm';
import PortfolioTable from './components/PortfolioTable';
import PortfolioChart from './components/PortfolioChart';

const fmt = (n, digits = 2) =>
  n == null ? '—' : n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const REFRESH_INTERVAL = 60 * 1000; // 1 minute

function App() {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchPortfolio = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await portfolioApi.getPortfolio();
      setPortfolio(data);
      setLastUpdated(new Date());
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [fetchPortfolio]);

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => fetchPortfolio(true), REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchPortfolio]);

  const summary = portfolio?.summary;
  const positions = portfolio?.positions || [];
  const isProfit = summary?.totalGain >= 0;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 rounded-xl p-2">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">Portfolio Tracker</h1>
              <p className="text-slate-500 text-xs mt-0.5">Real-time stock portfolio</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-slate-500 text-xs hidden sm:block">
                Updated {lastUpdated.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button
              onClick={() => fetchPortfolio()}
              disabled={loading}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 border border-slate-700"
            >
              <svg
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-2xl px-5 py-4 flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !portfolio && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-2xl p-5 h-24 animate-pulse border border-slate-700" />
            ))}
          </div>
        )}

        {/* Summary cards */}
        {portfolio && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryCard
              label="Total Value"
              icon="💼"
              value={`€${fmt(summary?.totalValue)}`}
            />
            <SummaryCard
              label="Total Cost"
              icon="💳"
              value={`€${fmt(summary?.totalCost)}`}
            />
            <SummaryCard
              label="Total Gain / Loss"
              icon={isProfit ? '📈' : '📉'}
              value={`${isProfit ? '+' : ''}€${fmt(summary?.totalGain)}`}
              positive={summary?.totalGain != null ? isProfit : undefined}
            />
            <SummaryCard
              label="Return"
              icon="🎯"
              value={`${summary?.totalGainPct != null ? (isProfit ? '+' : '') + summary.totalGainPct.toFixed(2) + '%' : '—'}`}
              positive={summary?.totalGainPct != null ? isProfit : undefined}
              sub={`${positions.length} position${positions.length !== 1 ? 's' : ''}`}
            />
          </div>
        )}

        {/* Chart */}
        <PortfolioChart refreshKey={refreshKey} />

        {/* Add stock */}
        <AddStockForm onAdded={() => fetchPortfolio()} />

        {/* Positions table */}
        {portfolio && (
          <PortfolioTable
            positions={positions}
            totalValue={summary?.totalValue || 0}
            onRemoved={() => fetchPortfolio()}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-12 py-6 text-center text-slate-600 text-xs">
        Portfolio Tracker · Prices auto-refresh every minute · Data from Yahoo Finance
      </footer>
    </div>
  );
}

export default App;
