import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { categoryAccent, PROVIDER_CATEGORIES } from "@/types/serviceProvider";

interface CategoryComboboxProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  /**
   * Reports whether the list is showing, so a host inside a dialog can swallow
   * the Escape that closes it. Radix handles Escape from a capture-phase
   * listener on document, so the dialog would otherwise close on the same key.
   */
  onListOpenChange?: (open: boolean) => void;
}

/**
 * Category picker that still accepts anything typed.
 *
 * This replaced a <datalist>, which looked right in the markup but not on
 * screen: it gives no control to click, and filters its options against the
 * current value — so a field pre-filled with a category showed only that one
 * entry, which reads as a broken dropdown.
 */
export const CategoryCombobox = ({
  value,
  onChange,
  id,
  onListOpenChange,
}: CategoryComboboxProps) => {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  // Typing filters; opening via the chevron shows everything, so the full list
  // is always reachable no matter what's already in the field.
  const [filtering, setFiltering] = useState(false);

  const options = useMemo(() => {
    const needle = value.trim().toLowerCase();
    if (!filtering || !needle) return [...PROVIDER_CATEGORIES];
    return PROVIDER_CATEGORIES.filter((c) => c.toLowerCase().includes(needle));
  }, [value, filtering]);

  useEffect(() => setHighlight(-1), [value]);

  useEffect(() => onListOpenChange?.(open), [open, onListOpenChange]);

  useEffect(() => {
    if (highlight >= 0) optionRefs.current[highlight]?.scrollIntoView({ block: "nearest" });
  }, [highlight]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (category: string) => {
    onChange(category);
    setOpen(false);
    setFiltering(false);
    setHighlight(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        setFiltering(false);
        setOpen(true);
        return;
      }
      setHighlight((i) => (i + 1) % Math.max(options.length, 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlight((i) => (i <= 0 ? options.length - 1 : i - 1));
      return;
    }

    if (event.key === "Enter" && open && highlight >= 0 && options[highlight]) {
      // Also stops the keystroke submitting the form.
      event.preventDefault();
      choose(options[highlight]);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <Input
        id={id}
        ref={inputRef}
        value={value}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={open ? `${id ?? "category"}-listbox` : undefined}
        autoComplete="off"
        className="pr-10"
        placeholder="Choose or type a category"
        onChange={(e) => {
          onChange(e.target.value);
          setFiltering(true);
          setOpen(true);
        }}
        onKeyDown={handleKeyDown}
      />

      <button
        type="button"
        aria-label={open ? "Hide categories" : "Show categories"}
        // Keeps focus in the field so the keyboard doesn't drop on mobile.
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          // The chevron means "show me everything". A plain toggle got this
          // wrong: with the list already open on a filtered set, clicking it
          // closed the list instead of widening it. Only close when the full
          // list is already what's on screen.
          if (open && !filtering) {
            setOpen(false);
          } else {
            setFiltering(false);
            setOpen(true);
          }
          inputRef.current?.focus();
        }}
        className="absolute right-0 top-0 flex h-full w-10 items-center justify-center rounded-r-md text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ChevronDown
          className={cn("h-4 w-4 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <ul
          id={`${id ?? "category"}-listbox`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-medium"
        >
          {options.length === 0 ? (
            <li className="px-2 py-2 text-xs text-muted-foreground">
              No match — &ldquo;{value.trim()}&rdquo; will be used as typed.
            </li>
          ) : (
            options.map((category, index) => (
              <li
                key={category}
                ref={(el) => (optionRefs.current[index] = el)}
                role="option"
                aria-selected={value === category}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(category);
                }}
                onMouseEnter={() => setHighlight(index)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm",
                  highlight === index && "bg-accent text-accent-foreground",
                  value === category && highlight !== index && "bg-muted"
                )}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: categoryAccent(category) }}
                />
                {category}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
