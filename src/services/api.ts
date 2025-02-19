const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

async function fetchApi(endpoint: string, options: ApiOptions = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: options.method || 'GET',
      headers,
      credentials: 'include',
      mode: 'cors',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // Handle 401 Unauthorized
    if (response.status === 401 && !options.skipAuth) {
      // Clear user data
      localStorage.removeItem('user');
      // Redirect to login
      window.location.href = '/login';
      throw new Error('Authentication required');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'API request failed');
    }

    const data = await response.json();

    // If this is a login/register response and it has user data, store it
    if ((endpoint === '/api/auth/login' || endpoint === '/api/auth/register' || endpoint === '/api/auth/verify') && data.user) {
      // Make sure we store all necessary user properties
      const userData = {
        _id: data.user._id,
        username: data.user.username,
        phone: data.user.phone,
        balance: data.user.balance || 0,
        referralCode: data.user.referralCode,
        isAdmin: data.user.isAdmin || false,
        isActive: data.user.isActive || false,
        createdAt: data.user.createdAt,
        updatedAt: data.user.updatedAt
      };
      localStorage.setItem('user', JSON.stringify(userData));
    }

    return data;
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Auth API
export const authApi = {
  login: (credentials: { phone: string; password: string }) =>
    fetchApi('/api/auth/login', { method: 'POST', body: credentials, skipAuth: true }),
  
  register: (userData: { username: string; phone: string; password: string; referralCode?: string }) =>
    fetchApi('/api/auth/register', { method: 'POST', body: userData, skipAuth: true }),
    
  verify: () => fetchApi('/api/auth/verify', { skipAuth: true }),
  
  logout: () => {
    localStorage.removeItem('user');
    return fetchApi('/api/auth/logout', { method: 'POST' });
  },
};

// User API
export const userApi = {
  getProfile: () => fetchApi('/api/auth/verify'),
  updateProfile: (data: any) => fetchApi('/api/users/profile', { method: 'PUT', body: data }),
};

// Transaction API
export const transactionApi = {
  getTransactions: () => fetchApi('/api/transactions'),
  
  initiateDeposit: (amount: number) =>
    fetchApi('/api/transactions/deposit', { method: 'POST', body: { amount } }),
  
  initiateWithdrawal: (amount: number) =>
    fetchApi('/api/transactions/withdraw', { method: 'POST', body: { amount } }),
  
  confirmDeposit: (transactionId: string) =>
    fetchApi(`/api/transactions/deposit/${transactionId}/confirm`, { method: 'POST' }),
};

// Investment API
export const investmentApi = {
  createInvestment(data: { pair: string; amount: number; dailyROI: number }) {
    return fetchApi('/api/investments', {
      method: 'POST',
      body: data,
    });
  },

  getInvestments() {
    return fetchApi('/api/investments');
  },

  getEarnings() {
    return fetchApi('/api/investments/earnings');
  },

  getHistory() {
    return fetchApi('/api/investments/history');
  },
};

// Referral API
export const referralApi = {
  getStats: () => fetchApi('/api/referral/stats'),
  getHistory: () => fetchApi('/api/referral/history'),
};

export const adminApi = {
  getPendingTransactions: async () => {
    const response = await fetch(`${API_URL}/admin/transactions/pending`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch pending transactions');
    return response.json();
  },

  getPendingVerifications: async () => {
    const response = await fetch(`${API_URL}/admin/verifications/pending`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to fetch pending verifications');
    return response.json();
  },

  approveTransaction: async (transactionId: string) => {
    const response = await fetch(`${API_URL}/admin/transactions/${transactionId}/approve`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to approve transaction');
    return response.json();
  },

  rejectTransaction: async (transactionId: string) => {
    const response = await fetch(`${API_URL}/admin/transactions/${transactionId}/reject`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to reject transaction');
    return response.json();
  },

  verifyUser: async (userId: string) => {
    const response = await fetch(`${API_URL}/admin/users/${userId}/verify`, {
      method: 'POST',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to verify user');
    return response.json();
  }
};
