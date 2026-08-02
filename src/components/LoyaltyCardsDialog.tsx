import { useMemo, useState } from "react";
import { CreditCard, Plus, Search, ScanLine } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { useLoyaltyCards } from "@/hooks/useLoyaltyCards";
import { LoyaltyCardFormDialog } from "@/components/LoyaltyCardFormDialog";
import { LoyaltyCardScanView } from "@/components/LoyaltyCardScanView";
import { RetailerLogo } from "@/components/RetailerLogo";
import {
  getCardColor,
  type LoyaltyCard,
  type NewLoyaltyCard,
  type WalletCard,
} from "@/types/loyaltyCard";

interface LoyaltyCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Last 4 digits are enough to recognise a card without exposing the whole number. */
const maskNumber = (value: string) =>
  value.length > 4 ? `•••• ${value.slice(-4)}` : value;

export const LoyaltyCardsDialog = ({ open, onOpenChange }: LoyaltyCardsDialogProps) => {
  const { cards, loading, create, update, remove } = useLoyaltyCards();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoyaltyCard | null>(null);
  const [scanning, setScanning] = useState<WalletCard | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WalletCard | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter(
      (c) =>
        c.retailer.toLowerCase().includes(q) || c.cardNumber.toLowerCase().includes(q)
    );
  }, [cards, search]);

  const handleSubmit = async (data: NewLoyaltyCard) => {
    if (editing) {
      await update(editing.id, data);
      toast({ title: "Card updated", description: `${data.retailer} has been saved.` });
      // Keep the scan view in sync if it is showing the card just edited.
      setScanning((current) =>
        current && current.id === editing.id ? { ...current, ...data } : current
      );
    } else {
      await create(data);
      toast({ title: "Card added", description: `${data.retailer} is ready to scan.` });
    }
    setEditing(null);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await remove(pendingDelete.id);
      toast({
        title: "Card deleted",
        description: `${pendingDelete.retailer} has been removed.`,
        variant: "destructive",
      });
      setScanning(null);
    } catch {
      toast({
        title: "Couldn't delete card",
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
          className="max-h-[90vh] max-w-2xl overflow-y-auto"
          // Radix focuses the first focusable child on open, which here is the
          // search box — that throws up the keyboard on mobile and covers the
          // wallet the user came to look at. Focus stays on the container so
          // the trap still works, it just doesn't land in a text field.
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Loyalty Cards
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
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
                Add card
              </Button>
            </div>

            {loading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Loading cards...
              </p>
            ) : cards.length === 0 ? (
              <div className="py-10 text-center">
                <CreditCard className="mx-auto mb-3 h-12 w-12 text-muted-foreground opacity-40" />
                <p className="font-medium">No loyalty cards yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add your first card and leave the plastic at home.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No cards match &ldquo;{search}&rdquo;.
              </p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {filtered.map((card) => {
                  const accent = getCardColor(card.color);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      onClick={() => setScanning(card)}
                      className="group relative overflow-hidden rounded-xl p-4 text-left text-white shadow-medium transition-transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      style={{
                        background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
                      }}
                    >
                      <div className="flex h-full min-h-[104px] flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <RetailerLogo
                              slug={card.retailerSlug}
                              name={card.retailer}
                              fallbackColor={accent.from}
                              height={36}
                            />
                            <span className="truncate text-base font-semibold">
                              {card.retailer}
                            </span>
                          </div>
                          <ScanLine className="h-5 w-5 shrink-0 opacity-70 transition-opacity group-hover:opacity-100" />
                        </div>
                        <div>
                          <p className="font-mono text-sm tracking-wider text-white/90">
                            {maskNumber(card.cardNumber)}
                          </p>
                          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-white/60">
                            {card.sharedBy ? `Shared by ${card.sharedBy}` : "Tap to scan"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {scanning && (
        <LoyaltyCardScanView
          card={scanning}
          onClose={() => setScanning(null)}
          // The scan view is fullscreen and sits above the form and the delete
          // confirmation, so it has to step aside or they open unseen behind
          // it and the buttons look dead. Closing it drops the user back on
          // the wallet, with the form or confirmation on top.
          onEdit={(card) => {
            setScanning(null);
            setEditing(card);
            setFormOpen(true);
          }}
          onDelete={(card) => {
            setScanning(null);
            setPendingDelete(card);
          }}
        />
      )}

      <LoyaltyCardFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditing(null);
        }}
        card={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(next) => !next && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes &ldquo;{pendingDelete?.retailer}&rdquo; and its number. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
