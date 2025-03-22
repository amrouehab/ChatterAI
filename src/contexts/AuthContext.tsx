import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { toast } from '@/components/ui/use-toast';

interface User {
  username: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
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
  children: React.ReactNode;
}

// ✅ Set up Axios with base API URL
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Change this if your backend runs on a different host
});

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const decoded = jwtDecode<{ sub: string; username: string; exp: number }>(storedToken);
        const currentTime = Date.now() / 1000;

        if (decoded.exp > currentTime) {
          setToken(storedToken);
          setUser({ id: decoded.sub, username: decoded.username });
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        } else {
          localStorage.removeItem('token');
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      //const response = await api.post('/login', { username, password });
      //const { token } = response.data;

      // localStorage.setItem('token', token);
      // setToken(token);
      // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

     // const decoded = jwtDecode<{ sub: string; username: string }>(token);
      setUser({ id: "1212", username: "amrou1234" });

      toast({
        title: 'Logged in successfully',
        description: `Welcome back, ${username}!`,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'Invalid username or password.',
        variant: 'destructive',
      });
    //  throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await api.post('/register', { username, password });
      const { token } = response.data;

      localStorage.setItem('token', token);
      setToken(token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const decoded = jwtDecode<{ sub: string; username: string }>(token);
      setUser({ id: decoded.sub, username: decoded.username });

      toast({
        title: 'Account created successfully',
        description: `Welcome, ${username}!`,
      });
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: 'Signup Failed',
        description: error.response?.data?.message || 'Username may already be taken.',
        variant: 'destructive',
      });
     // throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common['Authorization'];

    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
  