import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { User, Role } from '../types';
import { apiGetUserById, apiCreateUserProfile } from '../services/apiService';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';

interface SignUpDetails {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role: Role;
  campusId?: string;
}

interface SignInCredentials {
    email: string;
    password: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (details: SignUpDetails) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const getInitialSession = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        if (session?.user) {
            const userData = await apiGetUserById(session.user.id);
            setUser(userData || null);
        }
        setIsLoading(false);
    };
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
            if (!user || user.id !== session.user.id) {
                const userData = await apiGetUserById(session.user.id);
                setUser(userData || null);
            }
        } else {
            setUser(null);
        }
        if (isLoading) setIsLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [user, isLoading]);
  
  const signIn = async ({ email, password }: SignInCredentials) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    // onAuthStateChange handles setting the user state
  };
  
  const signUp = async (details: SignUpDetails) => {
    const { data, error } = await supabase.auth.signUp({
        email: details.email,
        password: details.password,
    });
    if (error) throw error;
    if (!data.user) throw new Error("Sign up failed, please try again.");

    // Now create the associated user profile in our public table
    const newUserProfile = await apiCreateUserProfile(
        data.user.id,
        details.name,
        details.email,
        details.phone,
        details.role,
        details.campusId
    );
    setUser(newUserProfile); // Manually set user state immediately after profile creation
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const value = {
    user,
    session,
    isAuthenticated: !!session?.user,
    isLoading,
    signIn,
    signUp,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};