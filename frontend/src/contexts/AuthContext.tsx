import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import apiClient, { handleApiError } from '@/lib/api';
import type { User, LoginResponse } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  signUp: (email: string, password: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing token and fetch user
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const { data } = await apiClient.get<User>('/auth/me');
          setUser(data);
        } catch (error) {
          // Token invalid or expired
          localStorage.removeItem('access_token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      await apiClient.post('/auth/register', {
        email,
        password,
        username
      });

      toast.success('Account created successfully! Please sign in.');
      navigate('/auth');
      return { error: null };
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // FastAPI expects form data for OAuth2PasswordRequestForm
      const formData = new FormData();
      formData.append('username', email); // OAuth2 uses 'username' field
      formData.append('password', password);

      const { data } = await apiClient.post<LoginResponse>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Store token
      localStorage.setItem('access_token', data.access_token);

      // Fetch user details
      const { data: userData } = await apiClient.get<User>('/auth/me');
      setUser(userData);

      toast.success('Signed in successfully!');
      navigate('/');
      return { error: null };
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      return { error: errorMessage };
    }
  };

  const signOut = async () => {
    try {
      // Clear local state
      localStorage.removeItem('access_token');
      setUser(null);

      toast.success('Signed out successfully!');
      navigate('/auth');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
