import { useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { format, isThisMonth, isBefore, parseISO, startOfDay } from "date-fns";
import { ReminderCard } from "@/components/ReminderCard";
import { AddReminderDialog } from "@/components/AddReminderDialog";
import { useReminders } from "@/hooks/useReminders";

export default function CalendarPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const { reminders, loading, complete, postpone, update, remove } = useReminders();

  const remindersForSelectedDate = useMemo(() => {
    if (!selectedDate) return reminders;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return reminders.filter((r) => r.dueDate === dateStr);
  }, [reminders, selectedDate]);

  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = { appointment: 0, document: 0, subscription: 0, personal: 0, custom: 0 };
    let total = 0;
    let overdue = 0;
    const today = startOfDay(new Date());

    for (const r of reminders) {
      const due = parseISO(r.dueDate);
      if (isThisMonth(due)) {
        counts[r.category] = (counts[r.category] ?? 0) + 1;
        total += 1;
      }
      if (!r.completed && isBefore(due, today)) overdue += 1;
    }

    return { counts, total, overdue };
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
                  <CalendarDays className="w-5 h-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Calendar View
                </h1>
              </div>
            </div>
            <AddReminderDialog />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2 text-primary" />
                  Select Date
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border"
                />
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Total Reminders</span>
                    <Badge variant="secondary">{reminders.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>This Month</span>
                    <Badge className="bg-primary/10 text-primary">{monthCounts.total}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Overdue</span>
                    <Badge className="bg-destructive/10 text-destructive">{monthCounts.overdue}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Reminders for Selected Date */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>
                  Reminders for {selectedDate?.toLocaleDateString() || "Today"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading reminders...</p>
                ) : remindersForSelectedDate.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reminders for this date.</p>
                ) : (
                  remindersForSelectedDate.map((reminder) => (
                    <ReminderCard
                      key={reminder.id}
                      reminder={reminder}
                      variant="compact"
                      onComplete={complete}
                      onPostpone={postpone}
                      onEdit={update}
                      onDelete={remove}
                    />
                  ))
                )}
              </CardContent>
            </Card>

            {/* Monthly Overview */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>This Month Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-category-appointment/10 rounded-lg">
                    <div className="text-2xl font-bold text-category-appointment">{monthCounts.counts.appointment}</div>
                    <div className="text-sm text-muted-foreground">Appointments</div>
                  </div>
                  <div className="text-center p-4 bg-category-document/10 rounded-lg">
                    <div className="text-2xl font-bold text-category-document">{monthCounts.counts.document}</div>
                    <div className="text-sm text-muted-foreground">Documents</div>
                  </div>
                  <div className="text-center p-4 bg-category-subscription/10 rounded-lg">
                    <div className="text-2xl font-bold text-category-subscription">{monthCounts.counts.subscription}</div>
                    <div className="text-sm text-muted-foreground">Subscriptions</div>
                  </div>
                  <div className="text-center p-4 bg-category-personal/10 rounded-lg">
                    <div className="text-2xl font-bold text-category-personal">{monthCounts.counts.personal}</div>
                    <div className="text-sm text-muted-foreground">Personal</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
