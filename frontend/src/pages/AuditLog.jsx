// src/pages/AuditLog.jsx
import { useEffect, useState } from 'react';
import { auditApi } from '../lib/api';

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditApi.list({ limit: 100 }).then(setEntries).finally(() => setLoading(false));
  }, []);

  const dotColor = (action) => {
    if (/APPROVED|CLOSED/.test(action)) return 'bg-green-500';
    if (/ASSIGN|REVIEW/.test(action))   return 'bg-blue-500';
    if (/REJECT/.test(action))          return 'bg-red-400';
    if (/CREATED/.test(action))         return 'bg-purple-400';
    return 'bg-gray-300';
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium">Audit Log</h1>
        <span className="text-xs text-gray-400">Append-only · immutable record</span>
      </div>

      <div className="bg-white border border-gray-100 rounded-xl divide-y divide-gray-50">
        {loading && <div className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</div>}
        {entries.map((e, i) => (
          <div key={i} className="flex gap-3 px-4 py-3">
            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor(e.action)}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">{e.created_at?.slice(0,16).replace('T',' ')}</span>
                <span className="text-xs font-medium text-gray-600">{e.actor_name}</span>
                {e.request_id && <span className="font-mono text-xs text-blue-600">{e.request_id}</span>}
              </div>
              <div className="text-sm text-gray-700 mt-0.5">
                {e.action.replace(/_/g,' ').toLowerCase()}
                {e.old_value && e.new_value && (
                  <span className="text-gray-400"> · {e.old_value} → {e.new_value}</span>
                )}
                {!e.old_value && e.new_value && (
                  <span className="text-gray-500"> → {e.new_value}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
