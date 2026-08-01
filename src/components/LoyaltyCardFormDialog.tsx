import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Barcode } from "@/components/Barcode";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  BARCODE_FORMATS,
  CARD_COLORS,
  validateCardNumber,
  type BarcodeFormat,
  type CardColor,
  type LoyaltyCard,
  type NewLoyaltyCard,
} from "@/types/loyaltyCard";

interface LoyaltyCardFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; omit to add a new card. */
  card?: LoyaltyCard | null;
  onSubmit: (data: NewLoyaltyCard) => Promise<void>;
}

export const LoyaltyCardFormDialog = ({
  open,
  onOpenChange,
  card,
  onSubmit,
}: LoyaltyCardFormDialogProps) => {
  const [retailer, setRetailer] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [barcodeFormat, setBarcodeFormat] = useState<BarcodeFormat>("CODE128");
  const [color, setColor] = useState<CardColor>("indigo");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Result of the real encode attempt, tagged with the input it applies to so a
  // stale verdict can never be applied to a number the user has since changed.
  const [encodeCheck, setEncodeCheck] = useState<{ key: string; valid: boolean } | null>(
    null
  );
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setRetailer(card?.retailer ?? "");
    setCardNumber(card?.cardNumber ?? "");
    setBarcodeFormat(card?.barcodeFormat ?? "CODE128");
    setColor(card?.color ?? "indigo");
    setNotes(card?.notes ?? "");
    setEncodeCheck(null);
  }, [open, card]);

  const trimmedNumber = cardNumber.trim();
  const formatError = cardNumber ? validateCardNumber(cardNumber, barcodeFormat) : null;
  const canPreview = Boolean(trimmedNumber) && !formatError;

  const encodeKey = `${barcodeFormat}:${trimmedNumber}`;
  const handleValidChange = useCallback(
    (valid: boolean) => setEncodeCheck({ key: encodeKey, valid }),
    [encodeKey]
  );

  // Length rules alone can't catch everything — EAN/UPC carry a check digit, so
  // a correctly-sized number can still be unscannable. Trust the encoder.
  const encodeError =
    canPreview && encodeCheck?.key === encodeKey && !encodeCheck.valid
      ? `This number fails the ${barcodeFormat} check digit, so it won't scan. Re-check it against the card.`
      : null;

  const numberError = formatError ?? encodeError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!retailer.trim()) {
      toast({
        title: "Retailer required",
        description: "Give the card a name so you can find it later.",
        variant: "destructive",
      });
      return;
    }

    const validation = validateCardNumber(cardNumber, barcodeFormat);
    if (validation) {
      toast({ title: "Check the card number", description: validation, variant: "destructive" });
      return;
    }

    // A card that can't be encoded is worthless at the till — refuse to store it.
    if (encodeError) {
      toast({
        title: "Check the card number",
        description: encodeError,
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        retailer: retailer.trim(),
        cardNumber: cardNumber.trim(),
        barcodeFormat,
        color,
        notes: notes.trim() || null,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to save loyalty card:", error);
      toast({
        title: "Couldn't save card",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const activeFormat = BARCODE_FORMATS.find((f) => f.value === barcodeFormat);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card ? "Edit card" : "Add loyalty card"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="retailer">
              Retailer <span className="text-destructive">*</span>
            </Label>
            <Input
              id="retailer"
              placeholder="e.g. Woolworths, Clicks, Pick n Pay"
              value={retailer}
              onChange={(e) => setRetailer(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNumber">
              Card number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="cardNumber"
              placeholder="Type the number printed under the barcode"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              autoComplete="off"
              inputMode="text"
              className={cn("font-mono", numberError && "border-destructive")}
            />
            {numberError ? (
              <p className="text-xs text-destructive">{numberError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Enter it exactly as printed — this is what the scanner reads.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Barcode type</Label>
            <Select
              value={barcodeFormat}
              onValueChange={(v) => setBarcodeFormat(v as BarcodeFormat)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BARCODE_FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activeFormat && (
              <p className="text-xs text-muted-foreground">{activeFormat.hint}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Card colour</Label>
            <div className="flex flex-wrap gap-2">
              {CARD_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  aria-label={c.label}
                  aria-pressed={color === c.value}
                  className={cn(
                    "h-9 w-9 rounded-full ring-offset-2 transition-all",
                    color === c.value && "ring-2 ring-foreground"
                  )}
                  style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cardNotes">Notes</Label>
            <Textarea
              id="cardNotes"
              placeholder="Anything worth remembering — PIN hint, tier, expiry…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          {/* Live preview so a bad number is caught here, not at the till. */}
          {canPreview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="overflow-x-auto rounded-lg border border-border bg-white p-3">
                <Barcode
                  value={trimmedNumber}
                  format={barcodeFormat}
                  height={60}
                  width={1.6}
                  className="flex min-w-fit justify-center"
                  onValidChange={handleValidChange}
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-primary"
              disabled={submitting || Boolean(numberError)}
            >
              {submitting ? "Saving..." : card ? "Save changes" : "Add card"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
