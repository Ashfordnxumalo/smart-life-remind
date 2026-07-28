import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react";

export interface ReminderStats {
  todayCount: number;
  weekCount: number;
  overdueCount: number;
  completedCount: number;
}

interface QuickStatsProps {
  stats: ReminderStats;
}

export const QuickStats = ({ stats }: QuickStatsProps) => {
  const items = [
    {
      title: "Today",
      value: stats.todayCount,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "This Week",
      value: stats.weekCount,
      icon: Clock,
      color: "text-category-subscription",
      bgColor: "bg-category-subscription/10"
    },
    {
      title: "Overdue",
      value: stats.overdueCount,
      icon: AlertTriangle,
      color: "text-destructive",
      bgColor: "bg-destructive/10"
    },
    {
      title: "Completed",
      value: stats.completedCount,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10"
    }
  ];

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <span className="text-sm font-medium">{stat.title}</span>
              </div>
              <span className="text-xl font-bold text-foreground">{stat.value}</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
