# Retailer logos

Logos for the retailers listed in [`src/config/retailers.ts`](../../src/config/retailers.ts).
They appear on the loyalty card tiles in the wallet and in the scan view header.

## Adding a logo

Drop the file in this folder named after the retailer's `slug`:

```
public/retailers/woolworths.svg
public/retailers/pick-n-pay.svg
public/retailers/clicks.svg
```

SVG is preferred — it stays sharp on any screen. For a different format, set
`logoFile` on that retailer's entry instead:

```ts
{ slug: "makro", name: "Makro", color: "rose", logoFile: "makro.png" }
```

Guidelines:

- **Square-ish**, roughly 128×128. The logo is rendered inside a rounded white
  chip with `object-contain`, so it is never cropped or stretched.
- **Transparent background.** The chip supplies the white.
- Keep files small — these load on every wallet open.

## No logos are bundled

This folder ships empty on purpose. Retailer logos are trademarked assets, and
whether you may embed them depends on your agreement with each retailer — that
is your call to make, not something to inherit as a default.

Nothing breaks in the meantime: any retailer without a logo file renders a
monogram in its brand colour instead, and an added file is picked up with no
code change. The same fallback covers retailers typed by hand that aren't on
the list at all.
