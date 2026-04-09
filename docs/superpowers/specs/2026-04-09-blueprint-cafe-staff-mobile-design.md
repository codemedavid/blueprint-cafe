# Blueprint Cafe Staff Mobile Design

## Goal

Build an Android-first Expo mobile app for Blueprint Cafe staff to monitor and manage incoming orders in real time using Convex as the backend source of truth, while keeping the implementation portable to iPhone later.

## Current State

- The existing customer-facing app is a Vite + React web frontend.
- Checkout already writes normalized orders to Convex before opening Facebook Messenger.
- The current Convex `orders` table stores new orders with `status: "pending"` and `source: "web_checkout"`.
- There is no mobile app, no staff order-management UI, and no status-update workflow beyond initial order creation.

## Scope

This phase delivers a staff-facing mobile app for live order handling.

In scope:

- Create a new Expo app inside this repository for staff order management.
- Target Android first while keeping the implementation compatible with future iPhone support.
- Connect the Expo app to the existing Convex deployment for live queries and mutations.
- Add staff login with a temporary hardcoded password gate.
- Add a real-time orders board showing active kitchen orders.
- Add an order-detail view with kitchen status actions.
- Extend Convex with order-list/detail queries, indexed reads, and status-update mutations.

Out of scope:

- Customer ordering from mobile
- Full staff/admin tooling outside order handling
- Production-grade authentication and user management
- Push notifications
- Historical reporting dashboards
- Replacing existing Supabase usage for menu/admin content

## Chosen Approach

Create a separate Expo app in the repository, backed by the same Convex deployment as the web app.

This keeps the mobile surface isolated from the existing Vite app, reduces risk to current web functionality, and makes it straightforward to evolve the staff app without forcing an immediate monorepo restructuring. Shared behavior should be limited to stable contracts such as order types and status definitions where that helps avoid drift.

## Alternatives Considered

### 1. Separate Expo app in the repo

Recommended.

- Clean separation between customer web and staff mobile concerns
- Lowest integration risk for the existing app
- Easy to ship Android first while preserving a clear path to iPhone later

### 2. Fold Expo into the current web app structure

Rejected for phase 1.

- Could improve sharing later
- Adds repo complexity immediately
- Increases the chance of disrupting current web work

### 3. Package the web app in a mobile shell

Rejected for phase 1.

- Fastest to demo superficially
- Weak fit for an operations app that needs mobile-native interaction patterns and later device capabilities

## Architecture

### Repository Structure

- Add a new Expo app at `apps/blueprint-cafe-staff`.
- Keep the existing web app unchanged as the customer ordering surface.
- Continue using the same Convex backend for order intake and staff order management.

### Mobile App Structure

The mobile app should have three main screens:

- `LoginScreen`: temporary password gate for staff
- `OrdersBoardScreen`: live grouped view of active orders
- `OrderDetailScreen`: full order contents with status transition actions

Navigation should be lightweight and platform-safe so the same structure can support iPhone later without redesign.

### Backend Structure

Convex becomes the shared system of record for the staff workflow:

- Web checkout creates new `pending` orders.
- Staff mobile app subscribes to active orders in real time.
- Staff actions update order status through Convex mutations.

The existing order-write path must remain intact. New mobile functionality should extend the current model rather than replace it.

## Order Workflow

The kitchen workflow for this phase uses the following statuses:

- `pending`
- `preparing`
- `ready`
- `completed`
- `cancelled`

Allowed transitions:

- `pending -> preparing`
- `preparing -> ready`
- `ready -> completed`
- any non-terminal active state -> `cancelled`

`completed` and `cancelled` are terminal states. The default live board should focus on active work and exclude terminal states unless a later history screen is added.

## Data Model Changes

The current schema hardcodes `status` to `"pending"`. That must be widened to support the kitchen workflow while preserving the behavior that new web orders are still created as `pending`.

Required changes:

- Replace the current single-literal status validator with a union of all supported status values.
- Keep `source: "web_checkout"` unchanged for orders created by the current website.
- Preserve the existing order snapshot fields so the mobile app reads the same stable order payload the web app writes.
- Add indexes to support efficient active-order queries and single-order reads as needed.

The status model should stay narrow and explicit. No extra workflow states should be introduced in phase 1.

## Data Flow

### Order Intake

1. Customer submits checkout in the web app.
2. The existing Convex mutation writes a new order with `status: "pending"`.
3. The mobile board receives the new order automatically via Convex subscriptions.

### Order Management

1. Staff unlocks the app with the temporary password.
2. The orders board subscribes to active orders grouped by status.
3. Staff opens an order detail view.
4. Staff advances the order or cancels it using a Convex mutation.
5. The board updates in real time on all connected devices without polling.

## Authentication

Phase 1 uses a temporary device-level access gate, not full identity-based auth.

- The app opens to a login screen asking for a hardcoded password.
- The password should be read from Expo config or environment, not duplicated as a UI literal in multiple files.
- After successful entry, the app should persist an authenticated flag locally on-device so staff are not forced to log in every app launch.
- The login boundary should be isolated from the order-management screens so it can be replaced later with real staff authentication.

This is a convenience barrier for a trusted cafe device, not a full security model.

## UI Behavior

### Orders Board

The board should prioritize speed and readability for active operations:

- Show active orders grouped by status
- Surface the newest urgent work clearly
- Include key summary data such as customer name, service type, item count, total, and submitted time
- Make it obvious when an order needs the next action

### Order Detail

The detail screen should show:

- full customer and fulfillment details
- full line-item breakdown
- notes and payment method snapshot
- clear primary action for the next allowed status
- cancel action where valid

### Login

The login screen should be minimal and operationally fast. Styling should be intentional but not overdesigned. The goal is a dependable staff tool, not a consumer brand experience.

## Error Handling

- If Convex fails to load orders, the app should show a visible error or offline state instead of a blank screen.
- If a status mutation fails, the app should keep the user on the same screen and surface a retryable error.
- Loading and mutation states should be explicit enough to prevent duplicate taps and operator confusion.
- The app should not crash or navigate away on transient backend failures.

Optimistic updates are optional. If they introduce ambiguity, prefer explicit per-action loading states over speculative UI changes.

## Cross-Platform Strategy

Although Android is the initial target, the implementation should avoid painting the project into an Android-only corner.

- Prefer Expo-managed libraries that already support both Android and iOS.
- Avoid Android-specific assumptions in layout, navigation, and storage choices.
- Keep environment and app configuration structured so an iPhone build later is mostly packaging and QA, not a rewrite.

## Verification Strategy

Verification for this phase should cover both backend and mobile behavior.

### Backend

- Confirm new web checkout orders still save successfully as `pending`.
- Verify active-order queries return the expected grouped or ordered data.
- Verify status-update mutations enforce the allowed transitions.

### Mobile

- Smoke test password login flow
- Verify live order board renders current active orders from Convex
- Verify opening an order detail shows the full order snapshot
- Verify status updates move orders between board states in real time
- Verify backend failures surface usable errors

## Future Extension Path

This phase should leave clean seams for later work:

- replace hardcoded password auth with real staff authentication
- add completed/cancelled history views
- add notifications for new incoming orders
- support iPhone builds
- add richer staff/admin tooling beyond order handling

The phase-1 design is intentionally narrow: deliver a reliable real-time staff order app first, then extend from a working operational base.
