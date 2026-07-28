import { useState } from "react";
import { Calendar, Clock, Filter, Search, Grid, List } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReminderCard } from "./ReminderCard";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types/reminder";

interface RemindersListProps {
  reminders: Reminder[];
  title?: string;
  categoryFilter?: string;
  onComplete?: (id: string) => void | Promise<void>;
  onPostpone?: (id: string) => void | Promise<void>;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (id: string) => void | Promise<void>;
}

const categoryLabels = {
  appointment: "Appointments",
  document: "Documents", 
  subscription: "Subscriptions",
  personal: "Personal",
  custom: "Custom"
};

export const RemindersList = ({ 
  reminders, 
  title = "All Reminders",
  categoryFilter,
  onComplete,
  onPostpone,
  onEdit,
  onDelete
}: RemindersListProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryFilter || "all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const filteredReminders = reminders.filter(reminder => {
    const matchesSearch = reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reminder.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || reminder.category === selectedCategory;
    const matchesPriority = selectedPriority === "all" || reminder.priority === selectedPriority;
    
    return matchesSearch && matchesCategory && matchesPriority;
  });

  const completedCount = filteredReminders.filter(r => r.completed).length;
  const pendingCount = filteredReminders.filter(r => !r.completed).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">
            {pendingCount} pending, {completedCount} completed
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search reminders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="appointment">Appointments</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="subscription">Subscriptions</SelectItem>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Status */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({filteredReminders.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <RemindersGrid 
            reminders={filteredReminders}
            viewMode={viewMode}
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </TabsContent>
        
        <TabsContent value="pending" className="mt-6">
          <RemindersGrid 
            reminders={filteredReminders.filter(r => !r.completed)}
            viewMode={viewMode}
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <RemindersGrid 
            reminders={filteredReminders.filter(r => r.completed)}
            viewMode={viewMode}
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface RemindersGridProps {
  reminders: Reminder[];
  viewMode: "grid" | "list";
  onComplete?: (id: string) => void | Promise<void>;
  onPostpone?: (id: string) => void | Promise<void>;
  onEdit?: (reminder: Reminder) => void;
  onDelete?: (id: string) => void | Promise<void>;
}

const RemindersGrid = ({ reminders, viewMode, onComplete, onPostpone, onEdit, onDelete }: RemindersGridProps) => {
  if (reminders.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No reminders found</p>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
        {reminders.map((reminder) => (
          <ReminderCard
            key={reminder.id}
            reminder={reminder}
            variant="compact"
            onComplete={onComplete}
            onPostpone={onPostpone}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
};