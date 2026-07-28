import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { RemindersList } from "@/components/RemindersList";
import { useReminders } from "@/hooks/useReminders";

export default function AllRemindersPage() {
  const { reminders, loading, complete, postpone, update, remove } = useReminders();

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              All Reminders
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
    </div>
  );
}
