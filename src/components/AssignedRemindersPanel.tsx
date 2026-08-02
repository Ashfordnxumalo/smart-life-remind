import { ArrowDownLeft, ArrowUpRight, Check, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { AssignedReminder } from "@/hooks/useReminders";
import type { FamilyMember, Reminder } from "@/types/reminder";

interface AssignedRemindersPanelProps {
  /** Tasks other people assigned to this user. */
  assignedToMe: AssignedReminder[];
  /** This user's own reminders that are assigned to someone. */
  assignedByMe: Reminder[];
  familyMembers: FamilyMember[];
  onCompleteAssigned: (reminder: AssignedReminder) => Promise<void>;
}

const Row = ({
  title,
  dueDate,
  dueTime,
  completed,
  personLabel,
  direction,
  action,
}: {
  title: string;
  dueDate: string;
  dueTime: string | null;
  completed: boolean;
  personLabel: string;
  direction: "in" | "out";
  action?: React.ReactNode;
}) => (
  <div className="flex items-center gap-3 rounded-lg border border-border p-3">
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
        direction === "in" ? "bg-category-personal/10" : "bg-primary/10"
      }`}
    >
      {direction === "in" ? (
        <ArrowDownLeft className="h-4 w-4 text-category-personal" />
      ) : (
        <ArrowUpRight className="h-4 w-4 text-primary" />
      )}
    </div>

    <div className="min-w-0 flex-1">
      <p className={`truncate font-medium ${completed ? "line-through opacity-60" : ""}`}>
        {title}
      </p>
      <p className="text-xs text-muted-foreground">
        {personLabel} · {dueDate}
        {dueTime ? ` at ${dueTime}` : ""}
      </p>
    </div>

    {completed ? (
      <Badge variant="secondary" className="shrink-0">
        Done
      </Badge>
    ) : (
      action
    )}
  </div>
);

/**
 * Both directions of assignment in one view. They come from different places —
 * incoming tasks live in the assigner's account, outgoing in this one — so
 * they're grouped rather than merged into a single list, which would leave no
 * way to tell who owes what to whom.
 */
export const AssignedRemindersPanel = ({
  assignedToMe,
  assignedByMe,
  familyMembers,
  onCompleteAssigned,
}: AssignedRemindersPanelProps) => {
  const { toast } = useToast();

  const memberName = (id: string | null) =>
    familyMembers.find((m) => m.id === id)?.name ?? "someone";

  const handleComplete = async (reminder: AssignedReminder) => {
    try {
      await onCompleteAssigned(reminder);
      toast({ title: "Marked done", description: `"${reminder.title}" is complete.` });
    } catch {
      toast({
        title: "Couldn't update",
        description: "You may no longer have access to this task.",
        variant: "destructive",
      });
    }
  };

  const nothingToShow = assignedToMe.length === 0 && assignedByMe.length === 0;

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="mr-3 flex h-6 w-6 items-center justify-center rounded-md bg-gradient-primary">
            <Users className="h-4 w-4 text-white" />
          </div>
          Assigned
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {nothingToShow && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing assigned yet. Assign a reminder to a linked family member and
            it will show up here for both of you.
          </p>
        )}

        {assignedToMe.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Assigned to me
            </h3>
            {assignedToMe.map((reminder) => (
              <Row
                key={`${reminder.ownerUid}-${reminder.id}`}
                title={reminder.title}
                dueDate={reminder.dueDate}
                dueTime={reminder.dueTime}
                completed={reminder.completed}
                personLabel={`From ${reminder.assignedByName}`}
                direction="in"
                action={
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    onClick={() => handleComplete(reminder)}
                  >
                    <Check className="mr-1 h-3 w-3" />
                    Done
                  </Button>
                }
              />
            ))}
          </div>
        )}

        {assignedByMe.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Assigned by me
            </h3>
            {assignedByMe.map((reminder) => (
              <Row
                key={reminder.id}
                title={reminder.title}
                dueDate={reminder.dueDate}
                dueTime={reminder.dueTime}
                completed={reminder.completed}
                personLabel={`To ${memberName(reminder.assignedMemberId)}`}
                direction="out"
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
