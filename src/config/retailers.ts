import type { CardColor } from "@/types/loyaltyCard";

/**
 * A retailer known to the app. Everything here is optional to extend — adding
 * an entry to KNOWN_RETAILERS below is all that's needed for it to appear in
 * the retailer suggestions and pick up a logo.
 */
export interface Retailer {
  /**
   * Stable identifier. Also the default logo filename, so keep it filesystem
   * safe (lowercase, hyphens). Changing a slug orphans the logo and the slug
   * stored on existing cards, so treat it as permanent once shipped.
   */
  slug: string;
  name: string;
  /**
   * Extra terms that should match this retailer while typing — abbreviations,
   * common misspellings, and the name of the loyalty programme itself, since
   * people often think of the card by its programme name.
   */
  aliases?: string[];
  /** Preset accent applied to the card when this retailer is picked. */
  color: CardColor;
  /**
   * Logo filename inside public/retailers/. Defaults to `<slug>.svg`; set it
   * explicitly when dropping in a different format, e.g. "woolworths.png".
   */
  logoFile?: string;
}

/**
 * Cards South Africans commonly carry — retail loyalty programmes, plus the
 * medical schemes and store-credit providers whose cards get presented the
 * same way.
 *
 * This list is meant to be edited — append entries as new ones come up. It is
 * not exhaustive by design: anything typed that isn't listed here is still
 * stored exactly as the user wrote it, just without a logo or slug.
 *
 * Deliberately no default barcode format per entry: card symbologies vary
 * between programmes and even between card generations, and a wrong default
 * produces a card that fails at the till. The format stays an explicit choice.
 */
export const KNOWN_RETAILERS: Retailer[] = [
  {
    slug: "woolworths",
    name: "Woolworths",
    aliases: ["Woolies", "WRewards", "W Rewards"],
    color: "emerald",
    logoFile: "woolworths.png",
  },
  {
    slug: "pick-n-pay",
    name: "Pick n Pay",
    aliases: ["PnP", "Pick and Pay", "Smart Shopper"],
    color: "sky",
    logoFile: "pick-n-pay.png",
  },
  {
    slug: "checkers",
    name: "Checkers",
    aliases: ["Xtra Savings", "Sixty60"],
    color: "rose",
    logoFile: "checkers.png",
  },
  {
    slug: "shoprite",
    name: "Shoprite",
    aliases: ["Xtra Savings"],
    color: "rose",
    logoFile: "shoprite.png",
  },
  {
    slug: "clicks",
    name: "Clicks",
    aliases: ["ClubCard", "Club Card"],
    color: "sky",
    logoFile: "clicks.png",
  },
  {
    slug: "dis-chem",
    name: "Dis-Chem",
    aliases: ["Dischem", "Dis Chem", "Benefit"],
    color: "emerald",
    logoFile: "dis-chem.png",
  },
  {
    slug: "spar",
    name: "SPAR",
    aliases: ["Spar Rewards"],
    color: "emerald",
    logoFile: "spar.png",
  },
  {
    slug: "makro",
    name: "Makro",
    aliases: ["mCard", "M Card"],
    color: "rose",
    logoFile: "makro.png",
  },
  {
    slug: "game",
    name: "Game",
    color: "amber",
  },
  {
    slug: "edgars",
    name: "Edgars",
    aliases: ["Edgars Club"],
    color: "rose",
    logoFile: "edgars.png",
  },
  {
    slug: "truworths",
    name: "Truworths",
    color: "slate",
  },
  {
    slug: "mr-price",
    name: "Mr Price",
    aliases: ["MRP", "MRP Money", "Mr Price Money"],
    color: "rose",
    logoFile: "mr-price.png",
  },
  {
    slug: "foschini",
    name: "Foschini",
    aliases: ["TFG", "TFG Rewards"],
    color: "violet",
    logoFile: "foschini.png",
  },
  {
    slug: "cape-union-mart",
    name: "Cape Union Mart",
    aliases: ["Explorer Club", "CUM"],
    color: "emerald",
  },
  {
    slug: "sportsmans-warehouse",
    name: "Sportsmans Warehouse",
    aliases: ["Sportsman's Warehouse"],
    color: "slate",
  },
  {
    slug: "exclusive-books",
    name: "Exclusive Books",
    aliases: ["Fanatics"],
    color: "slate",
    logoFile: "exclusive-books.png",
  },
  {
    slug: "builders",
    name: "Builders",
    aliases: ["Builders Warehouse"],
    color: "amber",
    logoFile: "builders.png",
  },
  {
    slug: "engen",
    name: "Engen",
    color: "sky",
  },
  {
    slug: "sasol",
    name: "Sasol",
    aliases: ["Sasol Rewards"],
    color: "sky",
    logoFile: "sasol.png",
  },
  {
    slug: "nandos",
    name: "Nando's",
    aliases: ["Nandos"],
    color: "rose",
  },

  // Medical schemes and store credit. Not retailers, but the card comes out of
  // the same wallet and carries a membership number the same way.
  {
    slug: "discovery-health",
    name: "Discovery Health",
    aliases: ["Discovery", "Vitality", "Discovery Medical Aid"],
    color: "amber",
    logoFile: "discovery-health.png",
  },
  {
    slug: "bonitas",
    name: "Bonitas",
    aliases: ["Bonitas Medical Fund"],
    color: "emerald",
    logoFile: "bonitas.png",
  },
  {
    slug: "gems",
    name: "GEMS",
    aliases: ["Government Employees Medical Scheme"],
    color: "sky",
    logoFile: "gems.jpg",
  },
  {
    slug: "rcs",
    name: "RCS",
    aliases: ["RCS Card", "RCS Store Card"],
    color: "violet",
    logoFile: "rcs.png",
  },
];

