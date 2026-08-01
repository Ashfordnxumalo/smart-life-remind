import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getRetailer, retailerLogoUrl } from "@/config/retailers";

interface RetailerLogoProps {
  /** Slug of a listed retailer, or null for a hand-typed name. */
  slug: string | null;
  /** Used for the monogram fallback, so this works for unlisted retailers too. */
  name: string;
  /** Monogram colour when no logo file is present. */
  fallbackColor?: string;
  className?: string;
}

/**
 * Slugs with no logo file, remembered for the session. The folder ships empty,
 * so without this every retailer row would re-request a missing logo each time
 * the suggestion list opens.
 */
const missingLogos = new Set<string>();

/** "Pick n Pay" -> "PP", "Woolworths" -> "W". Connectors are dropped. */
const getInitials = (name: string): string => {
  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);
  const meaningful = words.filter((w) => w.length > 1);
  const source = meaningful.length > 0 ? meaningful : words;
  return source
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
};

/**
 * Logo chip for a retailer. Falls back to a monogram when no logo file has
 * been added (see public/retailers/README.md) or the retailer isn't listed,
 * so a card always shows something deliberate rather than a broken image.
 */
export const RetailerLogo = ({
  slug,
  name,
  fallbackColor,
  className,
}: RetailerLogoProps) => {
  const retailer = getRetailer(slug);
  const [failed, setFailed] = useState(() => (slug ? missingLogos.has(slug) : false));

  // A different card can reuse this element, so re-evaluate against the new
  // slug or the previous retailer's 404 would suppress this one's logo.
  useEffect(() => setFailed(slug ? missingLogos.has(slug) : false), [slug]);

  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5",
        className
      )}
    >
      {retailer && !failed ? (
        <img
          src={retailerLogoUrl(retailer)}
          // Decorative: the retailer name is always rendered next to this.
          alt=""
          loading="lazy"
          className="h-full w-full object-contain p-1"
          onError={() => {
            missingLogos.add(retailer.slug);
            setFailed(true);
          }}
        />
      ) : (
        <span
          className="text-sm font-bold leading-none"
          style={{ color: fallbackColor ?? "#475569" }}
        >
          {initials}
        </span>
      )}
    </span>
  );
};
