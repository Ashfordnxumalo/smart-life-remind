import { useState, useEffect } from "react";
import { Users, Plus, Edit, Trash2, Mail, Phone } from "lucide-react";
import { FirebaseError } from "firebase/app";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { getProfile } from "@/lib/firestore/profile";
import {
  addFamilyMember,
  removeFamilyMember,
  subscribeToFamilyMembers,
  updateFamilyMember,
} from "@/lib/firestore/familyMembers";
import type { FamilyMember, PlanType } from "@/types/reminder";
import { useToast } from "@/hooks/use-toast";

interface FamilyMembersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PLAN_LIMITS: Record<PlanType, number> = { family: 5, business: 15 };

export const FamilyMembersDialog = ({ open, onOpenChange }: FamilyMembersDialogProps) => {
  const { user } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [userPlan, setUserPlan] = useState<PlanType>('family');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !user) return;

    setLoading(true);
    getProfile(user.uid)
      .then((profile) => setUserPlan(profile?.planType ?? 'family'))
      .catch(() => setUserPlan('family'));

    const unsubscribe = subscribeToFamilyMembers(user.uid, (members) => {
      setFamilyMembers(members);
      setLoading(false);
    });

    return unsubscribe;
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name) {
      toast({
        title: "Error",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        relationship: formData.relationship || null,
      };

      if (editingMember) {
        await updateFamilyMember(editingMember.id, payload);
        toast({ title: "Success", description: "Family member updated successfully." });
      } else {
        await addFamilyMember(payload);
        toast({ title: "Success", description: "Family member added successfully." });
      }

      setFormData({ name: "", email: "", phone: "", relationship: "" });
      setShowAddForm(false);
      setEditingMember(null);
    } catch (error) {
      const description =
        error instanceof FirebaseError ? error.message : "Failed to save family member.";
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (member: FamilyMember) => {
    setFormData({
      name: member.name,
      email: member.email || "",
      phone: member.phone || "",
      relationship: member.relationship || "",
    });
    setEditingMember(member);
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this family member?")) {
      return;
    }

    setLoading(true);
    try {
      await removeFamilyMember(id);
      toast({ title: "Success", description: "Family member removed successfully." });
    } catch {
      toast({
        title: "Error",
        description: "Failed to remove family member.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: "", email: "", phone: "", relationship: "" });
    setShowAddForm(false);
    setEditingMember(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const maxMembers = PLAN_LIMITS[userPlan];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center">
            <Users className="w-6 h-6 mr-2 text-primary" />
            Family Members
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Add/Edit Form */}
          {showAddForm && (
            <Card className="border-2 border-primary/20">
              <CardContent className="p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Full name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="relationship">Relationship</Label>
                      <Input
                        id="relationship"
                        value={formData.relationship}
                        onChange={(e) => setFormData({...formData, relationship: e.target.value})}
                        placeholder="e.g., Mother, Father, Spouse"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+27 82 000 0000"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3">
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {editingMember ? "Update" : "Add"} Member
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Family Members List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">
                  {userPlan === 'business' ? 'Team Members' : 'Family Members'}
                </span>
                <Badge variant="secondary">
                  {familyMembers.length}/{maxMembers}
                </Badge>
              </div>
              {!showAddForm && familyMembers.length < maxMembers && (
                <Button
                  onClick={() => setShowAddForm(true)}
                  size="sm"
                  className="bg-gradient-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading family members...
              </div>
            ) : familyMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No {userPlan === 'business' ? 'team' : 'family'} members added yet.</p>
                <p className="text-sm">
                  Add up to {maxMembers} {userPlan === 'business' ? 'team' : 'family'} members to assign reminders.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {familyMembers.map((member) => (
                  <Card key={member.id} className="hover:shadow-medium transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-primary text-white">
                              {getInitials(member.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold">{member.name}</h3>
                            {member.relationship && (
                              <p className="text-sm text-muted-foreground">{member.relationship}</p>
                            )}
                            <div className="flex items-center space-x-3 mt-1">
                              {member.email && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Mail className="w-3 h-3" />
                                  <span>{member.email}</span>
                                </div>
                              )}
                              {member.phone && (
                                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                                  <Phone className="w-3 h-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(member)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(member.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
