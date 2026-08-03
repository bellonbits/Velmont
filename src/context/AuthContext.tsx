import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api, ApiError } from "../lib/api";
import { supabase } from "../lib/supabaseClient";
import type { User } from "../lib/apiTypes";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    name: string,
    email: string,
    password: string,
    securityQuestion: string,
    securityAnswer: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  updateSecurityQuestion: (securityQuestion: string, securityAnswer: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => (session ? refreshMe() : setUser(null)))
      .finally(() => setLoading(false));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") setUser(null);
    });
    return () => subscription.unsubscribe();
  }, [refreshMe]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new ApiError(error.message, 401);
    await api.post("/auth/sync-admin");
    const res = await api.get<{ user: User }>("/auth/me");
    setUser(res.user);
  }, []);

  const signUp = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      securityQuestion: string,
      securityAnswer: string,
    ) => {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw new ApiError(error.message, 400);

      const res = await api.post<{ user: User }>("/auth/profile", {
        name,
        securityQuestion,
        securityAnswer,
      });
      setUser(res.user);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    const res = await api.put<{ user: User }>("/auth/profile", { name });
    setUser(res.user);
  }, []);

  const uploadAvatar = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.upload<{ user: User }>("/auth/avatar", formData);
    setUser(res.user);
  }, []);

  const updateSecurityQuestion = useCallback(
    async (securityQuestion: string, securityAnswer: string) => {
      const res = await api.put<{ user: User }>("/auth/security-question", {
        securityQuestion,
        securityAnswer,
      });
      setUser(res.user);
    },
    [],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        updateProfile,
        uploadAvatar,
        updateSecurityQuestion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
