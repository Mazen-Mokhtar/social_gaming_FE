import axios from 'axios';
import jwtDecode from 'jwt-decode';

const api = axios.create({
  baseURL: 'https://socialgaming-production.up.railway.app',
  headers: {
    'Content-Type': 'application/json',
  },
});

interface TokenPayload {
  role: string;
  userId?: string;
  iat?: number;
  exp?: number;
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = token;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export interface SignUpData {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  gender: 'male' | 'female';
  DOB: string;
}

export interface LoginData {
  email: string;
  password: string;
}

const authApi = {
  signup: async (data: SignUpData) => {
    try {
      const response = await api.post('/user/signup', data);
      
      if (response.data.success) {
        // Store the signup token for email verification
        localStorage.setItem('signupToken', response.data.data);
      }

      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to connect to the server');
    }
  },

  login: async (data: LoginData) => {
    try {
      const response = await api.post('/user/login', data);
      const { token, refreshToken } = response.data;

      if (typeof window !== 'undefined') {
        const decodedToken = jwtDecode<TokenPayload>(token);
        const role = decodedToken.role;
        const roleToken = `${role} ${token}`;

        localStorage.setItem('token', roleToken);
        localStorage.setItem('refreshToken', refreshToken);
        document.cookie = `loggedIn=true; path=/; max-age=604800`; // 7 days expiry
      }

      return {
        success: true,
        token,
        refreshToken,
      };
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to connect to the server');
    }
  },

  forgetPassword: async (email: string) => {
    try {
      const response = await api.post('/user/forget-password', { email });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to connect to the server');
    }
  },

  resetCode: async (code: string, token: string) => {
    try {
      const response = await api.post('/user/reset-code', 
        { code },
        { headers: { Authorization: token } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to connect to the server');
    }
  },

  changePassword: async (data: { password: string; cPassword: string }, token: string) => {
    try {
      const response = await api.patch('/user/change-password',
        data,
        { headers: { Authorization: token } }
      );
      return response.data;
    } catch (error: any) {
      if (error.response) {
        return error.response.data;
      }
      throw new Error(error.message || 'Failed to connect to the server');
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('signupToken');
      document.cookie = 'loggedIn=; path=/; max-age=0';
    }
  },

  getRole: (): string | null => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const [role, rawToken] = token.split(' ', 2);
          const decodedToken = jwtDecode<TokenPayload>(rawToken);
          return decodedToken.role || role || null;
        } catch (error) {
          console.error('Error decoding token:', error);
          return null;
        }
      }
    }
    return null;
  },

  isAuthenticated: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      return !!token;
    }
    return false;
  },
};

export default authApi;