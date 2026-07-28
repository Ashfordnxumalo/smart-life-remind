import { Calendar, Clock, AlertCircle, FileText, CreditCard, Heart, Settings, Check, MoreHorizontal, RotateCcw, MapPin, Navigation, Edit, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LocationNavigation } from "@/components/LocationNavigation";
import { EditReminderDialog } from "@/components/EditReminderDialog";
import { useState } from "react";
import type { Reminder, ReminderUpdate } from "@/types/reminder";
import { formatDueTime } from "@/lib/reminderDisplay";

const categoryConfig = {
  appointment: {
    icon: Calendar,
    label: "Appointment",
    color: "category-appointment"
  },
  document: {
    icon: FileText,
    label: "Document", 
    color: "category-document"
  },
  subscription: {
    icon: CreditCard,
    label: "Subscription",
    color: "category-subscription"
  },
  personal: {
    icon: Heart,
    label: "Personal",
    color: "category-personal"
  },
  custom: {
    icon: Settings,
    label: "Custom",
    color: "category-custom"
  }
};

const priorityConfig = {
  low: {
    color: "bg-muted text-muted-foreground",
    label: "Low"
  },
  medium: {
    color: "bg-warning/10 text-warning",
    label: "Medium"
  },
  high: {
    color: "bg-destructive/10 text-destructive",
    label: "High"
  }
};

interface ReminderCardProps {
  reminder: Reminder;
  onComplete?: (id: string) => void | Promise<void>;
  onPostpone?: (id: string) => void | Promise<void>;
  onEdit?: (id: string, data: ReminderUpdate) => void | Promise<void>;
  onDelete?: (id: string) => void | Promise<void>;
  variant?: "default" | "compact";
}

export const ReminderCard = ({ reminder, onComplete, onPostpone, onEdit, onDelete, variant = "default" }: ReminderCardProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const categoryInfo = categoryConfig[reminder.category];
  const priorityInfo = priorityConfig[reminder.priority];
  const Icon = categoryInfo.icon;

  const handleComplete = async () => {
    try {
      await onComplete?.(reminder.id);
      toast({
        title: "Reminder completed!",
        description: `"${reminder.title}" has been marked as complete.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to complete reminder.", variant: "destructive" });
    }
  };

  const handlePostpone = async () => {
    try {
      await onPostpone?.(reminder.id);
      toast({
        title: "Reminder postponed",
        description: `"${reminder.title}" has been postponed by 1 day.`,
      });
    } catch {
      toast({ title: "Error", description: "Failed to postpone reminder.", variant: "destructive" });
    }
  };

  const handleEdit = () => {
    setEditDialogOpen(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${reminder.title}"?`)) {
      try {
        await onDelete?.(reminder.id);
        toast({
          title: "Reminder deleted",
          description: `"${reminder.title}" has been deleted.`,
          variant: "destructive"
        });
      } catch {
        toast({ title: "Error", description: "Failed to delete reminder.", variant: "destructive" });
      }
    }
  };

  const handleEditUpdate = async (id: string, data: ReminderUpdate) => {
    await onEdit?.(id, data);
    setEditDialogOpen(false);
  };

  if (variant === "compact") {
    return (
      <div className={cn(
        "flex items-center justify-between p-3 border rounded-lg hover:shadow-soft transition-all duration-200",
        reminder.completed ? "opacity-60 bg-muted/30" : "bg-background"
      )}>
        <div className="flex items-center space-x-3 flex-1">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            `bg-${categoryInfo.color}/10`
          )}>
            <Icon className={cn("w-4 h-4", `text-${categoryInfo.color}`)} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-medium text-sm truncate",
              reminder.completed && "line-through text-muted-foreground"
            )}>
              {reminder.title}
            </h4>
            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
              <span>{reminder.dueDate}</span>
              <span>{formatDueTime(reminder.dueTime)}</span>
            </div>
            {reminder.reminderLocation && (
              <LocationNavigation
                location={reminder.reminderLocation}
                latitude={reminder.locationLat ?? undefined}
                longitude={reminder.locationLng ?? undefined}
                variant="compact"
              />
            )}
          </div>
          <Badge className={cn("text-xs shrink-0", priorityInfo.color)}>
            {priorityInfo.label}
          </Badge>
        </div>
        <div className="flex items-center space-x-1 ml-3">
          {!reminder.completed && (
            <Button variant="ghost" size="sm" onClick={handleComplete} className="h-8 w-8 p-0">
              <Check className="w-4 h-4" />
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!reminder.completed && (
                <DropdownMenuItem onClick={handlePostpone}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Postpone 1 day
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <EditReminderDialog
          reminder={reminder}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={handleEditUpdate}
        />
      </div>
    );
  }

  return (
    <Card className={cn(
      "group hover:shadow-medium transition-all duration-200 border border-border/50 hover:border-border",
      reminder.completed ? "opacity-60 bg-muted/30" : ""
    )}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
              `bg-${categoryInfo.color}/10 group-hover:bg-${categoryInfo.color}/20`
            )}>
              <Icon className={cn("w-5 h-5", `text-${categoryInfo.color}`)} />
            </div>
            <div>
              <h3 className={cn(
                "font-semibold text-sm group-hover:text-primary transition-colors",
                reminder.completed && "line-through text-muted-foreground"
              )}>
                {reminder.title}
              </h3>
              <p className="text-xs text-muted-foreground">{categoryInfo.label}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={cn("text-xs", priorityInfo.color)}>
              {priorityInfo.label}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!reminder.completed && (
                  <>
                    <DropdownMenuItem onClick={handleComplete}>
                      <Check className="w-4 h-4 mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePostpone}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Postpone 1 day
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuItem onClick={handleEdit}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <p className={cn(
          "text-sm text-muted-foreground mb-3 line-clamp-2",
          reminder.completed && "line-through"
        )}>
          {reminder.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-3 h-3" />
            <span>{reminder.dueDate}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="w-3 h-3" />
            <span>{formatDueTime(reminder.dueTime)}</span>
          </div>
        </div>

        {reminder.reminderLocation && (
          <LocationNavigation
            location={reminder.reminderLocation}
            latitude={reminder.locationLat ?? undefined}
            longitude={reminder.locationLng ?? undefined}
            variant="full"
          />
        )}
        
        <EditReminderDialog
          reminder={reminder}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onUpdate={handleEditUpdate}
        />
      </CardContent>
    </Card>
  );
};