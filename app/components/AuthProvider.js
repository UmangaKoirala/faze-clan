"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { browserSupabase } from "@/lib/supabase-browser";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    ready: false,
    error: "",
  });

  useEffect(() => {
    let active = true;
    let subscription;

    function update(session, error = "") {
      if (!active) return;

      setState({
        user: session?.user || null,
        ready: true,
        error,
      });
    }

    try {
      const client = browserSupabase();

      subscription = client.auth.onAuthStateChange(
        (_event, session) => {
          update(session);
        }
      ).data.subscription;

      client.auth
        .getSession()
        .then(({ data, error }) => {
          update(data.session, error?.message || "");
        })
        .catch((error) => {
          update(null, error.message);
        });
    } catch (error) {
      Promise.resolve().then(() => {
        update(null, error.message);
      });
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const api = useCallback(async (url, options = {}) => {
    const { data, error } =
      await browserSupabase().auth.getSession();

    if (error) throw error;

    const headers = new Headers(options.headers);

    if (data.session) {
      headers.set(
        "Authorization",
        `Bearer ${data.session.access_token}`
      );
    }

    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store",
    });

    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.error || "Request failed.");
    }

    return body;
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, api }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
