import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, UseMutationResult } from '@tanstack/react-query';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  authToken: string | null;
  isInitializing: boolean;
  registerMutation: UseMutationResult<any, any, any, any>;
  loginMutation: UseMutationResult<any, any, any, any>;
  resetPasswordMutation: UseMutationResult<any, any, any, any>;
  forgotPasswordMutation: UseMutationResult<any, any, string, any>;
  verifyOTPMutation: UseMutationResult<any, any, { email: string; otp: string }, any>; 
  logout: () => Promise<void>;
  setOAuthUser: (user: User | null, token: string | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Sync state with AsyncStorage on boot
  useEffect(() => {
    const loadStoredSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('manual_token');
        const storedUser = await AsyncStorage.getItem('user_session');

        if (storedToken && storedUser) {
          setAuthToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Failed to load user session:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    loadStoredSession();
  }, []);

  // TanStack Query Mutation for Registration
  const registerMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await api.post('/register', userData);
      return response.data;
    }
  });

  // TanStack Query Mutation for Manual Login
  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const response = await api.post('/login', credentials);
      return response.data;
    },
    onSuccess: async (data) => {
      await AsyncStorage.setItem('manual_token', data.token);
      await AsyncStorage.setItem('user_session', JSON.stringify(data.user));

      setAuthToken(data.token);
      setUser(data.user);
    }
  });

  // resetPasswordMutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (resetData: { token: string; newPassword: string; confirmNewPassword: string }) => {
      const response = await api.post('/reset-password', resetData);
      return response.data; 
    }
  });

  // forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/forgot-password', { email });
      return response.data; 
    }
  });

  // verifyOTPMutation
  const verifyOTPMutation = useMutation({
    mutationFn: async (otpData: { email: string; otp: string }) => {
      const response = await api.post('/verify-otp', otpData);
      return response.data; 
    },
    onSuccess: async (data) => {
      await AsyncStorage.setItem('manual_token', data.token);

      const activeSessionUser: User = {
        _id: data.userId,
        firstName: "", 
        lastName: "",
        email: "", 
        role: "user",
        profilePicture: "",
        verified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await AsyncStorage.setItem('user_session', JSON.stringify(activeSessionUser));

      setAuthToken(data.token);
      setUser(activeSessionUser);
    }
  });

  const setOAuthUser = (oauthUser: User | null, oauthToken: string | null) => {
    setUser(oauthUser);
    setAuthToken(oauthToken);
  };

  // Logout Action clearing all instances
  const logout = async () => {
    try {
      await AsyncStorage.removeItem('manual_token');
      await AsyncStorage.removeItem('user_session');
      setAuthToken(null);
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      authToken,
      isInitializing,
      registerMutation,
      loginMutation,
      resetPasswordMutation,
      forgotPasswordMutation,
      verifyOTPMutation,
      logout,
      setOAuthUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
