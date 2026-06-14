// src/App.jsx
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login         from './pages/Login';
import Landing       from './pages/Landing';
import NewRequest    from './pages/NewRequest';
import Queue         from './pages/Queue';
import RequestDetail from './pages/RequestDetail';
import Dashboard     from './pages/Dashboard';
import AuditLog      from './pages/AuditLog';

function AuthGuard({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">Loading…</div>;
  if (!user)   return <Navigate to="/login" replace />;
  return children;
}

function SezGuard({ children }) {
  const { isSezTeam } = useAuth();
  if (!isSezTeam) return <Navigate to="/" replace />;
  return children;
}

const navBase  = 'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-gray-600 hover:bg-gray-100 hover:text-gray-900';
const navActive = 'bg-gray-100 text-gray-900 font-medium';

function Sidebar() {
  const { user, isSezTeam, logout } = useAuth();
  const initials = user?.name?.split(' ').map(n=>n[0]).join('').slice(0,2) || '?';

  return (
    <aside className="w-52 min-w-52 bg-white border-r border-gray-100 flex flex-col py-4 px-3 h-screen sticky top-0">
      {/* Brand */}
      <div className="px-2 mb-5">
        <div className="text-sm font-medium text-gray-900">SEZ Compliance</div>
        <div className="text-xs text-gray-400">Special Economic Zone</div>
      </div>

      <nav className="space-y-0.5 flex-1">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 pt-1 pb-1">Submit</p>
        <NavLink to="/"        end className={({isActive}) => `${navBase} ${isActive ? navActive : ''}`}>🏠 Home</NavLink>
        <NavLink to="/requests"    className={({isActive}) => `${navBase} ${isActive ? navActive : ''}`}>📋 My Requests</NavLink>

        {isSezTeam && (
          <>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider px-3 pt-4 pb-1">SEZ Team</p>
            <NavLink to="/dashboard" className={({isActive}) => `${navBase} ${isActive ? navActive : ''}`}>📊 Dashboard</NavLink>
            <NavLink to="/audit"     className={({isActive}) => `${navBase} ${isActive ? navActive : ''}`}>🛡 Audit Log</NavLink>
          </>
        )}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 pt-3 mt-2">
        <div className="flex items-center gap-2 px-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700">{initials}</div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-gray-800 truncate">{user?.name}</div>
            <div className="text-xs text-gray-400">{user?.role}</div>
          </div>
        </div>
        <button onClick={logout} className="w-full text-left text-xs text-gray-400 hover:text-gray-700 px-2 py-1">Sign out</button>
      </div>
    </aside>
  );
}

function AppLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/"                   element={<Landing />} />
          <Route path="/request/new/:typeId" element={<NewRequest />} />
          <Route path="/requests"            element={<Queue />} />
          <Route path="/requests/:id"        element={<RequestDetail />} />
          <Route path="/dashboard"           element={<SezGuard><Dashboard /></SezGuard>} />
          <Route path="/audit"               element={<SezGuard><AuditLog /></SezGuard>} />
          <Route path="*"                    element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AuthGuard><AppLayout /></AuthGuard>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
