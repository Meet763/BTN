import React, { createContext, useContext, useState, useEffect } from 'react';
import { axiosInstance } from '../api/axiosConfig';
import { message } from 'antd';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  employeeId?: string;
  orgUnitId?: string;
  jobTitle?: string;
}

interface AuthContextType {
  user: User | null;
  companyName: string | null;
  setCompanyName: (name: string | null) => void;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const decodeToken = (token: string): any => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const userFromToken = (decoded: any): User => ({
  id: decoded.sub || decoded.nameid,
  fullName: decoded.name || decoded.unique_name,
  email: decoded.email,
  role: decoded.role,
  employeeId: decoded.employee_id,
  orgUnitId: decoded.org_unit_id,
  jobTitle: decoded.job_title,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (user?.role !== 'Customer') {
      setCompanyName(null);
      return;
    }

    axiosInstance.get('/api/customer-profile/branding')
      .then((response) => {
        if (!cancelled) setCompanyName(response.data.data.companyName || null);
      })
      .catch(() => {
        if (!cancelled) setCompanyName(null);
      });

    return () => { cancelled = true; };
  }, [user?.id, user?.role]);

  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('btn-token');
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.exp * 1000 > Date.now()) {
          setUser(userFromToken(decoded));
        } else {
          localStorage.clear();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    try {
      const response = await axiosInstance.post('/api/auth/login', { email, password });
      if (response.data.success) {
        const { accessToken, refreshToken, user: userData } = response.data.data;
        localStorage.setItem('btn-token', accessToken);
        localStorage.setItem('btn-refresh-token', refreshToken);
        const nextUser: User = {
          id: userData.id,
          fullName: userData.fullName,
          email: userData.email,
          role: userData.role,
          employeeId: userData.employeeId,
          orgUnitId: userData.orgUnitId,
          jobTitle: userData.jobTitle,
        };
        setUser(nextUser);
        message.success('Welcome back!');
        return nextUser;
      }
      return null;
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Login failed. Please check your credentials.';
      message.error(errorMsg);
      return null;
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('btn-refresh-token');
      if (refreshToken) {
        await axiosInstance.post('/api/auth/logout', { refreshToken });
      }
    } catch (e) {
      console.error('Logout API failed:', e);
    } finally {
      localStorage.clear();
      setUser(null);
      message.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        companyName,
        setCompanyName,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
