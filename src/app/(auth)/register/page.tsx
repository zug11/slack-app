"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleGoogleSignUp() {
    setError("");
    setGoogleLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch {
      setError("Something went wrong");
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-[22px] font-bold text-[#1d1c1d] text-center mb-1">
        Create your account
      </h2>
      <p className="text-[15px] text-[#616061] text-center mb-6">
        Get started with your team
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#e01e5a] rounded-lg text-[13px]">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-[15px] font-medium text-[#1d1c1d]">
          {googleLoading ? "Signing up..." : "Continue with Google"}
        </span>
      </button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-[13px]">
          <span className="px-4 bg-white text-[#616061]">OR</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
            placeholder="name@work-email.com"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
            Username
          </label>
          <input
            type="text"
            value={form.username}
            onChange={(e) => updateField("username", e.target.value)}
            required
            minLength={3}
            maxLength={50}
            pattern="^[a-zA-Z0-9_]+$"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
            placeholder="johndoe"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
            Display name
          </label>
          <input
            type="text"
            value={form.displayName}
            onChange={(e) => updateField("displayName", e.target.value)}
            required
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label className="block text-[13px] font-medium text-[#1d1c1d] mb-1">
            Password
          </label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => updateField("password", e.target.value)}
            required
            minLength={8}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-[15px] text-[#1d1c1d] focus:outline-none focus:border-[#1264a3] focus:ring-1 focus:ring-[#1264a3] transition-all"
            placeholder="At least 8 characters"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#4a154b] text-white rounded-lg hover:bg-[#3f0e40] disabled:opacity-50 font-medium text-[15px] transition-colors"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[#616061]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#1264a3] hover:underline font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
