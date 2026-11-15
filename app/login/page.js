"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { browserSupabase } from "@/lib/supabase-browser";
import { useAuth } from "../components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { user, ready } = useAuth();

  const [signup, setSignup] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");

    try {
      const client = browserSupabase();

      if (signup && !name.trim()) {
        throw new Error("Enter a display name.");
      }

      const result = signup
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

      if (signup && !result.data.session) {
        setMessage(
          "Check your email and open the confirmation link. Then sign in here."
        );
      } else {
        router.push("/draft");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <div className="py-8">
        Checking session…
      </div>
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

  const inputClass =
    "mt-1 w-full rounded border border-[#10364c]/40 bg-transparent p-3";

  return (
    <section className="mx-auto max-w-md py-10">
      <h1 className="font-display text-4xl">
        {signup
          ? "Join the scouting league"
          : "Welcome back, scout"}
      </h1>

      <p className="mt-4">
        Create an account to keep your squad under your name.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-4">
        {signup && (
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

        <label className="block">
          Password
          <input
            required
            type="password"
            minLength={8}
            autoComplete={
              signup ? "new-password" : "current-password"
            }
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            className={inputClass}
          />
        </label>

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
            : signup
              ? "Create account"
              : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        disabled={busy}
        className="mt-5 underline disabled:opacity-50"
        onClick={() => {
          setSignup(!signup);
          setMessage("");
          setError("");
        }}
      >
        {signup
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </section>
  );
}
