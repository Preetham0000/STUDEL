import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { apiGetUserById, apiSignUp } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userId: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, phone: string, role: Role, campusId?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const storedUserId = localStorage.getItem('studel_userId');
    if (storedUserId) {
      apiGetUserById(storedUserId)
        .then(userData => {
          if (userData) {
            setUser(userData);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (userId: string) => {
    setIsLoading(true);
    try {
        const userData = await apiGetUserById(userId);
        if (userData) {
            setUser(userData);
            localStorage.setItem('studel_userId', userData.id);
        } else {
            throw new Error("User not found");
        }
    } finally {
        setIsLoading(false);
    }
  };
  
  const signup = async (name: string, phone: string, role: Role, campusId?: string) => {
    setIsLoading(true);
    try {
        const newUser = await apiSignUp(name, phone, role, campusId);
        setUser(newUser);
        localStorage.setItem('studel_userId', newUser.id);
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('studel_userId');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    signup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};