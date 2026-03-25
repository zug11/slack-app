import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4a154b]">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
          S
        </div>
        <h1 className="text-white text-2xl font-bold">Slack</h1>
      </div>
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-8 text-center">
        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-6 h-6 text-[#e01e5a]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h2 className="text-[22px] font-bold text-[#1d1c1d] mb-2">
          Authentication Error
        </h2>
        <p className="text-[15px] text-[#616061] mb-6">
          Something went wrong during sign in. Please try again.
        </p>
        <Link
          href="/login"
          className="inline-block w-full py-2.5 px-4 bg-[#4a154b] text-white rounded-lg hover:bg-[#3f0e40] font-medium text-[15px] transition-colors"
        >
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
