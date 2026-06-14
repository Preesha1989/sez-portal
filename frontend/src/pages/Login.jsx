// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DEMO_ACCOUNTS = [
  { label: 'Requester',         email: 'sanjay@company.com',  role: 'requester' },
  { label: 'SEZ Officer',       email: 'ravi@sez.internal',   role: 'sez_team'  },
  { label: 'SEZ Admin',         email: 'anita@sez.internal',  role: 'sez_admin' },
];

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('demo1234');
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl mb-2">🏭</div>
          <h1 className="text-xl font-medium text-gray-900">SEZ Compliance Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Special Economic Zone · Visakhapatnam</p>
        </div>

        {/* Login form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Email</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Password</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-gray-900 text-white text-sm rounded-lg hover:bg-gray-700 disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2 text-center">Demo accounts (password: demo1234)</p>
            <div className="space-y-1.5">
              {DEMO_ACCOUNTS.map(a => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => { setEmail(a.email); setPassword('demo1234'); }}
                  className="w-full flex items-center justify-between text-xs px-3 py-1.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-700 font-medium">{a.label}</span>
                  <span className="text-gray-400 font-mono">{a.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
