# UIINAPUR 2.0 — Walk Mode upgrade

This is the existing frontend with an incremental Walk Mode integration. No new dependencies are required. All source files are included, not a hosted-demo link.

## Exact implementation file list

Updated:
- components/uiinapur/App.tsx
- components/uiinapur/World.tsx

New:
- components/uiinapur/WalkExperience.tsx
- components/uiinapur/WalkController.tsx
- components/uiinapur/WalkAvatar.tsx
- components/uiinapur/walk.css
- lib/uiinapur/walk.ts
- scripts/test-walk.mjs
- tests/walk.cjs

Delivery documentation: WALK-MODE-CHANGES.md and COMPLETE-WALK-CODE.md.

## Apply to your existing project

Copy the two updated files and seven new files at their exact paths. The complete standalone project is also included. Keep your existing localStorage; no reset or migration is required. Run `npm run dev` and click “Walk Into Uiinapur” in the explorer.

`data.ts`, `store.ts`, `globals.css`, `package.json` and all other original source files are unchanged. The 495 parcel IDs, seven territories, routes and uiinapur-nation-v1 persistence key are preserved. Walk state is ephemeral and does not enter the persisted store.

## Controls

W/A/S/D walk; Shift runs; Space jumps; drag the world to orbit; scroll zooms; Escape or Exit Walk Mode returns to the captured aerial camera and selection. Mobile uses the joystick, toggle Run and Jump, canvas drag and two-finger pinch.

## Implementation

The existing world mesh supplies ground height and surface normals through raycasts. Coastline and river footprint tests prevent entering water. Substepped gravity, step-height and slope limits follow terrain. Swept horizontal rays handle buildings, trees and monuments; bounding boxes reject spawns inside solids. Camera obstruction rays shorten the follow distance. The articulated procedural avatar animates idle, walking, running and jumping without external assets.

MapControls unmount while the walk controller is mounted. Exit restores the captured aerial position/target through the existing transition. Keyboard, pointer, wheel, blur, visibility and WebGL context listeners are cleaned up. Reduced-motion preferences skip entry animation. Unsupported WebGL retains the existing SVG map and displays a disabled Walk Mode button.

Simulation buffers and Three.js objects intentionally mutate outside React rendering; narrowly documented immutability-lint exceptions cover that imperative integration. No global lint rules were changed.

## Actual validation

- npm run typecheck: PASS
- npm run lint: PASS
- npm test: PASS — existing parcel/economy/authorization/persistence tests, including 495 unique parcels in seven territories.
- node scripts/test-walk.mjs: PASS — normalized camera-relative movement, dry footprint candidates in seven territories, coastline/river rejection, shared internal border traversal, jump/gravity/landing at 20/30/60/120 Hz.
- npm run build: PASS — Next.js production webpack build and all existing routes prerendered.
- Byte comparison: original data.ts, store.ts, globals.css and package.json unchanged; only the two listed original source files changed.

GPU rendering, real-device touch behavior, camera collision edge cases and full interactive spawn/movement across the actual scene were not visually verified in this environment. Unit tests cover movement math and geographic footprints; they do not substitute for a WebGL gameplay test. On a WebGL 2 browser, verify entry/exit from a selected parcel, movement around buildings and slopes, coast/river boundaries, jumping, camera zoom/drag, mobile multitouch and blur/re-entry.

No multiplayer, NPCs, roads, plaza, interiors, building-editor expansion, chat or backend was added. Existing property editing remains as it was.
