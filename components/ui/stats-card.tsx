import { LucideIcon } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import { Skeleton } from "./skeleton";


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
  loading?: boolean;
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
  loading = false
}) => {

  const trendDirection = !trend ? "neutral" :
                          trend.value > 0 ? "up":
                          trend.value < 0 ? "down" : "neutral";
  const cardContent = (
    <div
      className={clsx(
        "bg-surface p-6 rounded-lg shadow-md transition-transform hover:scale-[1.02]",
        layout === "horizontal" && "flex items-center justify-between gap-4"
      )}
    >
      <div className="flex flex-col">
        <p className="text-sm font-medium text-ink-muted">{title}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        {description && <p className="text-xs text-ink-muted mt-1">{description}</p>}
        {trend && (
          <div className="flex items-center mt-2 text-xs text-ink-muted">
            <span
              className={clsx("font-bold", {
                "text-positive": trendDirection === "up",
                "text-negative": trendDirection === "down",
                "text-ink-subtle": trendDirection === "neutral",
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
            "bg-positive-soft": variant === "success",
            "bg-negative-soft": variant === "danger",
            "bg-surface-sunk": variant === "neutral",
          },
          iconPosition === "left" && layout === "horizontal" && "order-first"
        )}
      >
        <Icon
          className={clsx("w-5 h-5", {
            "text-positive": variant === "success",
            "text-negative": variant === "danger",
            "text-ink-muted": variant === "neutral",
          })}
        />
      </div>
    </div>
  );

  const skeletonContent = (
    <div
      className={clsx(
        "bg-surface p-6 rounded-lg shadow-md transition-transform hover:scale-[1.02]",
        layout === "horizontal" && "flex items-center justify-between gap-4"
      )}
    >
      <div className="flex flex-col w-full">
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-3 w-20 mb-2" />
        <Skeleton className="h-3 w-28" />
      </div>
      <div
        className={clsx(
          "p-2 rounded-md",
          "bg-surface-sunk",
          iconPosition === "left" && layout === "horizontal" && "order-first"
        )}
      >
        <Skeleton className="w-5 h-5 rounded" />
      </div>
    </div>
  );

  if (loading) return skeletonContent;
  return href ? <Link href={href}>{cardContent}</Link> : cardContent;
};
