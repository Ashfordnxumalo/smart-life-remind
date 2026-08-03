import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CategoryCombobox } from "@/components/CategoryCombobox";
import type {
  NewServiceProvider,
  ProviderReference,
  ServiceProvider,
} from "@/types/serviceProvider";

interface ServiceProviderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider?: ServiceProvider | null;
  onSubmit: (data: NewServiceProvider) => Promise<void>;
}

const emptyReference = (): ProviderReference => ({ label: "", value: "" });

export const ServiceProviderFormDialog = ({
  open,
  onOpenChange,
  provider,
  onSubmit,
}: ServiceProviderFormDialogProps) => {
  const [service, setService] = useState("");
  const [category, setCategory] = useState<string>("Home Maintenance");
  const [providerName, setProviderName] = useState("");
  const [contactName, setContactName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [references, setReferences] = useState<ProviderReference[]>([]);
  const [notes, setNotes] = useState("");
  const [lastServicedOn, setLastServicedOn] = useState("");
  const [nextDueOn, setNextDueOn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [categoryListOpen, setCategoryListOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setService(provider?.service ?? "");
    setCategory(provider?.category ?? "Home Maintenance");
    setProviderName(provider?.providerName ?? "");
    setContactName(provider?.contactName ?? "");
    setPhone(provider?.phone ?? "");
    setEmail(provider?.email ?? "");
    setWebsite(provider?.website ?? "");
    setReferences(provider?.references?.length ? provider.references : []);
    setNotes(provider?.notes ?? "");
    setLastServicedOn(provider?.lastServicedOn ?? "");
    setNextDueOn(provider?.nextDueOn ?? "");
  }, [open, provider]);

  const setReference = (index: number, patch: Partial<ProviderReference>) =>
    setReferences((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...patch } : r))
    );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!service.trim() || !providerName.trim()) {
      toast({
        title: "Service and provider are required",
        description: "Everything else can be filled in later.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        service: service.trim(),
        category: category.trim() || "Other",
        providerName: providerName.trim(),
        contactName: contactName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        website: website.trim() || null,
        // Half-filled rows are noise on the card, so drop them on save.
        references: references
          .map((r) => ({ label: r.label.trim(), value: r.value.trim() }))
          .filter((r) => r.label && r.value),
        notes: notes.trim() || null,
        lastServicedOn: lastServicedOn || null,
        nextDueOn: nextDueOn || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save service provider:", error);
      toast({
        title: "Couldn't save",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] max-w-lg overflow-y-auto"
        // With the category list showing, Escape belongs to it. Radix would
        // otherwise close the whole form on that keypress and lose the entry.
        onEscapeKeyDown={(event) => {
          if (categoryListOpen) event.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{provider ? "Edit provider" : "Add service provider"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="sp-service">
              Service <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sp-service"
              placeholder="e.g. Geyser service, Car insurance"
              value={service}
              onChange={(e) => setService(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-category">Category</Label>
            <CategoryCombobox
              id="sp-category"
              value={category}
              onChange={setCategory}
              onListOpenChange={setCategoryListOpen}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sp-provider">
                Provider <span className="text-destructive">*</span>
              </Label>
              <Input
                id="sp-provider"
                placeholder="e.g. Miway"
                value={providerName}
                onChange={(e) => setProviderName(e.target.value)}
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-contact-name">Contact person</Label>
              <Input
                id="sp-contact-name"
                placeholder="e.g. Mike"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sp-phone">Phone</Label>
              <Input
                id="sp-phone"
                type="tel"
                placeholder="082 344 3000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-email">Email</Label>
              <Input
                id="sp-email"
                type="email"
                placeholder="claims@example.co.za"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-website">Website</Label>
            <Input
              id="sp-website"
              placeholder="example.co.za"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Reference numbers</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReferences((prev) => [...prev, emptyReference()])}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Policy number, account number, warranty — whatever this provider
              identifies you by.
            </p>

            {references.map((reference, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Label"
                  className="w-1/3"
                  value={reference.label}
                  onChange={(e) => setReference(index, { label: e.target.value })}
                />
                <Input
                  placeholder="Value"
                  className="flex-1 font-mono"
                  value={reference.value}
                  onChange={(e) => setReference(index, { value: e.target.value })}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label="Remove reference"
                  onClick={() =>
                    setReferences((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="sp-last">Last serviced</Label>
              <Input
                id="sp-last"
                type="date"
                value={lastServicedOn}
                onChange={(e) => setLastServicedOn(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sp-next">Next due</Label>
              <Input
                id="sp-next"
                type="date"
                value={nextDueOn}
                onChange={(e) => setNextDueOn(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sp-notes">Notes</Label>
            <Textarea
              id="sp-notes"
              rows={2}
              className="resize-none"
              placeholder="Anything worth remembering next time"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-primary" disabled={submitting}>
              {submitting ? "Saving…" : provider ? "Save changes" : "Add provider"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
