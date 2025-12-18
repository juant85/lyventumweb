import React, { createContext, useState, useContext, ReactNode, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AppRoute } from '../types';
import { supabase } from '../supabaseClient';
import { User as SupabaseUser, PostgrestError } from '@supabase/supabase-js';
import { Database } from '../database.types';
import { toast } from 'react-hot-toast';

interface AuthContextType {
  currentUser: User | null;
  supabaseUser: SupabaseUser | null;
  loadingAuth: boolean;
  authOpError: string | null;
  profileWarning: string | null;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (email: string, pass: string) => Promise<boolean>;
  loginWithMagicLink: (email: string, eventId?: string | null) => Promise<{ success: boolean, message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type ProfileQueryResponse = Pick<Database['public']['Tables']['profiles']['Row'], 'role' | 'username'>;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authOpError, setAuthOpError] = useState<string | null>(null);
  const [profileWarning, setProfileWarning] = useState<string | null>(null);
  const navigate = useNavigate();

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);


  const processUserSession: (supaUser: SupabaseUser | null, isExplicitAuthAction?: boolean) => Promise<void> = useCallback(async (supaUser, isExplicitAuthAction = false) => {
    console.log(`[AuthContext] processUserSession: START. SupaUser ID: ${supaUser?.id}, ExplicitAuth: ${isExplicitAuthAction}`);
    setLoadingAuth(true);
    if (isExplicitAuthAction) setAuthOpError(null);
    setProfileWarning(null);

    try {
      setSupabaseUser(supaUser);

      if (supaUser) {
        // THE NEW, ROBUST LOGIC TO CHECK FOR LOGIN INTENT FROM SESSION METADATA
        const loginType = supaUser.app_metadata?.login_type;

        if (loginType === 'attendee') {
          // This is an explicit attendee login. Force the role and skip the organizer check.
          console.log("[AuthContext] processUserSession: 'login_type=attendee' detected from app_metadata. Forcing attendee role.");
          const attendeeUser: User = { id: supaUser.id, username: supaUser.email || 'Attendee', role: 'attendee' as const, email: supaUser.email };
          setCurrentUser(attendeeUser);

          // This update is not possible from the client and causes type errors.
          // app_metadata is read-only from the client. The one-time use during login is sufficient.
          // await supabase.auth.updateUser({ data: { login_type: null } });

          // Force navigation to the correct portal, preventing race conditions.
          navigate(AppRoute.AttendeePortalDashboard, { replace: true });

        } else {
          // --- ORIGINAL LOGIC for organizers/admins ---
          console.log(`[AuthContext] processUserSession: No special login type. Checking for organizer profile...`);
          const { data: profileData, error: profileErrorObj } = await (supabase
            .from('profiles') as any)
            .select('role, username')
            .eq('user_id', supaUser.id)
            .single();

          if (profileData) {
            // USER IS AN ORGANIZER/ADMIN
            console.log(`[AuthContext] processUserSession: Organizer profile found.`);
            setProfileWarning(null);
            const dbRole = profileData.role;
            let appRole: User['role'] = (dbRole === 'superadmin' || dbRole === 'admin' || dbRole === 'organizer') ? dbRole : 'organizer';
            const finalAppUser: User = { id: supaUser.id, username: profileData.username || supaUser.email || `User-${supaUser.id.substring(0, 6)}`, role: appRole, email: supaUser.email } as User;
            setCurrentUser(finalAppUser);

          } else if (profileErrorObj && profileErrorObj.code !== 'PGRST116') {
            // A real database error occurred, not just "not found"
            const warningMessage = `Could not load your user profile due to a database error. (Error: ${profileErrorObj.message})`;
            setProfileWarning(warningMessage);
            const fallbackUser: User = { id: supaUser.id, username: supaUser.email || `User-${supaUser.id.substring(0, 6)}`, role: 'organizer' as const, email: supaUser.email };
            setCurrentUser(fallbackUser);

          } else {
            // No profile found and no DB error. This user must be an attendee (e.g., if they were created but never logged in via magic link)
            console.log(`[AuthContext] processUserSession: No organizer profile found. Treating as an attendee.`);
            const attendeeUser: User = { id: supaUser.id, username: supaUser.email || 'Attendee', role: 'attendee' as const, email: supaUser.email };
            setCurrentUser(attendeeUser);
          }
        }
      } else {
        console.log("[AuthContext] processUserSession: No Supabase user. Checking for attendee login...");

        // Check for attendee login in localStorage
        const attendeeLogin = localStorage.getItem('attendee_login');
        if (attendeeLogin) {
          try {
            const attendeeData = JSON.parse(attendeeLogin);
            if (attendeeData.attendeeId && attendeeData.eventId) {
              console.log("[AuthContext] Found valid attendee login, creating virtual user");
              // Create virtual user for attendee
              setCurrentUser({
                id: attendeeData.attendeeId,
                email: attendeeData.attendeeEmail || '',
                role: 'attendee',
                username: attendeeData.attendeeName || 'Attendee'
              });
              setLoadingAuth(false);
              return; // Early return to prevent clearing user
            } else {
              console.log("[AuthContext] Invalid attendee login data, clearing");
              localStorage.removeItem('attendee_login');
            }
          } catch (e) {
            console.error("[AuthContext] Error parsing attendee login:", e);
            localStorage.removeItem('attendee_login');
          }
        }

        console.log("[AuthContext] No attendee login found. Clearing local user state.");
        setCurrentUser(null);
      }
    } catch (e: any) {
      console.error("[AuthContext] processUserSession: A critical error occurred.", e);
      setAuthOpError(e.message || "An unknown error occurred during authentication processing.");
      setCurrentUser(null);
      setSupabaseUser(null);
    } finally {
      console.log("[AuthContext] processUserSession: FINISH. Setting loadingAuth to false.");
      setLoadingAuth(false);
    }
  }, [navigate]);

  useEffect(() => {
    console.log("[AuthContext] AuthProvider mounted. Subscribing to onAuthStateChange.");
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("[AuthContext] Initial getSession() call completed. Session:", session);
      processUserSession(session?.user ?? null, false);
    }).catch(err => {
      console.error("[AuthContext] Initial getSession() failed:", err);
      setLoadingAuth(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthContext] onAuthStateChange event: ${event}`, session);
      // We consider TOKEN_REFRESHED as an explicit auth action now, because it contains the new app_metadata
      processUserSession(session?.user ?? null, event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED');
    });

    return () => {
      console.log("[AuthContext] AuthProvider unmounted. Unsubscribing from auth changes.");
      authListener.subscription.unsubscribe();
    };
  }, [processUserSession]);

  const login = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setAuthOpError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) {
      setAuthOpError(error.message);
      return false;
    }
    return true;
  }, []);

  const loginWithMagicLink = useCallback(async (email: string, eventId?: string | null): Promise<{ success: boolean, message: string }> => {
    setAuthOpError(null);

    try {
      // Step 1: Check if the user is an organizer
      const { data: isOrganizer, error: organizerCheckError } = await supabase
        .rpc('check_organizer_exists', { p_email: email });

      if (organizerCheckError) {
        console.error("Error calling check_organizer_exists RPC:", organizerCheckError);
        const errorMessage = "A server error occurred. Please try again.";
        setAuthOpError(errorMessage);
        return { success: false, message: errorMessage };
      }

      if (isOrganizer) {
        const errorMessage = "This email belongs to an organizer. Please use the Organizer Portal to log in.";
        setAuthOpError(errorMessage);
        return { success: false, message: errorMessage };
      }

      // Step 2: Verify the email belongs to a registered attendee
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('attendees')
        .select('id, name, event_id, email')
        .eq('email', email)
        .maybeSingle();

      if (attendeeError) {
        console.error("Error checking attendee:", attendeeError);
        const errorMessage = "A server error occurred. Please try again.";
        setAuthOpError(errorMessage);
        return { success: false, message: errorMessage };
      }

      if (!attendeeData) {
        const errorMessage = "This email is not registered as an attendee for any event.";
        setAuthOpError(errorMessage);
        return { success: false, message: errorMessage };
      }

      // Step 3: Generate and send access code
      const { accessCodeService } = await import('../services/accessCodeService');

      const result = await accessCodeService.createAndSendCode({
        email: attendeeData.email,
        attendeeId: attendeeData.id,
        eventId: eventId || attendeeData.event_id,
      });

      if (result.success) {
        return {
          success: true,
          message: 'Access code sent! Check your email and visit /access to enter your code.',
        };
      } else {
        setAuthOpError(result.message);
        return { success: false, message: result.message };
      }
    } catch (error: any) {
      console.error('Error in loginWithMagicLink:', error);
      const errorMessage = error.message || 'Failed to send access code';
      setAuthOpError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, []);


  const register = useCallback(async (email: string, pass: string): Promise<boolean> => {
    setAuthOpError(null);
    const { error } = await supabase.auth.signUp({ email, password: pass });
    if (error) {
      setAuthOpError(error.message);
      return false;
    }
    return true;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    console.log("[AuthContext] logout called.");
    setCurrentUser(null);
    setSupabaseUser(null);
    setProfileWarning(null);
    setAuthOpError(null);

    // Clear attendee login if exists
    localStorage.removeItem('attendee_login');

    await supabase.auth.signOut();
  }, []);

  const contextValue = useMemo(() => ({
    currentUser,
    supabaseUser,
    loadingAuth,
    authOpError,
    profileWarning,
    login,
    logout,
    register,
    loginWithMagicLink,
  }), [currentUser, supabaseUser, loadingAuth, authOpError, profileWarning, login, logout, register, loginWithMagicLink]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
