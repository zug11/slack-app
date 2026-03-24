export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#4a154b]">
      <div className="mb-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white/20 text-white font-bold text-2xl flex items-center justify-center mx-auto mb-4">
          S
        </div>
        <h1 className="text-white text-2xl font-bold">Slack</h1>
      </div>
      <div className="w-full max-w-[400px] bg-white rounded-xl shadow-2xl p-8">
        {children}
      </div>
    </div>
  );
}
