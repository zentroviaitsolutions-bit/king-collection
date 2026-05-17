"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function ensureProfile(currentUser) {
    if (!currentUser?.id) return null;

    const fullName =
      currentUser.user_metadata?.full_name ||
      currentUser.user_metadata?.name ||
      "";

    const email = currentUser.email || "";

    const { error: upsertError } = await supabase.from("profiles").upsert({
      id: currentUser.id,
      full_name: fullName,
      email,
    });

    if (upsertError) {
      console.error("Profile upsert error:", upsertError.message);
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();

    if (error) {
      console.error("Fetch profile error:", error.message);
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data;
  }

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Fetch profile error:", error.message);
      setProfile(null);
      return null;
    }

    setProfile(data || null);
    return data;
  }

  useEffect(() => {
    async function getInitialSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const currentUser = session?.user || null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          ensureProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Initial session error:", error);
        setLoading(false);
      }
    }

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        const currentUser = session?.user || null;
        setUser(currentUser);
        setLoading(false);

        if (currentUser) {
          ensureProfile(currentUser);
        } else {
          setProfile(null);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signUp(email, password, fullName = "") {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanName,
        },
      },
    });

    if (error) throw error;

    if (data?.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: cleanName,
        email: data.user.email,
      });

      if (profileError) {
        console.error("Profile upsert error:", profileError.message);
      }

      await fetchProfile(data.user.id);
    }

    return data;
  }

  async function signIn(email, password) {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) throw error;

    if (data?.user) {
      await ensureProfile(data.user);
    }

    return data;
  }

  async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });

    if (error) throw error;
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    setProfile(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
