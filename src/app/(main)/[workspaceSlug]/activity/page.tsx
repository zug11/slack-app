import { Bell } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white text-[#616061]">
      <div className="w-16 h-16 rounded-2xl bg-[#f0f4f8] flex items-center justify-center mb-4">
        <Bell size={32} className="text-[#616061]" />
      </div>
      <h2 className="text-[22px] font-bold text-[#1d1c1d] mb-2">Activity</h2>
      <p className="text-[15px] max-w-md text-center">
        Mentions, reactions, and replies to your messages will appear here. You&apos;re all caught up!
      </p>
    </div>
  );
}
