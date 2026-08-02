/**
 * Categories a household actually files providers under. Free text is allowed
 * alongside these — no fixed list survives contact with a real family — but
 * having defaults means the common cases are one tap instead of typing.
 */
export const PROVIDER_CATEGORIES = [
  // Around the house — the trades you hunt for a number for at the worst
  // possible moment, split finely because "Home Maintenance" alone buries them.
  "Home Maintenance",
  "Plumbing",
  "Electrical",
  "Appliance Repair",
  "Building & Renovation",
  "Garden & Pool",
  "Cleaning",
  "Pest Control",
  "Security",

  // Cover and health
  "Insurance",
  "Funeral Cover",
  "Medical",
  "Dental & Optical",

  // Vehicles and the bills
  "Motor",
  "Utilities",
  "Municipal",
  "Internet & Telecoms",
  "Subscriptions",

  // People and paperwork
  "Schooling",
  "Childcare",
  "Financial",
  "Tax & Accounting",
  "Legal",
  "Pets",
  "Travel",

  "Other",
] as const;

export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number] | string;

/**
 * A reference number attached to a provider — policy number, account number,
 * warranty, meter. Kept as free-form label/value pairs rather than fixed
 * fields, because what matters varies wildly: an insurer has a policy number,
 * a plumber has nothing, a medical aid has a member and a dependant code.
 */
export interface ProviderReference {
  label: string;
  value: string;
}

export interface ServiceProvider {
  id: string;
  /** What the provider is for, e.g. "Geyser service" or "Car insurance". */
  service: string;
  category: ProviderCategory;
  /** Company or person, e.g. "Miway" or "Mike". */
  providerName: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  references: ProviderReference[];
  notes: string | null;
  /** ISO date of the most recent service, when known. */
  lastServicedOn: string | null;
  /** ISO date the next service or renewal falls due. */
  nextDueOn: string | null;
  createdAt: string;
  updatedAt: string;
}

export type NewServiceProvider = Omit<
  ServiceProvider,
  "id" | "createdAt" | "updatedAt"
>;

export type ServiceProviderUpdate = Partial<
  Omit<ServiceProvider, "id" | "createdAt">
>;

/**
 * Colour per category so the directory scans quickly. Related categories
 * share a hue family — trades amber, cover indigo, bills emerald — so the
 * groups read as groups rather than as twenty unrelated dots.
 */
const CATEGORY_COLOURS: Record<string, string> = {
  // Trades — amber through orange
  "Home Maintenance": "#f59e0b",
  Plumbing: "#0891b2",
  Electrical: "#eab308",
  "Appliance Repair": "#d97706",
  "Building & Renovation": "#b45309",
  "Garden & Pool": "#65a30d",
  Cleaning: "#22c55e",
  "Pest Control": "#84cc16",
  Security: "#dc2626",

  // Cover and health — indigo through red
  Insurance: "#6366f1",
  "Funeral Cover": "#475569",
  Medical: "#ef4444",
  "Dental & Optical": "#f43f5e",

  // Vehicles and bills — blue through teal
  Motor: "#0ea5e9",
  Utilities: "#10b981",
  Municipal: "#059669",
  "Internet & Telecoms": "#3b82f6",
  Subscriptions: "#a855f7",

  // People and paperwork — violet through slate
  Schooling: "#8b5cf6",
  Childcare: "#c084fc",
  Financial: "#14b8a6",
  "Tax & Accounting": "#0d9488",
  Legal: "#64748b",
  Pets: "#ec4899",
  Travel: "#06b6d4",
};

/** Unlisted names are allowed, so anything unknown falls back to neutral. */
export const categoryAccent = (category: string): string =>
  CATEGORY_COLOURS[category] ?? "#71717a";
