import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// --- Date Carousel Filter ---
function DateCarousel({ dates, selectedDate, onDateSelect }: { dates: string[], selectedDate: string, onDateSelect: (date: string) => void }) {
    if (!dates.length) return null;

    return (
        <div className="relative">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
                <div className="pl-1"></div>
                {dates.map((dateStr) => {
                const dateObj = parseISO(dateStr);
                const isSelected = dateStr === selectedDate;
                return (
                    <button
                    key={dateStr}
                    onClick={() => onDateSelect(dateStr)}
                    className={`flex-shrink-0 w-14 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-200
                        ${
                        isSelected
                            ? "bg-slate-900 dark:bg-slate-600 text-white shadow-md scale-105"
                            : "bg-card dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                    >
                    <span
                        className={`text-xs font-semibold ${
                        isSelected ? "text-slate-100" : "text-slate-500 dark:text-slate-400"
                        }`}
                    >
                        {format(dateObj, "EEE", { locale: fr })
                        .charAt(0)
                        .toUpperCase() +
                        format(dateObj, "EEE", { locale: fr }).slice(1)}
                    </span>
                    <span
                        className={`text-2xl font-bold ${
                        isSelected ? "text-yellow-200" : "text-slate-900 dark:text-slate-200"
                        }`}
                    >
                        {format(dateObj, "dd", { locale: fr })}
                    </span>
                    <span
                        className={`text-xs font-semibold ${
                        isSelected ? "text-slate-100" : "text-slate-500 dark:text-slate-400"
                        }`}
                    >
                        {format(dateObj, "MMM", { locale: fr })
                        .charAt(0)
                        .toUpperCase() +
                        format(dateObj, "MMM", { locale: fr }).slice(1)}
                    </span>
                    </button>
                );
                })}
            </div>
        </div>

    );
}

export default DateCarousel;