import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "customer" | "employee" | "admin" | "vendedor";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isLoading: boolean;
  needsPasswordSetup: boolean;
  clearPasswordSetup: () => void;
  signUp: (email: string, password: string, fullName: string, phone?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  isEmployee: boolean;
  isAdmin: boolean;
  isCustomer: boolean;
  isVendedor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsPasswordSetup, setNeedsPasswordSetup] = useState(false);

  const clearPasswordSetup = () => setNeedsPasswordSetup(false);

  const fetchUserData = async (userId: string) => {
    try {
      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      // Fetch roles
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesData) {
        setRoles(rolesData.map((r) => r.role as AppRole));
      }
    } catch (error) {
      // Silent fail in production - user data fetch errors are handled gracefully
      if (import.meta.env.DEV) {
        console.error("Error fetching user data:", error);
      }
    }
  };

  useEffect(() => {
    // Check URL hash for invite/signup tokens on mount
    const hash = window.location.hash;
    if (hash && (hash.includes("type=invite") || hash.includes("type=signup") || hash.includes("type=magiclink") || hash.includes("type=recovery"))) {
      setNeedsPasswordSetup(true);
      // Clean the hash to avoid re-triggering
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "PASSWORD_RECOVERY") {
          setNeedsPasswordSetup(true);
        }

        // Detect invited users: they have invited_role in metadata and arrive via SIGNED_IN
        if (event === "SIGNED_IN" && session?.user?.user_metadata?.invited_role) {
          setNeedsPasswordSetup(true);
        }

        if (session?.user) {
          // Defer Supabase calls with setTimeout
          setTimeout(() => {
            fetchUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
        }
        setIsLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phone?: string) => {
    const redirectUrl = `https://greenpac.com.ar/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          phone: phone || null,
        },
      },
    });

    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isEmployee = hasRole("employee") || hasRole("admin") || hasRole("vendedor");
  const isAdmin = hasRole("admin");
  const isCustomer = hasRole("customer");
  const isVendedor = hasRole("vendedor");

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isLoading,
        needsPasswordSetup,
        clearPasswordSetup,
        signUp,
        signIn,
        signOut,
        hasRole,
        isEmployee,
        isAdmin,
        isCustomer,
        isVendedor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
