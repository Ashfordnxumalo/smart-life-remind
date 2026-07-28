import { useCallback, useEffect, useMemo, useState } from "react";
import { isBefore, isThisWeek, isToday, parseISO, startOfDay } from "date-fns";
import { useAuth } from "@/hooks/useAuth";
import {
  completeReminder,
  createReminder,
  deleteReminder,
  postponeReminder,
  reopenReminder,
  subscribeToReminders,
  updateReminder,
} from "@/lib/firestore/reminders";
import type { NewReminder, Reminder, ReminderUpdate } from "@/types/reminder";

export const useReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

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

  return { reminders, loading, stats, create, update, complete, reopen, postpone, remove };
};
