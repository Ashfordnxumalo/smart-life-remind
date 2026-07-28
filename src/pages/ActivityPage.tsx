import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, CheckCircle, Clock, AlertTriangle, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDistanceToNow, isBefore, parseISO, startOfDay } from "date-fns";
import { useReminders } from "@/hooks/useReminders";
import type { Reminder } from "@/types/reminder";

type ActivityType = "completed" | "created" | "overdue";

interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  timestamp: string;
  category: Reminder["category"];
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case "completed":
      return <CheckCircle className="w-4 h-4 text-success" />;
    case "created":
      return <Calendar className="w-4 h-4 text-primary" />;
    case "overdue":
      return <AlertTriangle className="w-4 h-4 text-destructive" />;
    default:
      return <Activity className="w-4 h-4 text-muted-foreground" />;
  }
};

const getActivityBadge = (type: ActivityType) => {
  switch (type) {
    case "completed":
      return <Badge className="bg-success/10 text-success">Completed</Badge>;
    case "created":
      return <Badge className="bg-primary/10 text-primary">Created</Badge>;
    case "overdue":
      return <Badge className="bg-destructive/10 text-destructive">Overdue</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
  }
};

export default function ActivityPage() {
  const { reminders, loading, stats } = useReminders();

  const activities = useMemo<ActivityItem[]>(() => {
    const today = startOfDay(new Date());
    const items: ActivityItem[] = [];

    for (const r of reminders) {
      if (r.completed && r.completedAt) {
        items.push({
          id: `${r.id}-completed`,
          type: "completed",
          title: `${r.title} completed`,
          description: r.description,
          timestamp: r.completedAt,
          category: r.category,
        });
      } else if (!r.completed && isBefore(parseISO(r.dueDate), today)) {
        items.push({
          id: `${r.id}-overdue`,
          type: "overdue",
          title: `${r.title} overdue`,
          description: r.description,
          timestamp: r.updatedAt || r.createdAt,
          category: r.category,
        });
      }

      if (r.createdAt) {
        items.push({
          id: `${r.id}-created`,
          type: "created",
          title: `${r.title} added`,
          description: r.description,
          timestamp: r.createdAt,
          category: r.category,
        });
      }
    }

    return items
      .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))
      .slice(0, 25);
  }, [reminders]);

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Recent Activity
                </h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Activity Stats */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm font-medium">Completed</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stats.completedCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Total</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{reminders.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Clock className="w-4 h-4 text-warning" />
                    </div>
                    <span className="text-sm font-medium">This Week</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stats.weekCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                    </div>
                    <span className="text-sm font-medium">Overdue</span>
                  </div>
                  <span className="text-xl font-bold text-foreground">{stats.overdueCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Timeline */}
          <div className="lg:col-span-3">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loading ? (
                    <p className="text-sm text-muted-foreground">Loading activity...</p>
                  ) : activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                  ) : (
                    activities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-4 p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className="flex-shrink-0 mt-1">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm text-foreground">{activity.title}</h4>
                            {getActivityBadge(activity.type)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{activity.description}</p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              {activity.timestamp
                                ? formatDistanceToNow(parseISO(activity.timestamp), { addSuffix: true })
                                : ""}
                            </span>
                            <span className="capitalize">{activity.category}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
