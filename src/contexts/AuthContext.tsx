
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'super_admin' | 'user' | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user role:', error);
        return null;
      }
      
      return data?.role || null;
    } catch (error) {
      console.error('Error fetching user role:', error);
      return null;
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch user role
          setTimeout(async () => {
            const role = await fetchUserRole(session.user.id);
            setUserRole(role);
          }, 0);
        } else {
          setUserRole(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id).then(setUserRole);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      console.log('🔍 Checking if user exists for email:', normalizedEmail);
      
      // FIRST: Check if user already exists in profiles table
      const { data: existingUsers, error: checkError } = await supabase
        .from('profiles')
        .select('email, id')
        .eq('email', normalizedEmail);

      console.log('📋 Database check result:', { existingUsers, checkError });

      // If there's an error checking the database
      if (checkError) {
        console.error('❌ Error checking existing user:', checkError);
        return { 
          error: { 
            message: "Error checking user registration status. Please try again." 
          } 
        };
      }

      // If user already exists, return error immediately
      if (existingUsers && existingUsers.length > 0) {
        console.log('⚠️ User already exists! Blocking signup.');
        return { 
          error: { 
            message: "User already exists. Please login instead." 
          } 
        };
      }

      console.log('✅ No existing user found. Proceeding with signup...');

      // ONLY IF USER DOESN'T EXIST: Proceed with signup
      const redirectUrl = `${window.location.origin}/email-verified`;
      
      const { error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName
          }
        }
      });
      
      if (error) {
        console.error('❌ Signup error:', error);
      } else {
        console.log('📧 Verification email sent successfully');
      }
      
      return { error };
    } catch (error) {
      console.error('❌ Unexpected signup error:', error);
      return { 
        error: { 
          message: "An error occurred during registration. Please try again." 
        } 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
  };

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
