import { useMemo, useState } from "react";
import {
  CalendarClock,
  Globe,
  Mail,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useServiceProviders, type DirectoryEntry } from "@/hooks/useServiceProviders";
import { ServiceProviderFormDialog } from "@/components/ServiceProviderFormDialog";
import { categoryAccent, type NewServiceProvider } from "@/types/serviceProvider";

interface SmartPagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Strips spaces so tel: links work with numbers written "082 344 3000". */
const telHref = (phone: string) => `tel:${phone.replace(/\s+/g, "")}`;

const siteHref = (site: string) =>
  /^https?:\/\//i.test(site) ? site : `https://${site}`;

export const SmartPagerDialog = ({ open, onOpenChange }: SmartPagerDialogProps) => {
  const { providers, loading, create, update, remove } = useServiceProviders();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DirectoryEntry | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DirectoryEntry | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return providers;
    return providers.filter((p) =>
      [p.service, p.category, p.providerName, p.contactName, p.phone, p.notes]
        .concat(p.references.flatMap((r) => [r.label, r.value]))
        .some((field) => field?.toLowerCase().includes(q))
    );
  }, [providers, search]);

  // Grouped by category so the directory reads like a filing cabinet rather
  // than one long list.
  const grouped = useMemo(() => {
    const map = new Map<string, DirectoryEntry[]>();
    for (const provider of filtered) {
      const list = map.get(provider.category) ?? [];
      list.push(provider);
      map.set(provider.category, list);
    }
    return [...map.entries()];
  }, [filtered]);

  const handleSubmit = async (data: NewServiceProvider) => {
    if (editing) {
      await update(editing.id, data);
      toast({ title: "Provider updated", description: `${data.providerName} saved.` });
    } else {
      await create(data);
      toast({ title: "Provider added", description: `${data.providerName} is on file.` });
    }
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete.id);
      toast({ title: "Removed", description: `${pendingDelete.providerName} deleted.` });
    } catch {
      toast({
        title: "Couldn't remove",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setPendingDelete(null);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="max-h-[90vh] max-w-3xl overflow-y-auto"
          // Opening a directory shouldn't throw up the keyboard over it.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Smart Pager
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Every service provider the family uses, with the numbers you need when
            something breaks. Shared automatically with linked members.
          </p>

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by service, provider, or policy number…"
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                type="button"
                className="bg-gradient-primary"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add provider
              </Button>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading providers…
              </p>
            ) : providers.length === 0 ? (
              <div className="py-10 text-center">
                <Wrench className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
                <p className="font-medium">No providers yet</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                  Add the plumber, the insurer, the medical aid — so the number
                  is there when you need it, not buried in an old email.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nothing matches &ldquo;{search}&rdquo;.
              </p>
            ) : (
              <div className="space-y-6">
                {grouped.map(([category, entries]) => (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: categoryAccent(category) }}
                      />
                      <h3 className="text-sm font-semibold">{category}</h3>
                      <span className="text-xs text-muted-foreground">
                        {entries.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {entries.map((provider) => (
                        <div
                          key={`${provider.ownerUid}-${provider.id}`}
                          className="rounded-xl border border-border p-4"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate font-semibold">{provider.service}</p>
                              <p className="truncate text-sm text-muted-foreground">
                                {provider.providerName}
                                {provider.contactName ? ` · ${provider.contactName}` : ""}
                              </p>
                            </div>
                            {provider.sharedBy ? (
                              <Badge variant="secondary" className="shrink-0">
                                {provider.sharedBy}
                              </Badge>
                            ) : (
                              <div className="flex shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Edit provider"
                                  onClick={() => {
                                    setEditing(provider);
                                    setFormOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  aria-label="Remove provider"
                                  onClick={() => setPendingDelete(provider)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {provider.references.length > 0 && (
                            <div className="mt-3 space-y-1">
                              {provider.references.map((reference, index) => (
                                <div
                                  key={index}
                                  className="flex items-baseline justify-between gap-2 text-sm"
                                >
                                  <span className="shrink-0 text-xs text-muted-foreground">
                                    {reference.label}
                                  </span>
                                  <span className="truncate font-mono font-medium">
                                    {reference.value}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          {(provider.lastServicedOn || provider.nextDueOn) && (
                            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                              <CalendarClock className="h-3 w-3" />
                              {provider.lastServicedOn && `Last ${provider.lastServicedOn}`}
                              {provider.lastServicedOn && provider.nextDueOn && " · "}
                              {provider.nextDueOn && `Next ${provider.nextDueOn}`}
                            </p>
                          )}

                          {provider.notes && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {provider.notes}
                            </p>
                          )}

                          {/* Tap-to-call is the whole point on a phone. */}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {provider.phone && (
                              <a href={telHref(provider.phone)}>
                                <Button variant="outline" size="sm">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {provider.phone}
                                </Button>
                              </a>
                            )}
                            {provider.email && (
                              <a href={`mailto:${provider.email}`}>
                                <Button variant="outline" size="sm">
                                  <Mail className="mr-1 h-3 w-3" />
                                  Email
                                </Button>
                              </a>
                            )}
                            {provider.website && (
                              <a
                                href={siteHref(provider.website)}
                                target="_blank"
                                rel="noreferrer noopener"
                              >
                                <Button variant="outline" size="sm">
                                  <Globe className="mr-1 h-3 w-3" />
                                  Website
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ServiceProviderFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
        provider={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => !next && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove provider?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes &ldquo;{pendingDelete?.service}&rdquo; and its contact
              details for everyone linked to you. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
