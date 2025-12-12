import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin' | 'member';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  isAdmin: boolean;
  loading: boolean;
  signUp: (phone: string, password: string, name: string, role?: AppRole) => Promise<{ error: Error | null }>;
  signIn: (phone: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId);

    if (!error && data) {
      setRoles(data.map(r => r.role as AppRole));
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
        }
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchRoles(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (phone: string, password: string, name: string, role: AppRole = 'member') => {
    // Format phone number for Supabase (needs to be E.164 format)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { error } = await supabase.auth.signUp({
      phone: formattedPhone,
      password,
      options: {
        data: { name, role, phone: formattedPhone }
      }
    });
    
    return { error: error as Error | null };
  };

  const signIn = async (phone: string, password: string) => {
    // Format phone number for Supabase (needs to be E.164 format)
    const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    
    const { error } = await supabase.auth.signInWithPassword({
      phone: formattedPhone,
      password
    });
    
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setRoles([]);
  };

  const isAdmin = roles.includes('admin');

  return (
    <AuthContext.Provider value={{
      user,
      session,
      roles,
      isAdmin,
      loading,
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
