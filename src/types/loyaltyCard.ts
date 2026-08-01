/**
 * Symbologies actually used on retail loyalty cards. CODE128 is the safe
 * default — it accepts alphanumeric data of any length and is what most
 * POS scanners expect. The fixed-length numeric formats are included
 * because some retailers print those specifically.
 */
export const BARCODE_FORMATS = [
  {
    value: "CODE128",
    label: "Code 128",
    hint: "Most common — letters and numbers, any length",
  },
  { value: "EAN13", label: "EAN-13", hint: "Exactly 13 digits" },
  { value: "EAN8", label: "EAN-8", hint: "Exactly 8 digits" },
  { value: "UPC", label: "UPC-A", hint: "Exactly 12 digits" },
  { value: "CODE39", label: "Code 39", hint: "Uppercase letters and numbers" },
  { value: "ITF14", label: "ITF-14", hint: "Exactly 14 digits" },
] as const;

export type BarcodeFormat = (typeof BARCODE_FORMATS)[number]["value"];

/** Preset accents so a wallet of cards stays visually distinguishable. */
export const CARD_COLORS = [
  { value: "indigo", label: "Indigo", from: "#6366f1", to: "#8b5cf6" },
  { value: "emerald", label: "Emerald", from: "#10b981", to: "#14b8a6" },
  { value: "rose", label: "Rose", from: "#f43f5e", to: "#ec4899" },
  { value: "amber", label: "Amber", from: "#f59e0b", to: "#f97316" },
  { value: "sky", label: "Sky", from: "#0ea5e9", to: "#06b6d4" },
  { value: "violet", label: "Violet", from: "#8b5cf6", to: "#d946ef" },
  { value: "slate", label: "Slate", from: "#475569", to: "#64748b" },
] as const;

export type CardColor = (typeof CARD_COLORS)[number]["value"];

export interface LoyaltyCard {
  id: string;
  /** Always the name as the user left it, listed retailer or not. */
  retailer: string;
  /**
   * Slug of the matching entry in KNOWN_RETAILERS, or null for a name typed by
   * hand. Stored rather than re-derived from the name so renaming a retailer
   * in the config doesn't silently drop the logo from existing cards.
   */
  retailerSlug: string | null;
  cardNumber: string;
  barcodeFormat: BarcodeFormat;
  color: CardColor;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewLoyaltyCard = Omit<LoyaltyCard, "id" | "createdAt" | "updatedAt">;
export type LoyaltyCardUpdate = Partial<Omit<LoyaltyCard, "id" | "createdAt">>;

export const getCardColor = (color: CardColor) =>
  CARD_COLORS.find((c) => c.value === color) ?? CARD_COLORS[0];

/**
 * Formats with a fixed digit count fail to render at all if the data is
 * wrong, so validate before we try — an unscannable card is worse than a
 * rejected form.
 */
export const validateCardNumber = (
  value: string,
  format: BarcodeFormat
): string | null => {
  const trimmed = value.trim();
  if (!trimmed) return "Card number is required.";

  const digitsOnly = /^\d+$/;
  const exactDigits: Partial<Record<BarcodeFormat, number>> = {
    EAN13: 13,
    EAN8: 8,
    UPC: 12,
    ITF14: 14,
  };

  const required = exactDigits[format];
  if (required !== undefined) {
    if (!digitsOnly.test(trimmed)) return `${format} must contain digits only.`;
    if (trimmed.length !== required) {
      return `${format} must be exactly ${required} digits (you entered ${trimmed.length}).`;
    }
  }

  if (format === "CODE39" && !/^[0-9A-Z\-. $/+%]+$/.test(trimmed)) {
    return "Code 39 supports uppercase letters, numbers and - . $ / + % only.";
  }

  return null;
};
