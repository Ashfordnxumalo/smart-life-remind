import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RemindersList } from "@/components/RemindersList";
import { useReminders } from "@/hooks/useReminders";
import { AppFooter } from "@/components/AppFooter";

export default function AllRemindersPage() {
  const { reminders, loading, complete, postpone, update, remove } = useReminders();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-subtle">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            </Link>
            <h1 className="truncate text-lg font-bold text-foreground sm:text-2xl">
              All Reminders
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto flex-1 px-4 py-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading reminders...</p>
        ) : (
          <RemindersList
            reminders={reminders}
            title="All Reminders"
            onComplete={complete}
            onPostpone={postpone}
            onEdit={update}
            onDelete={remove}
          />
        )}
      </main>

      <AppFooter />
    </div>
  );
}
