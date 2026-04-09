import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts';
import { portfolioApi } from '../services/api';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const value = payload[0]?.value;
  const cost = payload[1]?.value;
  const gain = value != null && cost != null ? value - cost : null;
  const gainPct = gain != null && cost > 0 ? (gain / cost) * 100 : null;
  const positive = gain >= 0;

  return (
    <div className="bg-slate-900 border border-slate-600 rounded-xl p-3 shadow-xl text-sm">
      <div className="text-slate-400 mb-2">{label}</div>
      <div className="text-white font-semibold">
        €{value?.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>
      {gain != null && (
        <div className={positive ? 'text-emerald-400' : 'text-red-400'}>
          {positive ? '+' : ''}€{gain.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          {gainPct != null && ` (${gainPct.toFixed(2)}%)`}
        </div>
      )}
    </div>
  );
};

function PortfolioChart({ refreshKey }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    portfolioApi.getHistory().then((rows) => {
      const formatted = rows.map((r) => ({
        date: new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        value: r.value,
        cost: r.cost,
      }));
      setData(formatted);
      setLoading(false);
    });
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-64 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading chart...</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 h-64 flex flex-col items-center justify-center text-center gap-2">
        <div className="text-2xl">📈</div>
        <div className="text-slate-300 font-medium">Portfolio history will appear here</div>
        <div className="text-slate-500 text-sm">Data builds up as you visit the dashboard over time.</div>
      </div>
    );
  }

  const allValues = data.map((d) => d.value);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const padding = (maxVal - minVal) * 0.1 || maxVal * 0.1;

  const lastEntry = data[data.length - 1];
  const firstEntry = data[0];
  const totalGain = lastEntry ? lastEntry.value - (lastEntry.cost || firstEntry?.value || 0) : 0;
  const isPositive = totalGain >= 0;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
        <h2 className="text-white font-semibold text-lg">Portfolio History</h2>
        <span className="text-slate-400 text-sm">{data.length} day{data.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="p-4 pt-6">
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.2} />
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[Math.max(0, minVal - padding), maxVal + padding]}
              tick={{ fill: '#94a3b8', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `€${(v / 1000).toFixed(0)}k`}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#valueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: isPositive ? '#10b981' : '#ef4444', strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="cost"
              stroke="#6366f1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 px-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <div className={`w-3 h-0.5 rounded ${isPositive ? 'bg-emerald-400' : 'bg-red-400'}`} />
            Portfolio Value
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-indigo-400 rounded" style={{ borderTop: '1px dashed' }} />
            Cost Basis
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioChart;
