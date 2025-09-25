import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import ApiService from '../services/api.service';
import WebSocketService from '../services/websocket.service';
import { useNotification } from './NotificationContext';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roles: ('rider' | 'driver')[];
  activeRole: 'rider' | 'driver';
  driverId?: string;
  driver?: {
    id: string;
    licenseNumber: string;
    vehicleInfo: string;
    rating: number;
    isOnline: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    registrationType: 'rider' | 'driver' | 'both';
  }) => Promise<boolean>;
  switchRole: (role: 'rider' | 'driver') => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (profileData: Partial<User>) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();

  const isAuthenticated = !!user;

  // Check for existing authentication on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await ApiService.getToken();
      
      if (token) {
        const userData = await ApiService.getProfile();
        setUser(userData);
        
        // Connect to WebSocket
        await WebSocketService.connect();
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await ApiService.clearToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await ApiService.login({ email, password });
      setUser(response.user);
      
      // Connect to WebSocket
      await WebSocketService.connect();
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      showNotification('error', 'Login Failed', error.response?.data?.message || 'Invalid credentials');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    password: string;
    phone: string;
    registrationType: 'rider' | 'driver' | 'both';
  }): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await ApiService.register(userData);
      setUser(response.user);
      
      // Connect to WebSocket
      await WebSocketService.connect();
      
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      showNotification('error', 'Registration Failed', error.response?.data?.message || 'Registration failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = async (role: 'rider' | 'driver'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await ApiService.switchRole(role);
      
      if (response.success && user) {
        setUser({
          ...user,
          activeRole: role,
        });
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Role switch error:', error);
      showNotification('error', 'Switch Failed', error.response?.data?.message || 'Failed to switch role');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await ApiService.logout();
      setUser(null);
      
      // Disconnect WebSocket
      WebSocketService.disconnect();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      const updatedUser = await ApiService.updateUserProfile(profileData);
      setUser(updatedUser);
      return true;
    } catch (error: any) {
      console.error('Profile update error:', error);
      showNotification('error', 'Update Failed', error.response?.data?.message || 'Failed to update profile');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await ApiService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    switchRole,
    logout,
    updateProfile,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
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
