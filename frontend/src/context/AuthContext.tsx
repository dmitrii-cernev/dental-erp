import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, getMe } from '../api/auth';
import type { UserRead } from '../types/api';

const TOKEN_KEY = 'dental_erp_token';

interface AuthContextValue {
  token: string | null;
  currentUser: UserRead | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && isTokenValid(stored)) return stored;
    localStorage.removeItem(TOKEN_KEY);
    return null;
  });
  const [currentUser, setCurrentUser] = useState<UserRead | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCurrentUser(null);
    navigate('/login');
  }, [navigate]);

  // Fetch current user on mount if token exists
  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    getMe()
      .then(setCurrentUser)
      .catch(() => logout())
      .finally(() => setIsLoading(false));
  }, [token, logout]);

  // Listen for auth:expired events from API layer
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:expired', handler);
    return () => window.removeEventListener('auth:expired', handler);
  }, [logout]);

  const login = useCallback(async (username: string, password: string) => {
    const { access_token } = await apiLogin(username, password);
    localStorage.setItem(TOKEN_KEY, access_token);
    setToken(access_token);
    const user = await getMe();
    setCurrentUser(user);
    navigate('/dashboard');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ token, currentUser, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
