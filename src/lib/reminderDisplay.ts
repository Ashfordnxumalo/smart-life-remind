import { format, parse } from "date-fns";

export const formatDueTime = (dueTime: string | null): string => {
  if (!dueTime) return "All Day";
  try {
    return format(parse(dueTime, "HH:mm", new Date()), "h:mm a");
  } catch {
    return dueTime;
  }
};
