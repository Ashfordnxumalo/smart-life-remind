import { useState } from "react";
import { Calendar, Clock, Plus, Bell, Search, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReminderCard } from "./ReminderCard";
import { QuickStats } from "./QuickStats";
import { UpcomingReminders } from "./UpcomingReminders";
import { AddReminderDialog } from "./AddReminderDialog";
import { ProfileMenu } from "./ProfileMenu";
import { LoyaltyCardsDialog } from "./LoyaltyCardsDialog";
import { useReminders } from "@/hooks/useReminders";
import { isToday, parseISO } from "date-fns";

export const Dashboard = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>();
  const [searchQuery, setSearchQuery] = useState("");
  const [cardsOpen, setCardsOpen] = useState(false);
  const { reminders, loading, stats, complete, postpone, update, remove } = useReminders();

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setDialogOpen(true);
  };

  const visibleReminders = reminders.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todaysReminders = visibleReminders
    .filter((r) => !r.completed && isToday(parseISO(r.dueDate)))
    .slice(0, 4);
  const displayedReminders = todaysReminders.length > 0 ? todaysReminders : visibleReminders.slice(0, 4);
  const upcoming = visibleReminders.filter((r) => !r.completed).slice(0, 3);

  // Page height is owned by the route (see Index.tsx) so the footer can sit
  // below the content rather than off-screen.
  return (
    <div className="bg-gradient-subtle">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary">
                <Bell className="h-5 w-5 text-white" />
              </div>
              <h1 className="truncate bg-gradient-primary bg-clip-text text-lg font-bold text-transparent sm:text-2xl">
                SmartRemind
              </h1>
            </div>

            <div className="flex shrink-0 items-center gap-2 sm:gap-4">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search reminders..."
                  className="w-64 pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {/* Label collapses to an icon on small screens to keep the
                  header on one row. */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCardsOpen(true)}
                aria-label="Loyalty cards"
              >
                <CreditCard className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <AddReminderDialog
                preSelectedCategory={selectedCategory}
                isOpen={dialogOpen}
                onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) setSelectedCategory(undefined);
                }}
              />
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Left Sidebar - Quick Stats & Upcoming */}
          <div className="lg:col-span-1 space-y-6">
            <QuickStats stats={stats} />
            {upcoming.length > 0 && <UpcomingReminders reminders={upcoming} />}
          </div>

          {/* Main Dashboard Area */}
          <div className="lg:col-span-3 space-y-6">

            {/* Welcome Section */}
            <div className="rounded-2xl bg-gradient-primary p-5 text-white shadow-medium sm:p-8">
              <h2 className="mb-2 text-2xl font-bold sm:text-3xl">Good morning! 👋</h2>
              <p className="mb-6 text-white/90">
                You have {stats.todayCount} upcoming reminder{stats.todayCount === 1 ? "" : "s"} today. Stay on top of your schedule!
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Link to="/calendar">
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-white border-white/30">
                    <Calendar className="w-4 h-4 mr-2" />
                    View Calendar
                  </Button>
                </Link>
                <Link to="/activity">
                  <Button variant="outline" className="bg-transparent border-white/30 text-white hover:bg-white/10">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Activity
                  </Button>
                </Link>
              </div>
            </div>

            {/* Categories Overview */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center mr-3">
                    <Bell className="w-4 h-4 text-white" />
                  </div>
                  Today's Reminders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading reminders...</p>
                ) : displayedReminders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No reminders yet. Click "Add Reminder" to create your first one.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {displayedReminders.map((reminder) => (
                      <ReminderCard
                        key={reminder.id}
                        reminder={reminder}
                        onComplete={complete}
                        onPostpone={postpone}
                        onEdit={update}
                        onDelete={remove}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card
                className="p-4 hover:shadow-medium transition-all duration-200 cursor-pointer group"
                onClick={() => handleCategoryClick("appointment")}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-category-appointment/10 rounded-xl flex items-center justify-center group-hover:bg-category-appointment/20 transition-colors">
                    <Calendar className="w-6 h-6 text-category-appointment" />
                  </div>
                  <span className="font-medium">Appointment</span>
                </div>
              </Card>

              <Card
                className="p-4 hover:shadow-medium transition-all duration-200 cursor-pointer group"
                onClick={() => handleCategoryClick("document")}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-category-document/10 rounded-xl flex items-center justify-center group-hover:bg-category-document/20 transition-colors">
                    <Bell className="w-6 h-6 text-category-document" />
                  </div>
                  <span className="font-medium">Document</span>
                </div>
              </Card>

              <Card
                className="p-4 hover:shadow-medium transition-all duration-200 cursor-pointer group"
                onClick={() => handleCategoryClick("subscription")}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-category-subscription/10 rounded-xl flex items-center justify-center group-hover:bg-category-subscription/20 transition-colors">
                    <Clock className="w-6 h-6 text-category-subscription" />
                  </div>
                  <span className="font-medium">Subscription</span>
                </div>
              </Card>

              <Card
                className="p-4 hover:shadow-medium transition-all duration-200 cursor-pointer group"
                onClick={() => handleCategoryClick("personal")}
              >
                <div className="flex flex-col items-center text-center space-y-2">
                  <div className="w-12 h-12 bg-category-personal/10 rounded-xl flex items-center justify-center group-hover:bg-category-personal/20 transition-colors">
                    <Plus className="w-6 h-6 text-category-personal" />
                  </div>
                  <span className="font-medium">Personal</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <LoyaltyCardsDialog open={cardsOpen} onOpenChange={setCardsOpen} />
    </div>
  );
};
