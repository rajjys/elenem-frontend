import { LucideIcon } from "lucide-react";
import Link from "next/link";

// Assuming these types are defined elsewhere or inline for this example
interface StatCardProps {
    title: string;
    value: string | number;
    description?: string | null;
    trend?: {
        isPositive: boolean;
        value: number;
        timespan: string;
    }
    icon: LucideIcon;
    bgColorClass: string;
    textColorClass: string;
    href: string; // Added href prop
}

export const StatsCard: React.FC<StatCardProps> = ({ title, value, description, trend, icon: Icon, bgColorClass, textColorClass, href }) => {
    return (
        <Link href={href} className="block"> {/* Wrap with Link component */}
            <div className="bg-white p-6 rounded-lg shadow-md transition-transform transform hover:scale-105">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <div className={`p-2 rounded-md ${bgColorClass}`}>
                        <Icon className={`w-5 h-5 ${textColorClass}`} />
                    </div>
                </div>
                <div className=''>
                    <p className="text-2xl font-bold mt-1">{value}</p>
                </div>
                <div>
                    {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2 text-gray-500">
            <span className={`text-xs font-bold ${
              trend.isPositive ? "text-green-600" : "text-red-500"
            }`}>
              {trend.isPositive ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">from last {trend.timespan}</span>
          </div>
        )}
                </div>
            </div>
        </Link>
    );
};