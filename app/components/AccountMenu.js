"use client";

import Link from "next/link";
import { useState } from "react";

import { browserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "./AuthProvider";

export default function AccountMenu() {
  const { user, ready, error, recovery } = useAuth();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function logout() {
    setMessage("");
    setBusy(true);

    try {
      const { error } =
        await browserSupabase().auth.signOut();

      if (error) throw error;
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <span className="text-xs">
        Checking session…
      </span>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="text-sm underline">
        Sign in / Sign up
        {error ? " · Setup needed" : ""}
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <span>
        Signed in:{" "}
        {user.user_metadata?.display_name || "Scout"}
      </span>

      {recovery && (
        <Link href="/login" className="font-semibold underline">
          Set your new password →
        </Link>
      )}

      <button
        type="button"
        onClick={logout}
        disabled={busy}
        className="underline disabled:opacity-50"
      >
        {busy ? "Signing out…" : "Sign out"}
      </button>

      {message && (
        <span role="alert">{message}</span>
      )}
    </div>
  );
}
