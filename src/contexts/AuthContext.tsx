import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '@/services/api';

export interface User {
  _id: string;
  username: string;
  phone: string;
  balance: number;
  referralCode: string;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const response = await authApi.verify();
        if (response.user) {
          const userData = {
            _id: response.user._id,
            username: response.user.username,
            phone: response.user.phone,
            balance: response.user.balance || 0,
            referralCode: response.user.referralCode,
            isAdmin: response.user.isAdmin || false,
            isActive: response.user.isActive || false,
            createdAt: response.user.createdAt,
            updatedAt: response.user.updatedAt
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        setUser(null);
        localStorage.removeItem('user');
      }
    };

    verifyAuth();
  }, []);

  const login = async (phone: string, password: string) => {
    const response = await authApi.login({ phone, password });
    if (response.user) {
      const userData = {
        _id: response.user._id,
        username: response.user.username,
        phone: response.user.phone,
        balance: response.user.balance || 0,
        referralCode: response.user.referralCode,
        isAdmin: response.user.isAdmin || false,
        isActive: response.user.isActive || false,
        createdAt: response.user.createdAt,
        updatedAt: response.user.updatedAt
      };
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      // Always clear the state, even if the API call fails
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
