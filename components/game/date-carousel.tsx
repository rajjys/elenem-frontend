import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

// --- Date Carousel Filter ---
function DateCarousel({ dates, selectedDate, onDateSelect }: { dates: string[], selectedDate: string, onDateSelect: (date: string) => void }) {
    if (!dates.length) return null;

    return (
        <div className="relative">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 no-scrollbar">
                {dates.map(dateStr => {
                    const dateObj = parseISO(dateStr);
                    const isSelected = dateStr === selectedDate;
                    return (
                        <button
                            key={dateStr}
                            onClick={() => onDateSelect(dateStr)}
                            className={`flex-shrink-0 w-14 h-20 rounded-lg flex flex-col items-center justify-center transition-all duration-200
                                ${isSelected ? 'bg-gray-600 text-gray-200 shadow-md scale-105' : 'bg-card hover:bg-muted'}`}
                        >
                            <span className={`text-xs font-semibold ${isSelected? "text-gray-100" : "text-gray-500"}`}>{format(dateObj, 'EEE', { locale: fr }).charAt(0).toUpperCase() + format(dateObj, 'EEE', { locale: fr }).slice(1)}</span>
                            <span className={`text-2xl font-bold ${isSelected? "text-yellow-100" : "text-gray-800"}`}>{format(dateObj, 'dd', { locale: fr })}</span>
                            <span className={`text-xs font-semibold ${isSelected? "text-gray-100" : "text-gray-500"}`}>{format(dateObj, 'MMM',{ locale: fr }).charAt(0).toUpperCase() + format(dateObj, 'MMM').slice(1)}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default DateCarousel;