"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { browserSupabase } from "@/lib/supabase-browser";

const AuthContext = createContext(null);

// Reads the #... part of an email link before Supabase clears it.
function linkFromEmail() {
  const params = new URLSearchParams(window.location.hash.slice(1));

  return {
    recovery: params.get("type") === "recovery",
    error: params.get("error_description") || "",
  };
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    ready: false,
    error: "",
    recovery: false,
  });

  // True while the user arrived from a password reset link
  // and has not set a new password yet.
  const recoveryRef = useRef(false);

  useEffect(() => {
    let active = true;
    let subscription;

    const link = linkFromEmail();
    if (link.recovery) recoveryRef.current = true;

    function update(session, error = "") {
      if (!active) return;

      if (!session) recoveryRef.current = false;

      setState({
        user: session?.user || null,
        ready: true,
        error,
        recovery: recoveryRef.current,
      });
    }

    try {
      const client = browserSupabase();

      subscription = client.auth.onAuthStateChange(
        (event, session) => {
          if (event === "PASSWORD_RECOVERY") {
            recoveryRef.current = true;
          }

          update(session);
        }
      ).data.subscription;

      client.auth
        .getSession()
        .then(({ data, error }) => {
          update(
            data.session,
            error?.message ||
              (link.error
                ? `That email link did not work: ${link.error}. Request a new one.`
                : "")
          );
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

  const endRecovery = useCallback(() => {
    recoveryRef.current = false;
    setState((previous) => ({ ...previous, recovery: false }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, api, endRecovery }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
