# UIINAPUR — Complete frontend demo source

This ZIP contains all source files for the working UIINAPUR frontend demo, packaged as a standalone Next.js App Router project. No ChatGPT, Sites, Cloudflare or API credentials are needed to run it locally.

## Quick start

Install Node.js 22.13 or newer, then open a terminal in this folder:

```sh
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

Production:

```sh
npm run build
npm start
```

Checks:

```sh
npm run typecheck
npm run lint
npm test
```

## Features

- Seven territories and 495 deterministic parcels, with coastlines and protected areas respected.
- React Three Fiber 3D scene, GSAP camera transitions and an interactive SVG fallback when WebGL 2 is unavailable.
- Citizenship onboarding and a flippable fictional passport.
- Property selection, inspectors, favorites and direct parcel links.
- Simulated acquisitions, resale listings, offers, ownership transfers, commissions and transaction history.
- Vault and fictional land deeds.
- Six building templates, colors, rotation and local persistence; orbitable WebGL preview with CSS fallback.
- Membership selection, free home-state voting, creator venue discovery and demo checkout.
- Responsive layouts, expandable mobile property panels and mobile navigation.

## Routes

| Route | Screen |
|---|---|
| `/` | Interactive nation explorer |
| `/marketplace` | Land Exchange |
| `/vault` | Passport, properties, offers and transactions |
| `/membership` | Demo membership plans |
| `/events` | Fictional state elections |
| `/districts` | Creator destinations |

## Code map

- `app/` — App Router pages, global styling and metadata.
- `components/uiinapur/App.tsx` — application views, dialogs and interactions.
- `components/uiinapur/World.tsx` — procedural 3D nation and instanced parcels/buildings.
- `components/uiinapur/FallbackWorld.tsx` — interactive SVG compatibility map.
- `components/uiinapur/BuildingPreview.tsx` — orbitable building customization preview.
- `lib/uiinapur/data.ts` — geography, deterministic parcel generation and protected land.
- `lib/uiinapur/store.ts` — Zustand state, persistence and simulated economy rules.
- `tests/economy.cjs` — meaningful ownership, transaction, geography and voting tests.

## Try the main journey

Create a citizen, search for `AUR-0001`, simulate acquisition, then visit My vault. Customize the property, create a listing and refresh. Your local state persists in this browser. Offers on other citizens' listings can be accepted or rejected through the clearly labeled seller simulation in the vault. Reset Demo restores the original nation.

## Scope

This is the full source of the implemented frontend demo, not every feature from the original long-term product brief. There is no backend, real payment, shared multiplayer state or legal land ownership. No environment variables are required. All transactions and voting remain local and fictional.

Still outside this demo: terrain LOD/spatial acceleration, full creator storefront editing, real cosmetic membership entitlements, sponsor dashboards, achievements, passport export and draggable multi-stop mobile sheets. Price charts and venue metrics are illustrative. Creator application descriptions and checkout receipts are not retained.

The development browser has WebGL disabled, so GPU rendering and frame-rate verification remain outstanding; the interactive fallback and core user journeys were browser-tested. Physical-device mobile testing remains outstanding.

## Validation

Standalone Next.js production build, TypeScript check, ESLint and economy tests passed. Dependencies were supplied from the existing installed package tree for verification; run `npm install` locally before starting.
