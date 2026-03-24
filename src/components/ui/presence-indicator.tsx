"use client";

type Status = "online" | "idle" | "dnd" | "offline";

const statusColors: Record<Status, string> = {
  online: "bg-[#007a5a] shadow-[0_0_4px_rgba(0,122,90,0.8)]",
  idle: "bg-[#e8912d] shadow-[0_0_4px_rgba(232,145,45,0.8)]",
  dnd: "bg-[#e01e5a] shadow-[0_0_4px_rgba(224,30,90,0.8)]",
  offline: "bg-gray-400",
};

const sizeClasses = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3 h-3",
};

export function PresenceIndicator({
  status,
  size = "md",
  borderColor = "white",
}: {
  status: Status;
  size?: "sm" | "md" | "lg";
  borderColor?: string;
}) {
  const borderStyle =
    borderColor === "sidebar"
      ? "border-[2px] border-[#3f0e40]"
      : "border-[2px] border-white";

  return (
    <div
      className={`rounded-full ${statusColors[status]} ${sizeClasses[size]} ${borderStyle}`}
      title={status}
    />
  );
}
