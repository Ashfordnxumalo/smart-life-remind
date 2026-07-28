import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { CalendarIcon, Clock, FileText, Calendar, CreditCard, Heart, Settings, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LocationPicker } from "@/components/LocationPicker";
import type { Reminder, ReminderUpdate } from "@/types/reminder";

interface EditReminderDialogProps {
  reminder: Reminder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, data: ReminderUpdate) => void | Promise<void>;
}

const categories = [
  { id: "appointment", label: "Appointment", icon: Calendar, color: "category-appointment", description: "Medical visits, meetings, consultations" },
  { id: "document", label: "Document", icon: FileText, color: "category-document", description: "Passports, licenses, contracts" },
  { id: "subscription", label: "Subscription", icon: CreditCard, color: "category-subscription", description: "Netflix, Spotify, software renewals" },
  { id: "personal", label: "Personal", icon: Heart, color: "category-personal", description: "Birthdays, anniversaries, events" },
  { id: "custom", label: "Custom", icon: Settings, color: "category-custom", description: "Other reminders" }
];

const priorities = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-warning/10 text-warning" },
  { value: "high", label: "High", color: "bg-destructive/10 text-destructive" }
];

export const EditReminderDialog = ({ reminder, open, onOpenChange, onUpdate }: EditReminderDialogProps) => {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (reminder && open) {
      setTitle(reminder.title);
      setSelectedCategory(reminder.category);
      setSelectedPriority(reminder.priority);
      setNotes(reminder.description);
      setDate(parse(reminder.dueDate, "yyyy-MM-dd", new Date()));
      setTime(reminder.dueTime ?? "09:00");
      setIsAllDay(reminder.dueTime === null);

      if (reminder.reminderLocation && reminder.locationLat != null && reminder.locationLng != null) {
        setLocation({
          address: reminder.reminderLocation,
          latitude: reminder.locationLat,
          longitude: reminder.locationLng,
        });
      } else {
        setLocation(null);
      }
    }
  }, [reminder, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !selectedCategory || !date || !reminder) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const update: ReminderUpdate = {
        title,
        category: selectedCategory as Reminder["category"],
        priority: selectedPriority as Reminder["priority"],
        description: notes,
        dueDate: format(date, "yyyy-MM-dd"),
        dueTime: isAllDay ? null : time,
        reminderLocation: location?.address || null,
        locationLat: location?.latitude ?? null,
        locationLng: location?.longitude ?? null,
      };

      await onUpdate(reminder.id, update);

      toast({
        title: "Reminder Updated! ✅",
        description: `"${title}" has been updated successfully.`
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to update reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Edit Reminder
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Enter reminder title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-base"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">
              Category <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;

                return (
                  <div
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-medium rounded-lg border p-4",
                      isSelected ? "ring-2 ring-primary shadow-medium" : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        `bg-${category.color}/10`
                      )}>
                        <Icon className={cn("w-5 h-5", `text-${category.color}`)} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">{category.label}</h3>
                        <p className="text-xs text-muted-foreground">{category.description}</p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">
                Date <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-semibold">
                Time
              </Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="all-day"
                    checked={isAllDay}
                    onCheckedChange={setIsAllDay}
                  />
                  <Label htmlFor="all-day" className="text-sm">All day event</Label>
                </div>
                {!isAllDay && (
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Priority</Label>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    <div className="flex items-center space-x-2">
                      <Badge className={cn("text-xs", priority.color)}>
                        {priority.label}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Location
            </Label>
            <LocationPicker
              onLocationSelect={setLocation}
              selectedLocation={location}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary hover:opacity-90" disabled={submitting}>
              {submitting ? "Updating..." : "Update Reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
