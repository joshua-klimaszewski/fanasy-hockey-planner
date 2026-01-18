import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  isAuthenticated,
  handleAuthCallback,
  initiateLogin,
  clearTokens,
} from '@/api/clients/yahooClient';

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for OAuth callback
    const didAuthenticate = handleAuthCallback();

    if (didAuthenticate) {
      setIsLoggedIn(true);
      setIsLoading(false);
      return;
    }

    // Check for existing session
    setIsLoggedIn(isAuthenticated());
    setIsLoading(false);
  }, []);

  const login = async () => {
    try {
      await initiateLogin();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = () => {
    clearTokens();
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
