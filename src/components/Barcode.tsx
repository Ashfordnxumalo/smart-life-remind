import { useEffect, useRef, useState } from "react";
import JsBarcode from "jsbarcode";
import { cn } from "@/lib/utils";
import type { BarcodeFormat } from "@/types/loyaltyCard";

interface BarcodeProps {
  value: string;
  format: BarcodeFormat;
  /** Bar height in px. Scanners need vertical run to acquire a read. */
  height?: number;
  /** Bar width multiplier. Larger = easier read, wider output. */
  width?: number;
  displayValue?: boolean;
  className?: string;
  /**
   * Reports whether the value actually encodes. JsBarcode enforces rules a
   * length check cannot — EAN/UPC check digits, for example — so callers
   * should treat this as the authority on validity rather than guessing.
   */
  onValidChange?: (valid: boolean) => void;
}

export const Barcode = ({
  value,
  format,
  height = 100,
  width = 2,
  displayValue = false,
  className,
  onValidChange,
}: BarcodeProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [error, setError] = useState<string | null>(null);

  // Kept in a ref so changing the callback identity does not re-run render.
  const onValidChangeRef = useRef(onValidChange);
  useEffect(() => {
    onValidChangeRef.current = onValidChange;
  }, [onValidChange]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    // JsBarcode leaves the previous barcode in place when the new value fails
    // to encode. Wipe it first, otherwise a failed switch (say CODE128 →
    // EAN13) would keep showing the old barcode as though it had succeeded —
    // a barcode that no longer matches the format the card is saved under.
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.removeAttribute("width");
    svg.removeAttribute("height");
    svg.removeAttribute("viewBox");
    svg.removeAttribute("style");

    // JsBarcode invokes `valid` synchronously during render, so this is
    // settled by the time we read it.
    let encoded = true;

    try {
      // Rendered as SVG so it stays crisp when scaled up for scanning —
      // a canvas bitmap blurs and can defeat the scanner.
      JsBarcode(svg, value, {
        format,
        height,
        width,
        displayValue,
        margin: 10,
        background: "#ffffff",
        lineColor: "#000000",
        fontSize: 16,
        valid: (isValid: boolean) => {
          encoded = isValid;
        },
      });
    } catch {
      encoded = false;
    }

    setError(encoded ? null : `This number is not valid for ${format}.`);
    onValidChangeRef.current?.(encoded);
  }, [value, format, height, width, displayValue]);

  // The <svg> stays mounted even while erroring — unmounting it would null the
  // ref, and the render effect could then never run again to clear the error.
  return (
    <div className={className}>
      <svg
        ref={svgRef}
        role="img"
        aria-label={`Barcode for ${value}`}
        className={cn(error && "hidden")}
      />
      {error && (
        <div className="flex min-h-[120px] flex-1 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
    </div>
  );
};
