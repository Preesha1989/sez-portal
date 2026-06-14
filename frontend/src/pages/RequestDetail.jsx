// src/pages/RequestDetail.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { requestsApi, teamApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';
import { STATUS_STYLES, STATUSES, PRIORITY_STYLES } from '../lib/requestTypes';

export default function RequestDetail() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [searchParams] = useSearchParams();
  const { isSezTeam, user } = useAuth();

  const [req, setReq]         = useState(null);
  const [team, setTeam]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const justSubmitted = searchParams.get('submitted') === '1';

  const load = async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([requestsApi.get(id), teamApi.list()]);
      setReq(r); setTeam(t);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  const changeStatus = async (status) => {
    await requestsApi.setStatus(id, status);
    load();
  };

  const reassign = async (memberId) => {
    await requestsApi.assign(id, memberId);
    load();
  };

  const postComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try { await requestsApi.comment(id, comment); setComment(''); load(); }
    finally { setPosting(false); }
  };

  if (loading) return <div className="p-6 text-gray-400 text-sm">Loading…</div>;
  if (!req)    return <div className="p-6 text-red-600">Request not found.</div>;

  const dynFields = req.dynamic_fields || {};
  const typeFields = Object.entries(dynFields).filter(([,v]) => v);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-4">
        ← Back
      </button>

      {/* Success banner */}
      {justSubmitted && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-lg px-4 py-3 flex items-center gap-2">
          ✅ Request <strong>{id}</strong> submitted — SEZ team has been notified and will respond shortly.
        </div>
      )}

      {/* Title row */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="font-mono text-xs text-blue-700 mb-1">{req.id}</div>
          <h1 className="text-xl font-medium text-gray-900">{req.request_type}</h1>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_STYLES[req.status]}`}>
          {req.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Left — main info */}
        <div className="col-span-2 space-y-4">

          {/* Meta grid */}
          <Card>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <Meta label="Requester"  value={req.requester?.name || '—'} />
              <Meta label="Department" value={req.department} />
              <Meta label="Priority"   value={<span className={PRIORITY_STYLES[req.priority]}>{req.priority}</span>} />
              <Meta label="Category"   value={req.request_category} />
              <Meta label="Direction"  value={req.direction || '—'} />
              <Meta label="Submitted"  value={req.created_at?.slice(0,10)} />
              {req.reference_no && <Meta label="Reference" value={req.reference_no} />}
            </div>
          </Card>

          {/* Type-specific fields */}
          {typeFields.length > 0 && (
            <Card title="Transaction details">
              <div className="grid grid-cols-2 gap-3 text-sm">
                {typeFields.map(([k, v]) => (
                  <Meta key={k} label={k.replace(/_/g,' ')} value={v} />
                ))}
              </div>
            </Card>
          )}

          {/* Description */}
          <Card title="Description">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{req.description}</p>
          </Card>

          {/* Documents */}
          <Card title={`Documents (${req.documents?.length || 0})`}>
            {req.documents?.length === 0 && <p className="text-sm text-gray-400">No documents attached.</p>}
            <div className="space-y-2">
              {req.documents?.map(doc => (
                <a
                  key={doc.id}
                  href={requestsApi.downloadUrl(id, doc.id)}
                  className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm hover:border-gray-300 transition-colors"
                  download
                >
                  <span className="text-gray-400">📄</span>
                  <span className="flex-1 text-blue-700">{doc.filename}</span>
                  <span className="text-xs text-gray-400">{(doc.size_bytes/1024).toFixed(0)} KB</span>
                  <span className="text-xs text-gray-400">↓</span>
                </a>
              ))}
            </div>
          </Card>

          {/* Comments */}
          <Card title="Comments">
            <div className="space-y-3 mb-3">
              {req.comments?.length === 0 && <p className="text-sm text-gray-400">No comments yet.</p>}
              {req.comments?.map(c => (
                <div key={c.id} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">{c.author_name}</span>
                    <span className="text-xs text-gray-400">{c.created_at?.slice(0,16).replace('T',' ')}</span>
                  </div>
                  <p className="text-sm text-gray-700">{c.body}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                rows={2}
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Add a note…"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
              <button
                onClick={postComment} disabled={posting || !comment.trim()}
                className="px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-40 self-end"
              >
                Post
              </button>
            </div>
          </Card>

          {/* Audit trail */}
          <Card title="Audit trail">
            <div className="space-y-0">
              {req.audit?.map((a, i) => (
                <div key={i} className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    a.action.includes('APPROVED') || a.action.includes('CLOSED') ? 'bg-green-500' :
                    a.action.includes('ASSIGN') || a.action.includes('REVIEW') ? 'bg-blue-500' :
                    a.action.includes('REJECT') ? 'bg-red-400' : 'bg-gray-300'
                  }`} />
                  <div className="min-w-0">
                    <div className="text-xs text-gray-400">{a.created_at?.slice(0,16).replace('T',' ')} · {a.actor_name}</div>
                    <div className="text-sm text-gray-700">
                      {a.action.replace(/_/g,' ').toLowerCase()}
                      {a.old_value && a.new_value && <span className="text-gray-400"> · {a.old_value} → {a.new_value}</span>}
                      {!a.old_value && a.new_value && <span className="text-gray-500"> → {a.new_value}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right — SEZ team actions */}
        {isSezTeam && (
          <div className="space-y-4">
            {/* Status */}
            <Card title="Update status">
              <div className="flex flex-col gap-1.5">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => changeStatus(s)}
                    disabled={req.status === s}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-colors ${
                      req.status === s
                        ? 'border-gray-300 bg-gray-100 font-medium text-gray-700 cursor-default'
                        : 'border-gray-200 hover:border-gray-400 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Card>

            {/* Assigned to */}
            <Card title="Assigned to">
              <div className="space-y-2">
                {team.map(m => (
                  <button
                    key={m.id}
                    onClick={() => reassign(m.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                      req.assignee?.id === m.id
                        ? 'border-blue-300 bg-blue-50 text-blue-800'
                        : 'border-gray-200 hover:border-gray-400 text-gray-700'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                      {m.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-xs">{m.name}</div>
                      <div className="text-xs text-gray-400">{m.active_requests} active</div>
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4">
      {title && <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 pb-2 border-b border-gray-100">{title}</p>}
      {children}
    </div>
  );
}

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-xs text-gray-400 capitalize mb-0.5">{label}</div>
      <div className="text-sm text-gray-800">{value}</div>
    </div>
  );
}
