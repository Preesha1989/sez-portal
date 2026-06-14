// src/hooks/useAuth.jsx
import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [member, setMember]   = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('sez_token');
    if (!token) { setLoading(false); return; }
    authApi.me()
      .then(({ user, member }) => { setUser(user); setMember(member); })
      .catch(() => localStorage.removeItem('sez_token'))
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { token, user } = await authApi.login(email, password);
    localStorage.setItem('sez_token', token);
    setUser(user);
    // Fetch member profile if SEZ team
    if (user.role !== 'requester') {
      const { member } = await authApi.me();
      setMember(member);
    }
    return user;
  };

  const logout = () => {
    localStorage.removeItem('sez_token');
    setUser(null);
    setMember(null);
  };

  const isSezTeam = user?.role === 'sez_team' || user?.role === 'sez_admin';

  return (
    <AuthContext.Provider value={{ user, member, loading, login, logout, isSezTeam }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
