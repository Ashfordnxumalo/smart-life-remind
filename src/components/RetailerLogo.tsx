import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { getRetailer, matchRetailerByName, retailerLogoUrl } from "@/config/retailers";

interface RetailerLogoProps {
  /** Slug of a listed retailer, or null for a hand-typed name. */
  slug: string | null;
  /** Used for the monogram fallback, so this works for unlisted retailers too. */
  name: string;
  /** Monogram colour when no logo file is present. */
  fallbackColor?: string;
  /** Chip height in px. Width adapts to the logo's own proportions. */
  height?: number;
  className?: string;
}

/**
 * Slugs with no logo file, remembered for the session. Without this, every
 * retailer without a logo would re-request a missing one each time the
 * suggestion list opens.
 */
const missingLogos = new Set<string>();

/**
 * How far the chip may stretch past square. Real logos run from 1:1 symbols to
 * 6.65:1 wordmarks; a square chip squashes the latter to an unreadable sliver
 * (Pick n Pay measured 36x8px), while letting the chip match a 6.65:1 ratio
 * outright would crowd out the retailer name beside it. This is the
 * compromise — wide marks get usable height, the row stays balanced.
 */
const MAX_ASPECT = 3;

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
  height = 40,
  className,
}: RetailerLogoProps) => {
  // Cards saved before retailerSlug existed, and names typed out in full
  // rather than picked, still resolve by name — so they get a logo too.
  const retailer = getRetailer(slug) ?? matchRetailerByName(name);
  // Keyed on the resolved slug, not the prop, which may be null while the
  // retailer was matched by name.
  const resolvedSlug = retailer?.slug ?? null;

  const [failed, setFailed] = useState(() =>
    resolvedSlug ? missingLogos.has(resolvedSlug) : false
  );
  const [aspect, setAspect] = useState<number | null>(null);

  // A different card can reuse this element, so re-evaluate against the new
  // retailer or the previous one's state would carry over to this one.
  useEffect(() => {
    setFailed(resolvedSlug ? missingLogos.has(resolvedSlug) : false);
    setAspect(null);
  }, [resolvedSlug]);

  const initials = useMemo(() => getInitials(name), [name]);

  const showImage = retailer && !failed;
  // Square until the image reports its proportions, so the chip never starts
  // wide and snaps narrow.
  const width = showImage && aspect ? height * Math.min(Math.max(aspect, 1), MAX_ASPECT) : height;

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-black/5",
        className
      )}
      style={{ height, width }}
    >
      {showImage ? (
        <img
          src={retailerLogoUrl(retailer)}
          // Decorative: the retailer name is always rendered next to this.
          alt=""
          loading="lazy"
          className="h-full w-full object-contain p-0.5"
          onLoad={(e) => {
            const img = e.currentTarget;
            if (img.naturalHeight > 0) setAspect(img.naturalWidth / img.naturalHeight);
          }}
          onError={() => {
            missingLogos.add(retailer.slug);
            setFailed(true);
          }}
        />
      ) : (
        <span
          className="font-bold leading-none"
          style={{ color: fallbackColor ?? "#475569", fontSize: height * 0.36 }}
        >
          {initials}
        </span>
      )}
    </span>
  );
};
