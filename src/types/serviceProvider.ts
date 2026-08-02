/**
 * Categories a household actually files providers under. Free text is allowed
 * alongside these — no fixed list survives contact with a real family — but
 * having defaults means the common cases are one tap instead of typing.
 */
export const PROVIDER_CATEGORIES = [
  "Home Maintenance",
  "Insurance",
  "Medical",
  "Motor",
  "Utilities",
  "Schooling",
  "Financial",
  "Legal",
  "Pets",
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

/** Colour per category so the directory scans quickly. */
export const categoryAccent = (category: string): string => {
  switch (category) {
    case "Home Maintenance":
      return "#f59e0b";
    case "Insurance":
      return "#6366f1";
    case "Medical":
      return "#ef4444";
    case "Motor":
      return "#0ea5e9";
    case "Utilities":
      return "#10b981";
    case "Schooling":
      return "#8b5cf6";
    case "Financial":
      return "#14b8a6";
    case "Legal":
      return "#64748b";
    case "Pets":
      return "#ec4899";
    default:
      return "#71717a";
  }
};
