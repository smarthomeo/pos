import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export interface User {
  _id: string;
  username: string;
  email: string;
  phone: string;
  balance: number;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
}

export function useUser() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUser must be used within an AuthProvider');
  }

  const { user, setUser } = context;

  const mutate = (newUser: User) => {
    setUser(newUser);
  };

  return {
    user,
    mutate,
    isLoading: false,
  };
}
