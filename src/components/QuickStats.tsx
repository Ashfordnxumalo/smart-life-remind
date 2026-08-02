import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, Calendar, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReminderFilter = "today" | "week" | "overdue" | "completed" | "assigned";

export interface ReminderStats {
  todayCount: number;
  weekCount: number;
  overdueCount: number;
  completedCount: number;
  assignedCount: number;
}

interface QuickStatsProps {
  stats: ReminderStats;
  /** null shows the default dashboard rather than a filtered list. */
  active: ReminderFilter | null;
  onSelect: (filter: ReminderFilter | null) => void;
}

export const QuickStats = ({ stats, active, onSelect }: QuickStatsProps) => {
  const items: Array<{
    id: ReminderFilter;
    title: string;
    value: number;
    icon: typeof Calendar;
    color: string;
    bgColor: string;
  }> = [
    {
      id: "today",
      title: "Today",
      value: stats.todayCount,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      id: "week",
      title: "This Week",
      value: stats.weekCount,
      icon: Clock,
      color: "text-category-subscription",
      bgColor: "bg-category-subscription/10",
    },
    {
      id: "overdue",
      title: "Overdue",
      value: stats.overdueCount,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
    },
    {
      id: "completed",
      title: "Completed",
      value: stats.completedCount,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      id: "assigned",
      title: "Assigned",
      value: stats.assignedCount,
      icon: Users,
      color: "text-category-personal",
      bgColor: "bg-category-personal/10",
    },
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((stat) => {
          const Icon = stat.icon;
          const isActive = active === stat.id;

          return (
            <button
              key={stat.id}
              type="button"
              // Selecting the active row again clears it, so there's a way back
              // to the default view without hunting for a reset control.
              onClick={() => onSelect(isActive ? null : stat.id)}
              aria-pressed={isActive}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-2 py-2 text-left transition-colors",
                isActive ? "bg-accent" : "hover:bg-muted/60"
              )}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.bgColor}`}
                >
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-sm font-medium">{stat.title}</span>
              </div>
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
};
