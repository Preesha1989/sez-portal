// src/pages/NewRequest.jsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9';
import { REQUEST_TYPES, COLOR_MAP } from '../lib/requestTypes';
import { requestsApi } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

const DEPARTMENTS = ['Operations','HR','IT','Marketing','Legal','Logistics','Finance','Admin','Procurement','Engineering'];

export default function NewRequest() {
  const { typeId } = useParams();
  const navigate   = useNavigate();
  const { user }   = useAuth();

  const type = REQUEST_TYPES.find(t => t.id === typeId);
  if (!type) return <div className="p-6 text-red-600">Unknown request type.</div>;

  const [form, setForm]         = useState({ name: user?.name || '', email: user?.email || '', department: user?.department || 'Operations', priority: 'Normal', description: '', referenceNo: '' });
  const [dynFields, setDynFields] = useState({});
  const [files, setFiles]       = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState(null);

  const c = COLOR_MAP[type.color];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.description.trim()) { setError('Description is required.'); return; }
    setSubmitting(true);
    try {
      // 1. Create request
      const { id } = await requestsApi.create({
        requestType:      type.label,
        requestCategory:  type.category,
        direction:        type.direction,
        description:      form.description,
        priority:         form.priority,
        dynamicFields:    dynFields,
        referenceNo:      form.referenceNo || null,
        idempotencyKey:   uuidv4(),
      });

      // 2. Upload files if any
      if (files.length > 0) {
        await requestsApi.uploadDocuments(id, files);
      }

      navigate(`/requests/${id}?submitted=1`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Back link */}
      <button onClick={() => navigate('/')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-4">
        ← Back to request types
      </button>

      {/* Request type header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center text-xl`}>
          {type.icon}
        </div>
        <div>
          <h1 className="text-lg font-medium text-gray-900">{type.label}</h1>
          <p className="text-sm text-gray-500">{type.sub}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Your details */}
        <Section title="Your details">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full name">
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" required />
            </Field>
            <Field label="Department">
              <select value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))}>
                {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
            <Field label="Email">
              <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@company.com" required />
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                <option>Normal</option><option>High</option><option>Urgent</option>
              </select>
            </Field>
          </div>
        </Section>

        {/* Type-specific fields */}
        {type.fields.length > 0 && (
          <Section title="Transaction details">
            <div className="grid grid-cols-2 gap-4">
              {type.fields.map(f => (
                <Field key={f.key} label={f.label}>
                  <input
                    value={dynFields[f.key] || ''}
                    onChange={e => setDynFields(d => ({...d, [f.key]: e.target.value}))}
                    placeholder={f.placeholder}
                  />
                </Field>
              ))}
            </div>
          </Section>
        )}

        {/* Description */}
        <Section title="Description">
          <textarea
            rows={4}
            value={form.description}
            onChange={e => setForm(f => ({...f, description: e.target.value}))}
            placeholder="Describe the requirement — include consignment numbers, entity names, deadlines, and any special instructions…"
            required
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400 resize-y"
          />
          <Field label="Reference / Invoice / Bill number (optional)" className="mt-3">
            <input value={form.referenceNo} onChange={e => setForm(f => ({...f, referenceNo: e.target.value}))} placeholder="e.g. SB/2026/00123" />
          </Field>
        </Section>

        {/* Documents */}
        <Section title="Attach documents">
          <label className="block border border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors">
            <input
              type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.xlsx"
              className="hidden"
              onChange={e => setFiles(prev => {
                const existing = new Set(prev.map(f => f.name));
                return [...prev, ...Array.from(e.target.files).filter(f => !existing.has(f.name))];
              })}
            />
            <div className="text-2xl mb-1">📎</div>
            <p className="text-sm text-gray-600">Click to attach files</p>
            <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, XLSX — max 20 MB each</p>
          </label>

          {files.length > 0 && (
            <ul className="mt-2 space-y-1">
              {files.map((f, i) => (
                <li key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
                  <span className="text-gray-400">📄</span>
                  <span className="flex-1 truncate">{f.name}</span>
                  <span className="text-xs text-gray-400">{(f.size/1024).toFixed(0)} KB</span>
                  <button type="button" onClick={() => setFiles(fs => fs.filter((_,j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-1">✕</button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => navigate('/')} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit" disabled={submitting}
            className="px-5 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? 'Submitting…' : '↑ Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 mb-3 pb-2 border-b border-gray-100">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-gray-500">{label}</label>
      <div className="[&_input]:w-full [&_input]:border [&_input]:border-gray-200 [&_input]:rounded-lg [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:focus:outline-none [&_input]:focus:ring-1 [&_input]:focus:ring-gray-400 [&_select]:w-full [&_select]:border [&_select]:border-gray-200 [&_select]:rounded-lg [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:focus:outline-none [&_select]:focus:ring-1 [&_select]:focus:ring-gray-400 [&_select]:bg-white">
        {children}
      </div>
    </div>
  );
}
