import { useEffect, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Check, Copy, Pencil, Trash2, X } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Barcode } from "@/components/Barcode";
import { RetailerLogo } from "@/components/RetailerLogo";
import { useToast } from "@/hooks/use-toast";
import { getCardColor, type LoyaltyCard } from "@/types/loyaltyCard";

interface LoyaltyCardScanViewProps {
  card: LoyaltyCard;
  onClose: () => void;
  onEdit: (card: LoyaltyCard) => void;
  onDelete: (card: LoyaltyCard) => void;
}

/** Groups digits so a cashier can read the number aloud without losing place. */
const formatCardNumber = (value: string) =>
  /^\d+$/.test(value) ? value.replace(/(.{4})/g, "$1 ").trim() : value;

export const LoyaltyCardScanView = ({
  card,
  onClose,
  onEdit,
  onDelete,
}: LoyaltyCardScanViewProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const accent = getCardColor(card.color);

  // Scanners struggle with a dimmed screen, and phones dim aggressively on
  // idle. Holding a wake lock keeps the display lit while the barcode is up.
  useEffect(() => {
    let released = false;
    let sentinel: WakeLockSentinel | null = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          sentinel = await navigator.wakeLock.request("screen");
        }
      } catch {
        // Unsupported or denied — the barcode still renders, so carry on.
      }
    };

    void requestWakeLock();

    return () => {
      released = true;
      void sentinel?.release().catch(() => undefined);
      void released;
    };
  }, []);

  const handleCopy = async () => {
    // navigator.clipboard is undefined outside a secure context, which covers
    // plain-http testing and some in-app browsers, so fall back to the old
    // execCommand route rather than just failing there.
    const copy = async () => {
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(card.cardNumber);
          return true;
        }
      } catch {
        // Present but refused — denied permission, or an in-app browser that
        // withholds it. Fall through rather than give up.
      }

      const field = document.createElement("textarea");
      field.value = card.cardNumber;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(field);
      return ok;
    };

    try {
      if (!(await copy())) throw new Error("copy rejected");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Couldn't copy",
        description: "Copy the number manually instead.",
        variant: "destructive",
      });
    }
  };

  return (
    // A plain fixed overlay looked right but was inert: the wallet behind it is
    // a modal Radix dialog, which sets pointer-events:none on <body>, so every
    // button here was swallowed. Being a dialog in its own right puts it in a
    // real layer on top, restoring clicks and keeping the wallet open beneath.
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogPortal>
        <DialogOverlay className="bg-black/40" />
        <DialogPrimitive.Content
          className="fixed inset-0 z-[100] flex flex-col bg-white focus:outline-none"
          aria-describedby={undefined}
        >
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{
              background: `linear-gradient(135deg, ${accent.from}, ${accent.to})`,
            }}
          >
            <div className="flex min-w-0 items-center gap-3">
              <RetailerLogo
                slug={card.retailerSlug}
                name={card.retailer}
                fallbackColor={accent.from}
              />
              <div className="min-w-0">
                <DialogTitle className="truncate text-lg font-semibold">
                  {card.retailer}
                </DialogTitle>
                <p className="text-xs text-white/80">Present this at the till</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="shrink-0 text-white hover:bg-white/20 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* White background and generous quiet zone give the scanner the
              contrast and margin it needs. */}
          <div className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto bg-white px-4 py-8">
            <div className="w-full max-w-md overflow-x-auto">
              <Barcode
                value={card.cardNumber}
                format={card.barcodeFormat}
                height={150}
                width={2.5}
                className="flex min-w-fit justify-center"
              />
            </div>

            <div className="text-center">
              <p className="font-mono text-2xl font-bold tracking-wider text-black sm:text-3xl">
                {formatCardNumber(card.cardNumber)}
              </p>
              <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">
                {card.barcodeFormat}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-black"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy number
                </>
              )}
            </Button>

            {card.notes && (
              <p className="max-w-md text-center text-sm text-neutral-600">
                {card.notes}
              </p>
            )}
          </div>

          <div className="flex gap-2 border-t border-neutral-200 bg-white px-4 py-3">
            <Button
              variant="outline"
              className="flex-1 text-black"
              onClick={() => onEdit(card)}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(card)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};
