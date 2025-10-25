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
    <div className="inline-flex p-1 rounded-xl bg-slate-300 dark:bg-slate-950 border border-slate-300 transition-all duration-200 ease-in-out">
      {options.map(({ label, value, icon }) => {
        const active = isFan === value;
        return (
          <button
            key={label}
            onClick={() => toggleIsFan()}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              active
                ? "bg-white shadow-md text-sky-700 bg-sky-50 dark:text-sky-200 dark:bg-blue-900/50"
                : "text-slate-600 hover:bg-sky-50 hover:text-blue-600 dark:text-gray-200 dark:hover:text-blue-400 dark:hover:bg-slate-900/100"
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
