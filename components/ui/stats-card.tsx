import { LucideIcon } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";


interface StatCardProps {
  title: string;
  value: string | number;
  description?: string | null;
  trend?: {
    value: number;
    timespan?: string;
  };
  icon: LucideIcon;
  variant?: "success" | "danger" | "neutral";
  href?: string;
  layout?: "vertical" | "horizontal";
  iconPosition?: "left" | "right";
}

export const StatsCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  icon: Icon,
  variant = "neutral",
  href,
  layout = "horizontal",
  iconPosition = "right",
}) => {

  const trendDirection = !trend ? "neutral" :
                          trend.value > 0 ? "up":
                          trend.value < 0 ? "down" : "neutral";
  const cardContent = (
    <div
      className={clsx(
        "bg-white p-6 rounded-lg shadow-md transition-transform hover:scale-[1.02]",
        layout === "horizontal" && "flex items-center justify-between gap-4"
      )}
    >
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2 text-xs text-gray-500">
            <span
              className={clsx("font-bold", {
                "text-green-600": trendDirection === "up",
                "text-red-500": trendDirection === "down",
                "text-gray-400": trendDirection === "neutral",
              })}
            >
              {trendDirection === "up" && "+"}
              {trendDirection === "down" && "-"}
              {trend.value.toFixed(1)}%
            </span>
            {trend.timespan && <span className="ml-1">from last {trend.timespan}</span>}
          </div>
        )}
      </div>

      <div
        className={clsx(
          "p-2 rounded-md",
          {
            "bg-green-100": variant === "success",
            "bg-red-100": variant === "danger",
            "bg-gray-100": variant === "neutral",
          },
          iconPosition === "left" && layout === "horizontal" && "order-first"
        )}
      >
        <Icon
          className={clsx("w-5 h-5", {
            "text-green-600": variant === "success",
            "text-red-500": variant === "danger",
            "text-gray-500": variant === "neutral",
          })}
        />
      </div>
    </div>
  );

  return href ? <Link href={href}>{cardContent}</Link> : cardContent;
};