const bySlug = new Map(KNOWN_RETAILERS.map((r) => [r.slug, r]));

export const getRetailer = (slug: string | null | undefined): Retailer | undefined =>
  slug ? bySlug.get(slug) : undefined;

/** Resolves the public URL of a retailer logo, honouring a subdirectory deploy. */
export const retailerLogoUrl = (retailer: Retailer): string =>
  `${import.meta.env.BASE_URL}retailers/${retailer.logoFile ?? `${retailer.slug}.svg`}`;

/**
 * Finds the listed retailer a typed name refers to, so a card typed by hand
 * still picks up the logo when it matches something we know.
 */
export const matchRetailerByName = (name: string): Retailer | undefined => {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return KNOWN_RETAILERS.find(
    (r) =>
      r.name.toLowerCase() === needle ||
      r.aliases?.some((a) => a.toLowerCase() === needle)
  );
};

/**
 * Suggestions for the retailer field. Name matches outrank alias matches, and
 * prefix matches outrank matches in the middle, so typing "pi" surfaces
 * "Pick n Pay" ahead of a retailer that merely contains those letters.
 */
export const searchRetailers = (queryText: string, limit = 6): Retailer[] => {
  const needle = queryText.trim().toLowerCase();
  if (!needle) return KNOWN_RETAILERS.slice(0, limit);

  const scored: Array<{ retailer: Retailer; score: number }> = [];

  for (const retailer of KNOWN_RETAILERS) {
    const name = retailer.name.toLowerCase();
    let score = Infinity;

    if (name.startsWith(needle)) score = 0;
    else if (name.includes(needle)) score = 1;
    else {
      for (const alias of retailer.aliases ?? []) {
        const a = alias.toLowerCase();
        if (a.startsWith(needle)) score = Math.min(score, 2);
        else if (a.includes(needle)) score = Math.min(score, 3);
      }
    }

    if (score !== Infinity) scored.push({ retailer, score });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.retailer.name.localeCompare(b.retailer.name))
    .slice(0, limit)
    .map((s) => s.retailer);
};
