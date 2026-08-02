import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock, FileText, Calendar, CreditCard, Heart, Settings, Plus, Users, Bell, Mail, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useReminders } from "@/hooks/useReminders";
import { subscribeToFamilyMembers } from "@/lib/firestore/familyMembers";
import { LocationPicker } from "@/components/LocationPicker";
import type { FamilyMember, NotificationPreference, Reminder } from "@/types/reminder";

interface AddReminderDialogProps {
  trigger?: React.ReactNode;
  preSelectedCategory?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const categories = [
  {
    id: "appointment",
    label: "Appointment",
    icon: Calendar,
    color: "category-appointment",
    description: "Medical visits, meetings, consultations"
  },
  {
    id: "document", 
    label: "Document",
    icon: FileText,
    color: "category-document",
    description: "Passports, licenses, contracts"
  },
  {
    id: "subscription",
    label: "Subscription", 
    icon: CreditCard,
    color: "category-subscription",
    description: "Netflix, Spotify, software renewals"
  },
  {
    id: "personal",
    label: "Personal",
    icon: Heart,
    color: "category-personal", 
    description: "Birthdays, anniversaries, events"
  },
  {
    id: "custom",
    label: "Custom",
    icon: Settings,
    color: "category-custom",
    description: "Other reminders"
  }
];

const priorities = [
  { value: "low", label: "Low", color: "bg-muted text-muted-foreground" },
  { value: "medium", label: "Medium", color: "bg-warning/10 text-warning" },
  { value: "high", label: "High", color: "bg-destructive/10 text-destructive" }
];

const repeatOptions = [
  { value: "none", label: "No repeat" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

export const AddReminderDialog = ({ trigger, preSelectedCategory, isOpen: externalOpen, onOpenChange }: AddReminderDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(preSelectedCategory || "");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [selectedRepeat, setSelectedRepeat] = useState("none");
  const [date, setDate] = useState<Date>();
  const [dateOpen, setDateOpen] = useState(false);
  const [time, setTime] = useState("09:00");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [isAllDay, setIsAllDay] = useState(false);
  const [assignedMember, setAssignedMember] = useState<string>("");
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreference[]>(["app"]);
  const [location, setLocation] = useState<{ address: string; latitude: number; longitude: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { create } = useReminders();

  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    if (preSelectedCategory) {
      setSelectedCategory(preSelectedCategory);
    }
  }, [preSelectedCategory]);

  useEffect(() => {
    if (!open || !user) return;
    return subscribeToFamilyMembers(user.uid, setFamilyMembers);
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !selectedCategory || !date) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create reminders.",
        variant: "destructive"
      });
      return;
    }

    const memberId = assignedMember === "self" ? null : assignedMember || null;

    setSubmitting(true);
    try {
      await create({
        title,
        category: selectedCategory as Reminder["category"],
        priority: selectedPriority as Reminder["priority"],
        description: notes,
        dueDate: format(date, 'yyyy-MM-dd'),
        dueTime: isAllDay ? null : time,
        assignedMemberId: memberId,
        // Only set when the member is a linked account — this is what lets
        // them see the task from their own dashboard.
        assignedUid: familyMembers.find((m) => m.id === memberId)?.linkedUid ?? null,
        notificationPreferences,
        reminderLocation: location?.address || null,
        locationLat: location?.latitude ?? null,
        locationLng: location?.longitude ?? null,
        locationRadius: 500,
      });

      // In-app notification delivery for assigned family members is handled
      // server-side by the onReminderAssigned Cloud Function trigger.

      toast({
        title: "Reminder Created! 🎉",
        description: `"${title}" has been added to your reminders.`
      });

      // Reset form
      setTitle("");
      setNotes("");
      setSelectedCategory("");
      setDate(undefined);
      setTime("09:00");
      setIsAllDay(false);
      setSelectedPriority("medium");
      setSelectedRepeat("none");
      setAssignedMember("");
      setNotificationPreferences(["app"]);
      setLocation(null);
      setOpen(false);
    } catch (error) {
      console.error('Error creating reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create reminder. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const defaultTrigger = (
    <Button className="w-10 shrink-0 bg-gradient-primary px-0 transition-opacity hover:opacity-90 sm:w-auto sm:px-4">
      <Plus className="h-4 w-4 sm:mr-2" />
      {/* Icon-only on small screens so the header fits one row. */}
      <span className="hidden sm:inline">Add Reminder</span>
      <span className="sr-only sm:hidden">Add Reminder</span>
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Create New Reminder
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
                  <Card 
                    key={category.id}
                    className={cn(
                      "cursor-pointer transition-all duration-200 hover:shadow-medium",
                      isSelected ? "ring-2 ring-primary shadow-medium" : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4">
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
                    </CardContent>
                  </Card>
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
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
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
                    onSelect={(next) => {
                      setDate(next);
                      // Picking a date is the whole purpose of the popover, so
                      // dismiss it rather than leaving it covering the form.
                      if (next) setDateOpen(false);
                    }}
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

          {/* Assignment to Family Member */}
          {familyMembers.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Assign to Family Member</Label>
              <Select value={assignedMember} onValueChange={setAssignedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select family member (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="self">None (self)</SelectItem>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-gradient-primary text-white">
                            {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                        {member.relationship && (
                          <span className="text-xs text-muted-foreground">({member.relationship})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedMember && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <Users className="w-4 h-4 inline mr-1" />
                  If this member has an email address on file, they will be emailed
                  about this reminder.
                </div>
              )}
            </div>
          )}

          {/* Priority and Repeat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label className="text-sm font-semibold">Repeat</Label>
              <Select value={selectedRepeat} onValueChange={setSelectedRepeat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select repeat option" />
                </SelectTrigger>
                <SelectContent>
                  {repeatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Notification Preferences</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Two channels only. An "all" shortcut made sense across three
                  options; across two it is just a third box to reason about. */}
              {(
                [
                  {
                    id: "app",
                    label: "App Notification",
                    hint: "Shows in your activity feed",
                    icon: Bell,
                  },
                  {
                    id: "email",
                    label: "Email",
                    hint: "Sent to you and anyone assigned",
                    icon: Mail,
                  },
                ] as { id: NotificationPreference; label: string; hint: string; icon: typeof Bell }[]
              ).map((option) => {
                const Icon = option.icon;
                const isChecked = notificationPreferences.includes(option.id);

                return (
                  <div key={option.id} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      id={option.id}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        const id = option.id;
                        if (checked) {
                          setNotificationPreferences((prev) =>
                            prev.includes(id) ? prev : [...prev, id]
                          );
                        } else {
                          // Never leave a reminder with no way to reach anyone.
                          setNotificationPreferences((prev) => {
                            const next = prev.filter((p) => p !== id);
                            return next.length > 0 ? next : ["app"];
                          });
                        }
                      }}
                    />
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor={option.id} className="text-sm cursor-pointer flex-1">
                      {option.label}
                      <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                        {option.hint}
                      </span>
                    </Label>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Bell className="w-4 h-4 inline mr-1" />
              App notifications are always enabled. Select additional methods for backup notifications.
            </div>
          </div>

          {/* Location Picker */}
          <LocationPicker
            onLocationSelect={setLocation}
            selectedLocation={location}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-semibold">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary hover:opacity-90 transition-opacity"
              disabled={submitting}
            >
              {submitting ? "Creating..." : "Create Reminder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};