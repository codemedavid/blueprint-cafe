# Convex Order Intake Design

## Goal

Persist every checkout order to Convex before opening Facebook Messenger, so Convex becomes the source of record for incoming orders and later order-management work can build on a stable data model.

## Current State

- The customer-facing app is a Vite + React frontend.
- Supabase currently powers menu data, categories, payment methods, site settings, and admin content.
- Checkout in [src/components/Checkout.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/src/components/Checkout.tsx) formats an order message and opens Facebook Messenger.
- No order is currently persisted in any database.
- No Convex project exists in the repository yet.

## Scope

This phase only adds reliable order intake into Convex.

In scope:

- Add Convex to the repository and connect the frontend to the provided Convex deployment.
- Define an `orders` table and a typed mutation for creating orders.
- Save the normalized checkout payload to Convex with default status `pending`.
- Block Messenger redirect if the Convex write fails.
- Keep the current Messenger handoff after a successful save.
- Add minimal automated coverage around order payload normalization.

Out of scope:

- Order management UI
- Order status editing
- Replacing Supabase for menu or admin data
- Payment receipt upload handling
- Replacing Messenger as the customer confirmation channel

## Chosen Approach

Use direct client-to-Convex writes from the React checkout flow.

This is the smallest change that satisfies the requirement that all orders are received in Convex first. Supabase remains unchanged for existing menu and admin reads. Convex is introduced only for order intake and future order-management work.

## Alternatives Considered

### 1. Direct client-to-Convex mutation

Recommended.

- Smallest integration surface
- Fits the existing frontend-only architecture
- Uses Convex’s typed client APIs directly from React
- Keeps the order write blocking and explicit inside checkout

### 2. Convex HTTP endpoint relay

Rejected for phase 1.

- Works, but adds another layer over behavior that Convex mutations already handle
- Makes the frontend integration heavier without improving the current use case

### 3. Separate backend proxy

Rejected for phase 1.

- Adds a new server tier to a project that does not currently need one
- Increases deployment and operational complexity for no immediate gain

## Architecture

The repository remains split by responsibility:

- Supabase continues serving menu, categories, payment methods, and site settings.
- Convex handles only order persistence.
- The React app is wrapped in Convex’s React provider so checkout can call a typed mutation.

The new order submission path is:

1. Customer completes checkout details and payment selection.
2. The payment-step submit action builds one normalized order payload.
3. The frontend calls a Convex `createOrder` mutation.
4. If the mutation succeeds, the app opens Facebook Messenger with the existing formatted order message.
5. If the mutation fails, the app stays on checkout and does not open Messenger.

## Environment And Secrets

- The browser app should use the public Convex deployment URL through a Vite environment variable such as `VITE_CONVEX_URL`.
- The provided Convex deploy key is for local CLI/project setup only and must not be committed or exposed to browser code.
- Existing `.env` handling already keeps environment files out of git, so Convex configuration should follow the same pattern as Supabase.

## Order Data Model

The Convex `orders` table should store a complete snapshot of the submitted checkout so later order-management views do not depend on live catalog data staying unchanged.

Each order record should include:

- `status`: `"pending"` for every newly created order
- `source`: `"web_checkout"`
- `customerName`
- `contactNumber`
- `serviceType`: `"dine-in" | "pickup" | "delivery"`
- `pickupTimeLabel`: only populated for pickup orders
- `paymentMethodId`: the selected payment method id from Supabase
- `paymentMethodName`: the display name at time of order
- `notes`
- `subtotal`
- `serviceChargeEnabled`
- `serviceChargeLabel`
- `serviceChargePercentage`
- `serviceChargeAmount`
- `total`
- `submittedAt`: mutation-generated timestamp in milliseconds

Each order should also store an `items` array with one snapshot per line item. Each line item should include:

- `lineItemId`: the cart-specific id used by the UI
- `menuItemId`: the stable source menu item id
- `name`
- `category`
- `quantity`
- `basePrice`
- `unitPrice`
- `lineTotal`
- `selectedVariations`: array of `{ id, name, type, price }`
- `selectedAddOns`: array of `{ id, name, category, price, quantity }`

The separate `menuItemId` is required because the current cart logic rewrites `id` into a cart-line identifier in [src/hooks/useCart.ts](/Users/codemedavid/Documents/blueprint/blueprint-cafe/src/hooks/useCart.ts). The order record must preserve both ids.

## Checkout Behavior Changes

Checkout keeps its current two-step UX and Messenger handoff, but the final button behavior changes:

- The final submit button enters a loading state while the Convex mutation is running.
- The button is disabled during submission to prevent duplicate writes.
- On success, the app opens Messenger with the existing formatted message, clears the cart, and returns the customer to the menu state.
- On failure, the app shows an inline error message and leaves all entered checkout data intact so the customer can retry.

## Failure Handling

Failure handling is strict because the primary requirement is that every order reaches Convex first.

- No Messenger redirect if the Convex mutation fails
- No cart clear on failure
- No silent fallback to another persistence mechanism
- Console logging is acceptable for debugging, but the customer-facing UI must also show a retryable error state

## Verification Strategy

Phase 1 verification has two layers.

### Automated

Add a small test around the order-payload normalization helper to verify:

- Stable mapping of checkout customer fields
- Correct pricing breakdown
- Preservation of both `lineItemId` and `menuItemId`
- Correct default status and source values
- Correct pickup-time handling by service type

Because the repository currently has no test harness, this phase may introduce the minimum Vitest setup needed to run this focused test.

### Manual

Manual smoke verification should confirm:

1. The app can connect to the configured Convex deployment.
2. A valid checkout creates a new document in Convex.
3. The document contains `status: "pending"` and the full normalized item payload.
4. Messenger opens only after the order is saved.
5. A forced mutation failure prevents Messenger from opening and shows an error in checkout.

## Future Extension Path

This order model is intentionally shaped for the later order-management app.

The next phase can add:

- Convex queries for listing orders
- Status-update mutations
- Admin filtering and sorting
- Order detail views

Those features can build on the same `orders` table without changing the phase-1 intake contract.
