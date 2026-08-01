import { useEffect, useMemo, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { RetailerLogo } from "@/components/RetailerLogo";
import { cn } from "@/lib/utils";
import {
  KNOWN_RETAILERS,
  matchRetailerByName,
  searchRetailers,
  type Retailer,
} from "@/config/retailers";
import { getCardColor } from "@/types/loyaltyCard";

interface RetailerComboboxProps {
  value: string;
  /**
   * Fires on every keystroke as well as on selection. `retailer` is the listed
   * retailer the name resolves to, or null when it's a free-text name.
   */
  onChange: (name: string, retailer: Retailer | null) => void;
  id?: string;
  placeholder?: string;
  /**
   * Reports whether the suggestion list is showing. A host inside a dialog
   * needs this to swallow the Escape that closes the list, so one keypress
   * doesn't also dismiss the dialog.
   */
  onListOpenChange?: (open: boolean) => void;
}

/**
 * Retailer field with suggestions from the known-retailer list. Suggestions
 * are an accelerator, never a constraint — any name can be typed and is saved
 * exactly as entered, which matters because no fixed list can cover every
 * corner shop with a loyalty card.
 */
export const RetailerCombobox = ({
  value,
  onChange,
  id,
  placeholder,
  onListOpenChange,
}: RetailerComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const suggestions = useMemo(() => searchRetailers(value), [value]);

  // Once the field holds a retailer's actual name the list is just a redundant
  // row covering the fields below, so drop it. Deliberately not done for alias
  // matches: someone who typed "PnP" still needs the row to adopt "Pick n Pay".
  const isCanonicalName = useMemo(() => {
    const needle = value.trim().toLowerCase();
    return needle !== "" && KNOWN_RETAILERS.some((r) => r.name.toLowerCase() === needle);
  }, [value]);

  const showList =
    open && !isCanonicalName && (suggestions.length > 0 || value.trim() !== "");

  useEffect(() => setHighlight(-1), [value]);

  useEffect(() => onListOpenChange?.(showList), [showList, onListOpenChange]);

  useEffect(() => {
    if (highlight >= 0) {
      optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlight]);

  // Pointer-down outside closes the list. Click would be too late: the field
  // below would already have taken the press.
  useEffect(() => {
    if (!showList) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [showList]);

  const select = (retailer: Retailer) => {
    onChange(retailer.name, retailer);
    setOpen(false);
    setHighlight(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((i) => (i + 1) % Math.max(suggestions.length, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
      return;
    }

    if (event.key === "Enter" && open && highlight >= 0 && suggestions[highlight]) {
      // Also stops the form submitting on the keystroke that picks a retailer.
      event.preventDefault();
      select(suggestions[highlight]);
      return;
    }

    if (event.key === "Escape" && showList) {
      // Only closes the list. Stopping propagation here cannot keep the
      // surrounding dialog open — Radix handles Escape from a capture-phase
      // listener on document, which has already run by now — so the dialog
      // side is handled by the host via onListOpenChange below.
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-autocomplete="list"
        aria-controls={showList ? `${id ?? "retailer"}-listbox` : undefined}
        aria-activedescendant={
          highlight >= 0 ? `${id ?? "retailer"}-option-${highlight}` : undefined
        }
        onChange={(e) => {
          const next = e.target.value;
          onChange(next, matchRetailerByName(next) ?? null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showList && (
        <ul
          id={`${id ?? "retailer"}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-medium"
        >
          {suggestions.map((retailer, index) => {
            const accent = getCardColor(retailer.color);
            return (
              <li
                key={retailer.slug}
                id={`${id ?? "retailer"}-option-${index}`}
                ref={(el) => (optionRefs.current[index] = el)}
                role="option"
                aria-selected={highlight === index}
                // Selection runs on mousedown so the input never loses focus
                // first, which would close the list before the click landed.
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(retailer);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-sm",
                  highlight === index && "bg-accent text-accent-foreground"
                )}
              >
                <RetailerLogo
                  slug={retailer.slug}
                  name={retailer.name}
                  fallbackColor={accent.from}
                  height={32}
                />
                <span className="truncate font-medium">{retailer.name}</span>
              </li>
            );
          })}

          {suggestions.length === 0 && (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              Not on the list — &ldquo;{value.trim()}&rdquo; will be saved exactly as
              you typed it.
            </li>
          )}
        </ul>
      )}
    </div>
  );
};
