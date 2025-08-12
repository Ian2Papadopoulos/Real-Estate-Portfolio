import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Types
export interface UserProfile {
  id: string;
  agency_id: string;
  name: string;
  role: 'admin' | 'agent' | 'viewer';
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  agency: Agency | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, name: string, agencyName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [agency, setAgency] = useState<Agency | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('🔄 Getting initial session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('📱 Initial session:', session ? `User: ${session.user?.email}` : 'No session');
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
        
      } catch (error) {
        console.error('💥 Error in getInitialSession:', error);
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Loading profile for user:', session.user.email);
          await loadUserProfile(session.user.id);
        } else {
          console.log('🚪 No user - clearing profile data');
          setProfile(null);
          setAgency(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      console.log('📋 Loading user profile for:', userId);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile loading timeout')), 10000)
      );

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Race between query and timeout
      const { data: profileData, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (profileError) {
        console.error('❌ Error loading profile:', profileError);
        console.log('⚠️ Profile not found for user:', userId);
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.log('⚠️ No profile found for user:', userId);
        setLoading(false);
        return;
      }

      console.log('✅ Profile loaded:', profileData.name, profileData.role);
      setProfile(profileData);

      // Get agency data
      if (profileData?.agency_id) {
        console.log('🏢 Loading agency:', profileData.agency_id);
        
        const agencyTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Agency loading timeout')), 5000)
        );

        const agencyPromise = supabase
          .from('agencies')
          .select('*')
          .eq('id', profileData.agency_id)
          .single();

        try {
          const { data: agencyData, error: agencyError } = await Promise.race([
            agencyPromise,
            agencyTimeoutPromise
          ]) as any;

          if (agencyError) {
            console.error('❌ Error loading agency:', agencyError);
          } else {
            console.log('✅ Agency loaded:', agencyData.name);
            setAgency(agencyData);
          }
        } catch (agencyTimeoutError) {
          console.error('⏰ Agency loading timeout');
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('💥 Error in loadUserProfile:', error);
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string, agencyName: string) => {
    console.log('🔄 Starting signup process...', { email, name, agencyName });
    
    try {
      setLoading(true);

      // Step 1: Sign up user with Supabase Auth
      console.log('📝 Step 1: Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('❌ Auth signup failed:', authError);
        setLoading(false);
        return { error: authError };
      }

      if (!authData.user) {
        console.error('❌ No user returned from auth signup');
        setLoading(false);
        return { error: new Error('No user returned from signup') };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Check if we got a session (should happen if email confirmation is disabled)
      if (!authData.session) {
        console.warn('⚠️ No session returned - email confirmation might be enabled');
        setLoading(false);
        return { 
          error: { 
            message: 'Please check if email confirmation is disabled in your Supabase dashboard under Authentication > Providers > Email',
            requiresEmailConfirmation: true 
          }
        };
      }

      console.log('✅ Session created - email confirmation is disabled');

      // Step 2: Create agency
      console.log('🏢 Step 2: Creating agency...');
      const { data: agencyData, error: agencyError } = await supabase
        .from('agencies')
        .insert([{ name: agencyName }])
        .select()
        .single();

      if (agencyError) {
        console.error('❌ Agency creation failed:', agencyError);
        setLoading(false);
        return { error: new Error(`Failed to create agency: ${agencyError.message}`) };
      }

      console.log('✅ Agency created:', agencyData.id);

      // Step 3: Create user profile
      console.log('👤 Step 3: Creating user profile...');
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          agency_id: agencyData.id,
          name,
          role: 'admin'
        }]);

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        setLoading(false);
        return { error: new Error(`Failed to create profile: ${profileError.message}`) };
      }

      console.log('✅ User profile created');
      console.log('🎉 Signup completed successfully!');
      
      // Profile will be loaded automatically by the auth state change listener
      return { error: null };
      
    } catch (error) {
      console.error('💥 Signup process failed:', error);
      setLoading(false);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('🔑 Attempting sign in for:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('❌ Sign in failed:', error);
        setLoading(false);
      } else {
        console.log('✅ Sign in successful');
      }
      
      return { error };
    } catch (error) {
      console.error('💥 Sign in error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signOut = async () => {
    console.log('🚪 Signing out...');
    setLoading(true);
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('❌ Error signing out:', error);
    } else {
      console.log('✅ Signed out successfully');
    }
    
    setUser(null);
    setProfile(null);
    setAgency(null);
    setSession(null);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { error: new Error('No user logged in') };
    }

    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return { error };
      }

      setProfile(data);
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    profile,
    agency,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};