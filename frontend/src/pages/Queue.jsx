// src/pages/Queue.jsx
// Request list — shows own requests for requesters, all for SEZ team.

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { requestsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { STATUS_STYLES, PRIORITY_STYLES, STATUSES } from '../lib/requestTypes';

const STATUSES_WITH_ALL = ['all', ...STATUSES];

export default function Queue() {
  const { isSezTeam } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 25 };
      if (filter !== 'all') params.status = filter;
      if (search.trim()) params.search = search.trim();
      const res = await requestsApi.list(params);
      setRequests(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [filter, search, page]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-medium">{isSezTeam ? 'All Requests' : 'My Requests'}</h1>
        <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50">
          + New Request
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center mb-4">
        {STATUSES_WITH_ALL.map(s => (
          <button
            key={s}
            onClick={() => { setFilter(s); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs border transition-colors ${filter === s ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by ID, type, requester…"
          className="ml-auto border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Type</th>
              {isSezTeam && <th className="px-4 py-3 text-left">Requester</th>}
              <th className="px-4 py-3 text-left">Dept</th>
              <th className="px-4 py-3 text-left">Priority</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
            )}
            {!loading && requests.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No requests found.</td></tr>
            )}
            {requests.map(r => (
              <tr key={r.id} onClick={() => navigate(`/requests/${r.id}`)} className="cursor-pointer hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-blue-700">{r.id}</td>
                <td className="px-4 py-3 text-gray-800">{r.request_type}</td>
                {isSezTeam && <td className="px-4 py-3 text-gray-600">{r.requester_name}</td>}
                <td className="px-4 py-3 text-gray-500 text-xs">{r.department}</td>
                <td className={`px-4 py-3 text-xs ${PRIORITY_STYLES[r.priority]}`}>{r.priority}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{r.created_at?.slice(0,10)}</td>
                <td className="px-4 py-3"><span className="text-gray-300 text-xs">→</span></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {total > 25 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{total} total</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p-1)} className="px-3 py-1 border rounded disabled:opacity-40">← Prev</button>
              <button disabled={page * 25 >= total} onClick={() => setPage(p => p+1)} className="px-3 py-1 border rounded disabled:opacity-40">Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
