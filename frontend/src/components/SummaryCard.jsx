import React from 'react';

function SummaryCard({ label, value, sub, positive, negative, icon }) {
  const colorClass =
    positive === true ? 'text-emerald-400' : positive === false ? 'text-red-400' : 'text-white';

  return (
    <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 flex flex-col gap-1">
      <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
        {icon && <span className="text-base">{icon}</span>}
        {label}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${colorClass}`}>{value}</div>
      {sub && <div className="text-slate-400 text-sm">{sub}</div>}
    </div>
  );
}

export default SummaryCard;
