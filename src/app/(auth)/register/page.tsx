"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
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
