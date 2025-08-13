// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile, Agency } from '../lib/supabase';
import { AgencyService } from '../lib/agencyService';
import { PermissionService, Permission } from '../lib/permissionService';

// Types
export interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  agency: Agency | null;
  session: Session | null;
  permissions: Permission;
  loading: boolean;
  initialized: boolean;
}

export interface AuthContextType extends AuthState {
  // Basic auth
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signUpWithInvitation: (email: string, password: string, name: string, invitationToken: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  
  // Profile management
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
  refreshProfile: () => Promise<void>;
  
  // Super admin functions
  createSuperAdmin: (email: string, password: string, name: string) => Promise<{ error: any }>;
  
  // Permission helpers
  hasPermission: (permission: keyof Permission) => boolean;
  canAccessAgency: (agencyId: string) => boolean;
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
  const [permissions, setPermissions] = useState<Permission>(PermissionService.getPermissions(null));
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (isMounted) {
            setLoading(false);
            setInitialized(true);
          }
          return;
        }

        if (isMounted) {
          console.log('📱 Initial session:', session ? `User: ${session.user?.email}` : 'No session');
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await loadUserData(session.user.id);
          } else {
            setLoading(false);
          }
          
          setInitialized(true);
        }
      } catch (error) {
        console.error('💥 Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('🔄 Auth state changed:', event, session?.user?.email || 'No user');
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('👤 Loading user data for:', session.user.email);
          await loadUserData(session.user.id);
        } else {
          console.log('🚪 No user - clearing data');
          clearUserData();
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadUserData = async (userId: string, retries = 3) => {
    try {
      console.log('📋 Loading user data for:', userId);
      
      for (let i = 0; i < retries; i++) {
        // Load user profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (!profileError && profileData) {
          console.log('✅ Profile loaded:', profileData.name, profileData.role);
          setProfile(profileData);

          // Update permissions
          const userPermissions = PermissionService.getPermissions(profileData);
          setPermissions(userPermissions);

          // Load agency data if user has an agency
          if (profileData.agency_id) {
            console.log('🏢 Loading agency:', profileData.agency_id);
            
            const { data: agencyData, error: agencyError } = await supabase
              .from('agencies')
              .select('*')
              .eq('id', profileData.agency_id)
              .single();

            if (!agencyError && agencyData) {
              console.log('✅ Agency loaded:', agencyData.name);
              setAgency(agencyData);
            } else {
              console.error('❌ Error loading agency:', agencyError);
              setAgency(null);
            }
          } else {
            // Super admin has no agency
            setAgency(null);
          }

          // Update last login
          await supabase
            .from('user_profiles')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', userId);

          setLoading(false);
          return; // Success, exit function
        }

        // If this is not the last retry, wait and try again
        if (i < retries - 1) {
          console.log(`⏳ Profile not found, retrying in ${(i + 1) * 1000}ms...`);
          await new Promise(resolve => setTimeout(resolve, (i + 1) * 1000));
        }
      }

      // All retries failed
      console.error('⚠️ Profile not found after retries for user:', userId);
      setLoading(false);
      
    } catch (error) {
      console.error('💥 Error loading user data:', error);
      setLoading(false);
    }
  };

  const clearUserData = () => {
    setProfile(null);
    setAgency(null);
    setPermissions(PermissionService.getPermissions(null));
    setLoading(false);
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
        // User data will be loaded automatically by the auth state change listener
      }
      
      return { error };
    } catch (error) {
      console.error('💥 Sign in error:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    console.log('🔄 Starting basic signup process...', { email, name });
    
    try {
      setLoading(true);

      // Check if this is the first user (should become super admin)
      const { data: existingProfiles } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      const isFirstUser = !existingProfiles || existingProfiles.length === 0;

      // Sign up user with Supabase Auth
      console.log('📝 Creating auth user...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
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

      // Check if we got a session
      if (!authData.session) {
        console.warn('⚠️ No session returned - email confirmation might be enabled');
        setLoading(false);
        return { 
          error: { 
            message: 'Please check if email confirmation is disabled in your Supabase dashboard under Authentication > Settings > Email Auth > Confirm email',
            requiresEmailConfirmation: true 
          }
        };
      }

      // Create user profile
      const role = isFirstUser ? 'super_admin' : 'viewer'; // Default new users to viewer until invited
      
      console.log('👤 Creating user profile with role:', role);
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          agency_id: null, // No agency for basic signup
          name,
          role
        }])
        .select()
        .single();

      if (profileError) {
        console.error('❌ Profile creation failed:', profileError);
        setLoading(false);
        return { error: new Error(`Failed to create profile: ${profileError.message}`) };
      }

      console.log('✅ User profile created');

      // Set the profile data immediately
      setProfile(profileData);
      setPermissions(PermissionService.getPermissions(profileData));
      setAgency(null); // No agency for basic signup
      setLoading(false);

      if (isFirstUser) {
        console.log('🎉 First user created as super admin!');
      } else {
        console.log('🎉 Basic signup completed successfully!');
      }
      
      return { error: null };
      
    } catch (error) {
      console.error('💥 Signup process failed:', error);
      setLoading(false);
      return { error };
    }
  };

  const signUpWithInvitation = async (email: string, password: string, name: string, invitationToken: string) => {
    console.log('🔄 Starting invitation signup process...', { email, name, invitationToken });
    
    try {
      setLoading(true);

      // Verify invitation token first
      const invitation = await AgencyService.getInvitationByToken(invitationToken);
      if (!invitation) {
        setLoading(false);
        return { error: new Error('Invalid or expired invitation token') };
      }

      if (invitation.email !== email) {
        setLoading(false);
        return { error: new Error('Email does not match invitation') };
      }

      // Sign up user with Supabase Auth
      console.log('📝 Creating auth user with invitation...');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            invitationToken: invitationToken
          }
        }
      });

      if (authError) {
        console.error('❌ Auth signup failed:', authError);
        setLoading(false);
        return { error: authError };
      }

      if (!authData.user || !authData.session) {
        console.error('❌ No user/session returned from auth signup');
        setLoading(false);
        return { error: new Error('Signup failed - no user or session returned') };
      }

      console.log('✅ Auth user created:', authData.user.id);

      // Accept the invitation (this creates the user profile)
      console.log('📨 Accepting invitation...');
      const profile = await AgencyService.acceptInvitation(invitationToken);

      console.log('✅ Invitation accepted, profile created');

      // Load agency data
      if (profile.agency_id) {
        const agency = await AgencyService.getAgencyById(profile.agency_id);
        setAgency(agency);
      }

      // Set the profile data immediately
      setProfile(profile);
      setPermissions(PermissionService.getPermissions(profile));
      setLoading(false);

      console.log('🎉 Invitation signup completed successfully!');
      return { error: null };
      
    } catch (error) {
      console.error('💥 Invitation signup failed:', error);
      setLoading(false);
      return { error };
    }
  };

  const createSuperAdmin = async (email: string, password: string, name: string) => {
    console.log('🔄 Creating super admin...', { email, name });
    
    try {
      setLoading(true);

      // Only existing super admin can create new super admin
      if (profile?.role !== 'super_admin') {
        setLoading(false);
        return { error: new Error('Only super administrators can create new super admins') };
      }

      // Sign up user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });

      if (authError) {
        setLoading(false);
        return { error: authError };
      }

      if (!authData.user) {
        setLoading(false);
        return { error: new Error('No user returned from signup') };
      }

      // Create super admin profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert([{
          id: authData.user.id,
          agency_id: null,
          name,
          role: 'super_admin'
        }]);

      if (profileError) {
        setLoading(false);
        return { error: new Error(`Failed to create super admin profile: ${profileError.message}`) };
      }

      setLoading(false);
      console.log('🎉 Super admin created successfully!');
      return { error: null };
      
    } catch (error) {
      console.error('💥 Super admin creation failed:', error);
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
    setPermissions(PermissionService.getPermissions(null));
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
      setPermissions(PermissionService.getPermissions(data));
      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      await loadUserData(user.id, 1);
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  // Permission helpers
  const hasPermission = (permission: keyof Permission): boolean => {
    return PermissionService.hasPermission(profile, permission);
  };

  const canAccessAgency = (agencyId: string): boolean => {
    return PermissionService.canAccessAgency(profile, agencyId);
  };

  const value = {
    user,
    profile,
    agency,
    session,
    permissions,
    loading,
    initialized,
    signIn,
    signUp,
    signUpWithInvitation,
    signOut,
    updateProfile,
    refreshProfile,
    createSuperAdmin,
    hasPermission,
    canAccessAgency,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};