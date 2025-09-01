'use client';
import { useAudienceStore } from "@/store/audience.store";
import { SoccerBallIcon, DesktopIcon } from "@phosphor-icons/react";

export const AudienceToggle = () => {
  const isFan = useAudienceStore((state) => state.isFan);
  const toggleIsFan = useAudienceStore((state) => state.toggleIsFan);

  const options = [
    {
      label: "Fans",
      value: true,
      icon: <SoccerBallIcon size={20} weight="duotone" />,
    },
    {
      label: "Systeme",
      value: false,
      icon: <DesktopIcon size={20} weight="duotone" />,
    },
  ];

  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-200 border border-slate-300 transition-all duration-200 ease-in-out">
      {options.map(({ label, value, icon }) => {
        const active = isFan === value;
        return (
          <button
            key={label}
            onClick={() => toggleIsFan()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-white shadow-md text-slate-800"
                : "text-slate-600 hover:text-slate-800 hover:bg-white/70"
            }`}
          >
            <span className="hidden lg:inline">{label}</span>
            <span className="lg:hidden">{icon}</span>
          </button>
        );
      })}
    </div>
  );
};
