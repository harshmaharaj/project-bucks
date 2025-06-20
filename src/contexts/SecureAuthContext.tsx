
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeErrorMessage, checkRateLimit } from '@/utils/security';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: 'super_admin' | 'user' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  userRole: null,
  loading: true,
  signOut: async () => {},
  signInWithEmail: async () => {},
  signUp: async () => {},
});

export const useSecureAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSecureAuth must be used within a SecureAuthProvider');
  }
  return context;
};

export const SecureAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<'super_admin' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Session timeout (30 minutes of inactivity)
  const SESSION_TIMEOUT = 30 * 60 * 1000;
  let sessionTimer: NodeJS.Timeout;

  const resetSessionTimer = () => {
    if (sessionTimer) clearTimeout(sessionTimer);
    if (user) {
      sessionTimer = setTimeout(() => {
        toast({
          title: "Session Expired",
          description: "For security reasons, you have been logged out due to inactivity.",
          variant: "destructive"
        });
        signOut();
      }, SESSION_TIMEOUT);
    }
  };

  // Reset timer on user activity
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const resetTimer = () => resetSessionTimer();

    events.forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimer, true);
      });
      if (sessionTimer) clearTimeout(sessionTimer);
    };
  }, [user]);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_current_user_role');
      if (error) throw error;
      setUserRole(data || 'user');
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole('user');
    }
  };

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserRole(session.user.id);
          resetSessionTimer();
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setTimeout(async () => {
            await fetchUserRole(session.user.id);
            resetSessionTimer();
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setUserRole(null);
          if (sessionTimer) clearTimeout(sessionTimer);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    // Rate limiting for sign-in attempts
    const identifier = email.toLowerCase();
    if (!checkRateLimit('signin', identifier, 5, 300000)) {
      throw new Error('Too many sign-in attempts. Please wait 5 minutes before trying again.');
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        });
      }
    } catch (error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw new Error(sanitizedMessage);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    // Rate limiting for sign-up attempts
    const identifier = email.toLowerCase();
    if (!checkRateLimit('signup', identifier, 3, 300000)) {
      throw new Error('Too many sign-up attempts. Please wait 5 minutes before trying again.');
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.user) {
        toast({
          title: "Account created!",
          description: "Please check your email for a verification link.",
        });
      }
    } catch (error) {
      const sanitizedMessage = sanitizeErrorMessage(error);
      throw new Error(sanitizedMessage);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      if (error) throw error;
      
      // Clear any potentially sensitive data from localStorage
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('rate_limit_') || key.includes('auth')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      if (sessionTimer) clearTimeout(sessionTimer);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Force sign out even if there's an error
      setUser(null);
      setSession(null);
      setUserRole(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userRole,
        loading,
        signOut,
        signInWithEmail,
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
