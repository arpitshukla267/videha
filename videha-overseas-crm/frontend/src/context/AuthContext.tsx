import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types/crm';
import { api, getStoredToken, setStoredToken, removeStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  permissions: string[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
  hasAnyPermission: (codes: string[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setRole(null);
      setPermissions([]);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success) {
        setUser(res.data.user);
        setRole(res.data.role);
        setPermissions(res.data.permissions || []);
      } else {
        removeStoredToken();
        setUser(null);
      }
    } catch (err) {
      console.error('Session refresh failed:', err);
      removeStoredToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await api.auth.login(email, password);
      if (!res.success || !res.data?.token) {
        throw new Error("Login failed. Please check your credentials.");
      }
      setStoredToken(res.data.token);
      setUser(res.data.user);
      setRole(res.data.role);
      setPermissions(res.data.permissions || []);
    } catch (err) {
      removeStoredToken();
      setUser(null);
      setRole(null);
      setPermissions([]);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch {
      // ignore
    } finally {
      removeStoredToken();
      setUser(null);
      setRole(null);
      setPermissions([]);
    }
  };

  const hasPermission = (code: string): boolean => {
    if (!user) return false;
    if (user.roleName === 'SUPER_ADMIN') return true;
    return permissions.includes(code);
  };

  const hasAnyPermission = (codes: string[]): boolean => {
    if (!user) return false;
    if (user.roleName === 'SUPER_ADMIN') return true;
    return codes.some(c => permissions.includes(c));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        permissions,
        isLoading,
        login,
        logout,
        hasPermission,
        hasAnyPermission,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
