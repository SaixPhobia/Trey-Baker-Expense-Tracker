import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
}

export function StatsCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  trendValue,
  className 
}: StatsCardProps) {
  return (
    <Card className={cn("border-none shadow-sm hover:shadow-md transition-shadow duration-300", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground font-sans tracking-wide uppercase text-[10px]">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary/70" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-serif text-primary">{value}</div>
        {(description || trendValue) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            {trendValue && (
              <span className={cn(
                "font-medium",
                trend === "up" && "text-emerald-600",
                trend === "down" && "text-rose-600",
              )}>
                {trendValue}
              </span>
            )}
            <span className="opacity-80 font-light italic">{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
