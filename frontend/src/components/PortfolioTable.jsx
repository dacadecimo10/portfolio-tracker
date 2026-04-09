import React, { useState } from 'react';
import { portfolioApi } from '../services/api';

const fmt = (n, digits = 2) =>
  n == null ? '—' : n.toLocaleString('de-DE', { minimumFractionDigits: digits, maximumFractionDigits: digits });

const fmtCurrency = (n) =>
  n == null ? '—' : '€' + fmt(n);

function GainBadge({ value, pct }) {
  if (value == null) return <span className="text-slate-500">—</span>;
  const positive = value >= 0;
  const cls = positive ? 'text-emerald-400' : 'text-red-400';
  const arrow = positive ? '▲' : '▼';
  return (
    <div className={`flex flex-col ${cls}`}>
      <span className="font-medium">
        {positive ? '+' : ''}€{fmt(value)}
      </span>
      {pct != null && (
        <span className="text-xs opacity-75">
          {arrow} {Math.abs(pct).toFixed(2)}%
        </span>
      )}
    </div>
  );
}

function PortfolioTable({ positions, totalValue, onRemoved }) {
  const [removing, setRemoving] = useState(null);

  const handleRemove = async (ticker) => {
    if (!window.confirm(`Remove ${ticker} from your portfolio?`)) return;
    setRemoving(ticker);
    try {
      await portfolioApi.removePosition(ticker);
      onRemoved();
    } catch (err) {
      alert('Failed to remove position: ' + (err.response?.data?.error || err.message));
    } finally {
      setRemoving(null);
    }
  };

  if (positions.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-10 text-center text-slate-400">
        <div className="text-4xl mb-3">📊</div>
        <div className="text-lg font-medium text-slate-300 mb-1">No positions yet</div>
        <div className="text-sm">Add your first stock to start tracking your portfolio.</div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700">
        <h2 className="text-white font-semibold text-lg">Positions</h2>
      </div>

      {/* Mobile cards */}
      <div className="divide-y divide-slate-700 sm:hidden">
        {positions.map((pos) => {
          const weight = totalValue > 0 && pos.value != null ? (pos.value / totalValue) * 100 : 0;
          return (
            <div key={pos.ticker} className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white font-mono">{pos.ticker}</div>
                  <div className="text-slate-400 text-xs truncate max-w-[180px]">{pos.name}</div>
                </div>
                <button
                  onClick={() => handleRemove(pos.ticker)}
                  disabled={removing === pos.ticker}
                  className="text-slate-500 hover:text-red-400 transition-colors text-sm px-2 py-1 rounded-lg hover:bg-red-900/20"
                >
                  {removing === pos.ticker ? '...' : 'Remove'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-slate-400 text-xs">Current Price</div>
                  <div className="text-white font-medium">{fmtCurrency(pos.price)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Market Value</div>
                  <div className="text-white font-medium">{fmtCurrency(pos.value)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Shares</div>
                  <div className="text-white">{fmt(pos.quantity, 4)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Avg Buy</div>
                  <div className="text-white">{fmtCurrency(pos.avg_buy_price)}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Gain / Loss</div>
                  <GainBadge value={pos.gain} pct={pos.gainPct} />
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Weight</div>
                  <div className="text-white">{weight.toFixed(1)}%</div>
                </div>
              </div>
              {/* Weight bar */}
              <div className="w-full bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-indigo-500 h-1.5 rounded-full transition-all"
                  style={{ width: `${Math.min(weight, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-slate-400 text-xs uppercase tracking-wider border-b border-slate-700">
              <th className="text-left px-6 py-3">Stock</th>
              <th className="text-right px-4 py-3">Shares</th>
              <th className="text-right px-4 py-3">Avg Buy</th>
              <th className="text-right px-4 py-3">Current Price</th>
              <th className="text-right px-4 py-3">Market Value</th>
              <th className="text-right px-4 py-3">Gain / Loss</th>
              <th className="text-right px-6 py-3">Weight</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {positions.map((pos) => {
              const weight = totalValue > 0 && pos.value != null ? (pos.value / totalValue) * 100 : 0;
              return (
                <tr key={pos.ticker} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-white font-mono text-sm">{pos.ticker}</div>
                    <div className="text-slate-400 text-xs max-w-[180px] truncate">{pos.name}</div>
                  </td>
                  <td className="px-4 py-4 text-right text-sm text-slate-300">{fmt(pos.quantity, 4)}</td>
                  <td className="px-4 py-4 text-right text-sm text-slate-300">{fmtCurrency(pos.avg_buy_price)}</td>
                  <td className="px-4 py-4 text-right text-sm text-white font-medium">{fmtCurrency(pos.price)}</td>
                  <td className="px-4 py-4 text-right text-sm text-white font-medium">{fmtCurrency(pos.value)}</td>
                  <td className="px-4 py-4 text-right">
                    <GainBadge value={pos.gain} pct={pos.gainPct} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm text-slate-300">{weight.toFixed(1)}%</span>
                      <div className="w-16 bg-slate-700 rounded-full h-1">
                        <div
                          className="bg-indigo-500 h-1 rounded-full transition-all"
                          style={{ width: `${Math.min(weight, 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => handleRemove(pos.ticker)}
                      disabled={removing === pos.ticker}
                      className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-xs px-3 py-1.5 rounded-lg hover:bg-red-900/20 border border-transparent hover:border-red-900/30"
                    >
                      {removing === pos.ticker ? '...' : 'Remove'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PortfolioTable;
