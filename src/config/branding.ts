/**
 * Product name shown in the UI. Kept in one place so a rename is a single
 * edit rather than a hunt through every header, footer and empty state.
 *
 * Note this is the *display* name only. The Firestore project, package name
 * and deploy paths still read smart-life-remind / smartreminder, and renaming
 * those would break existing data and links for no user-visible gain.
 */
export const APP_NAME = "Smart R";

export const APP_TAGLINE = "Your intelligent reminder management system";
