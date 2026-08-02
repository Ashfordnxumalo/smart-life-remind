import { useCallback, useEffect, useMemo, useState } from "react";
import { isBefore, isThisWeek, isToday, parseISO, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  postponeReminder,
  reopenReminder,
  subscribeToAssignedReminders,
  subscribeToReminders,
  updateReminder,
} from "@/lib/firestore/reminders";
import { subscribeToLinkedMembers } from "@/lib/firestore/invitations";
import type { LinkedMember, NewReminder, Reminder, ReminderUpdate } from "@/types/reminder";

/** A reminder someone else owns and assigned to the signed-in user. */
export interface AssignedReminder extends Reminder {
  ownerUid: string;
  assignedByName: string;
}

export const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [linked, setLinked] = useState<LinkedMember[]>([]);
  const [assignedByOwner, setAssignedByOwner] = useState<
    Record<string, AssignedReminder[]>
  >({});

  useEffect(() => {
    if (!user) {
      setReminders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToReminders(user.uid, (data) => {
      setReminders(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  // Tasks other people assigned to this user. They live under the assigner's
  // account, so each linked account needs its own listener.
  useEffect(() => {
    if (!user) {
      setLinked([]);
      return;
    }
    return subscribeToLinkedMembers(user.uid, setLinked, (error) =>
      console.error("Failed to load linked members:", error)
    );
  }, [user]);

  useEffect(() => {
    if (!user || linked.length === 0) {
      setAssignedByOwner({});
      return;
    }

    const unsubscribes = linked.map((member) =>
      subscribeToAssignedReminders(
        member.uid,
        user.uid,
        (data) =>
          setAssignedByOwner((prev) => ({
            ...prev,
            [member.uid]: data.map((reminder) => ({
              ...reminder,
              ownerUid: member.uid,
              assignedByName: member.displayName,
            })),
          })),
        (error) =>
          // One person's feed failing shouldn't empty the whole assigned list.
          console.error(`Failed to load reminders assigned by ${member.uid}:`, error)
      )
    );

    return () => unsubscribes.forEach((fn) => fn());
  }, [user, linked]);

  const create = useCallback(
    async (data: NewReminder) => {
      if (!user) throw new Error("Must be signed in to create a reminder.");
      return createReminder(user.uid, data);
    },
    [user]
  );

  const update = useCallback(
    async (id: string, data: ReminderUpdate) => {
      if (!user) throw new Error("Must be signed in.");
      await updateReminder(user.uid, id, data);
    },
    [user]
  );

  const complete = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Must be signed in.");
      await completeReminder(user.uid, id);
    },
    [user]
  );

  const reopen = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Must be signed in.");
      await reopenReminder(user.uid, id);
    },
    [user]
  );

  const postpone = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Must be signed in.");
      const reminder = reminders.find((r) => r.id === id);
      if (!reminder) return;
      await postponeReminder(user.uid, id, reminder.dueDate);
    },
    [user, reminders]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user) throw new Error("Must be signed in.");
      await deleteReminder(user.uid, id);
    },
    [user]
  );

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    let todayCount = 0;
    let weekCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    for (const reminder of reminders) {
      const due = parseISO(reminder.dueDate);
      if (reminder.completed) {
        completedCount += 1;
        continue;
      }
      if (isToday(due)) todayCount += 1;
      if (isThisWeek(due, { weekStartsOn: 1 })) weekCount += 1;
      if (isBefore(due, today)) overdueCount += 1;
    }

    return { todayCount, weekCount, overdueCount, completedCount };
  }, [reminders]);

  const assignedToMe = useMemo(
    () =>
      Object.values(assignedByOwner)
        .flat()
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [assignedByOwner]
  );

  /** Tasks this user handed to someone else. */
  const assignedByMe = useMemo(
    () => reminders.filter((r) => r.assignedMemberId !== null),
    [reminders]
  );

  /**
   * Completing a task assigned to you writes to the assigner's document, which
   * the rules permit for the completed fields only — so this can't reuse the
   * owner-scoped complete() above.
   */
  const completeAssigned = useCallback(
    async (reminder: AssignedReminder) => {
      if (!user) throw new Error("Must be signed in.");
      await completeReminder(reminder.ownerUid, reminder.id);
    },
    [user]
  );

  return {
    reminders,
    assignedToMe,
    assignedByMe,
    loading,
    stats,
    create,
    update,
    complete,
    completeAssigned,
    reopen,
    postpone,
    remove,
  };
};
