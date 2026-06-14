// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../lib/api';
import { STATUS_STYLES } from '../lib/requestTypes';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    requestsApi.stats().then(setStats).catch(() => {});
  }, []);

  if (!stats) return <div className="p-6 text-gray-400 text-sm">Loading…</div>;

  const countFor = (s) => stats.counts.find(c => c.status === s)?.count || 0;
  const total = stats.counts.reduce((a, c) => a + c.count, 0);

  const metricCards = [
    { label: 'Total Requests', value: total, color: 'text-gray-900' },
    { label: 'Needs Action', value: countFor('New') + countFor('Pending'), color: 'text-amber-700' },
    { label: 'In Review', value: countFor('In Review'), color: 'text-blue-700' },
    { label: 'Approved / Closed', value: countFor('Approved') + countFor('Closed'), color: 'text-green-700' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-xl font-medium mb-5">Dashboard</h1>

      {/* Metric row */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {metricCards.map(m => (
          <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className="text-xs text-gray-400 mb-1">{m.label}</div>
            <div className={`text-3xl font-medium ${m.color}`}>{m.value}</div>
          </div>
        ))}
      </div>

      {/* By category */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">By category</h3>
          <div className="space-y-2">
            {stats.byCategory.map(c => (
              <div key={c.request_category} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{c.request_category}</span>
                <span className="font-medium text-gray-900">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Team queue</h3>
          <div className="space-y-2">
            {stats.byMember.map(m => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{m.name}</span>
                <span className="font-medium text-gray-900">{m.active} active</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly trend */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3">Monthly submissions</h3>
        <div className="flex items-end gap-3 h-20">
          {stats.monthly.slice().reverse().map(m => {
            const pct = Math.max(10, (m.count / Math.max(...stats.monthly.map(x=>x.count))) * 100);
            return (
              <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full bg-gray-900 rounded-t" style={{ height: `${pct}%` }} />
                <span className="text-xs text-gray-400 truncate w-full text-center">{m.month?.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
