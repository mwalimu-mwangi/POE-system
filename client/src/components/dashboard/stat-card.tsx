import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
  };
  className?: string;
  iconColor?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  iconColor = "text-primary",
}: StatCardProps) {
  return (
    <div className={cn("bg-white rounded-lg border border-neutral-200 shadow-sm p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-neutral-500 font-medium text-sm">{title}</h3>
        <span className={cn("inline-flex items-center justify-center p-2 bg-opacity-10 rounded-full", iconColor, `bg-${iconColor.split('-')[1]}`)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-neutral-900">{value}</p>
          <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>
        </div>
        {trend && (
          <p className={cn(
            "text-sm font-medium flex items-center",
            trend.positive && "text-secondary",
            trend.neutral && "text-neutral-400",
            !trend.positive && !trend.neutral && "text-warning"
          )}>
            {trend.positive ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ) : trend.neutral ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            )}
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
