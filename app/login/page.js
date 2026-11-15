"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { browserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "../components/AuthProvider";

const MIN_PASSWORD = 8;

const TITLES = {
  signin: "Welcome back, scout",
  signup: "Join the scouting league",
  forgot: "Reset your password",
};

// Supabase's built-in email service only sends a few emails per hour.
function friendly(error) {
  if (/rate limit/i.test(error.message)) {
    return "Too many emails were sent recently. Wait about an hour and try again.";
  }

  return error.message;
}

export default function LoginPage() {
  const router = useRouter();
  const {
    user,
    ready,
    recovery,
    endRecovery,
    error: authError,
  } = useAuth();

  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function switchMode(next) {
    setMode(next);
    setPassword("");
    setMessage("");
    setError("");
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const client = browserSupabase();

      if (mode === "forgot") {
        const { error } = await client.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/login` }
        );

        if (error) throw error;

        // Same message whether or not the account exists,
        // so the form cannot be used to check who has signed up.
        setMessage(
          "If an account uses that email, a reset link is on its way. Open it on this device to choose a new password."
        );
        return;
      }

      if (mode === "signup" && !name.trim()) {
        throw new Error("Enter a display name.");
      }

      const result =
        mode === "signup"
          ? await client.auth.signUp({
              email: email.trim(),
              password,
              options: {
                data: {
                  display_name: name.trim(),
                },
                emailRedirectTo:
                  `${window.location.origin}/login`,
              },
            })
          : await client.auth.signInWithPassword({
              email: email.trim(),
              password,
            });

      if (result.error) throw result.error;

      if (mode === "signup" && !result.data.session) {
        setMessage(
          "Check your email and open the confirmation link. Then sign in here."
        );
      } else {
        router.push("/draft");
      }
    } catch (error) {
      setError(friendly(error));
    } finally {
      setBusy(false);
    }
  }

  async function saveNewPassword(event) {
    event.preventDefault();
    setMessage("");
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      const { error } = await browserSupabase().auth.updateUser({
        password,
      });

      if (error) throw error;

      endRecovery();
      setPassword("");
      setConfirm("");
      router.push("/draft");
    } catch (error) {
      setError(friendly(error));
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded border border-[#10364c]/40 bg-transparent p-3";

  if (!ready) {
    return (
      <div className="py-8">
        Checking session…
      </div>
    );
  }

  // The user opened a password reset link: Supabase signed them in
  // for this one purpose, so ask for the new password now.
  if (user && recovery) {
    return (
      <section className="mx-auto max-w-md py-10">
        <h1 className="font-display text-4xl">
          Choose a new password
        </h1>

        <p className="mt-4">
          For {user.email}. You will stay signed in after
          you save it.
        </p>

        <form onSubmit={saveNewPassword} className="mt-6 space-y-4">
          <label className="block">
            New password
            <input
              required
              type="password"
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block">
            Type it again
            <input
              required
              type="password"
              minLength={MIN_PASSWORD}
              autoComplete="new-password"
              value={confirm}
              onChange={(event) =>
                setConfirm(event.target.value)
              }
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="text-red-800">
              {error}
            </p>
          )}

          <button
            disabled={busy}
            className="od-button disabled:opacity-50"
          >
            {busy ? "Saving…" : "Save new password"}
          </button>
        </form>
      </section>
    );
  }

  if (user) {
    return (
      <div className="py-8">
        <h1 className="font-display text-3xl">
          You are signed in.
        </h1>

        <Link href="/draft" className="od-button mt-6">
          Continue to your squad →
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-md py-10">
      <h1 className="font-display text-4xl">
        {TITLES[mode]}
      </h1>

      <p className="mt-4">
        {mode === "forgot"
          ? "Enter the email you signed up with and we will send you a link to choose a new password."
          : "Create an account to keep your squad under your name."}
      </p>

      {authError && (
        <p role="alert" className="mt-4 text-red-800">
          {authError}
        </p>
      )}

      <form onSubmit={submit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <label className="block">
            Display name
            <input
              required
              maxLength={24}
              autoComplete="nickname"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              className={inputClass}
            />
          </label>
        )}

        <label className="block">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            className={inputClass}
          />
        </label>

        {mode !== "forgot" && (
          <label className="block">
            Password
            <input
              required
              type="password"
              minLength={MIN_PASSWORD}
              autoComplete={
                mode === "signup"
                  ? "new-password"
                  : "current-password"
              }
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              className={inputClass}
            />
          </label>
        )}

        {mode === "signin" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => switchMode("forgot")}
            className="text-sm underline disabled:opacity-50"
          >
            Forgot password?
          </button>
        )}

        {error && (
          <p role="alert" className="text-red-800">
            {error}
          </p>
        )}

        {message && (
          <p role="status">{message}</p>
        )}

        <button
          disabled={busy}
          className="od-button disabled:opacity-50"
        >
          {busy
            ? "Please wait…"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        disabled={busy}
        className="mt-5 block underline disabled:opacity-50"
        onClick={() =>
          switchMode(mode === "signin" ? "signup" : "signin")
        }
      >
        {mode === "signin"
          ? "New here? Create an account"
          : "Back to sign in"}
      </button>
    </section>
  );
}
