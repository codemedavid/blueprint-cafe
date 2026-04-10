# Order Management Design

## Goal

Deliver the first working staff-facing order management flow in the Expo mobile app so cafe staff can see incoming orders in real time, move them through the kitchen workflow, and cancel only eligible orders.

## Current State

- Convex already stores submitted checkout orders in the `orders` table through [convex/orders.ts](/Users/codemedavid/Documents/blueprint/blueprint-cafe/convex/orders.ts).
- The existing order schema only allows `status: "pending"` in [convex/orderFields.ts](/Users/codemedavid/Documents/blueprint/blueprint-cafe/convex/orderFields.ts).
- The staff app already has an authenticated `Orders` list plus `OrderDetail` flow in [apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx), [apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/apps/blueprint-cafe-staff/src/screens/OrdersScreen.tsx), and [apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/apps/blueprint-cafe-staff/src/screens/OrderDetailScreen.tsx).
- The current staff UI is intentionally compact and dark, which no longer matches the Blueprint Cafe public brand direction.
- Staff authentication is currently a temporary local password gate and is not part of this feature’s scope.

## Scope

This phase updates the existing staff order-management experience rather than replacing it with a new navigation model.

In scope:

- Extend the Convex order model to support the staff workflow statuses plus cancellation.
- Add backend rules that allow cancellation only from `pending` and `preparing`.
- Keep a bounded Convex query for loading recent staff orders.
- Keep the `Orders` list plus `OrderDetail` flow as the app’s primary authenticated experience.
- Redesign the list and detail layout to use clearer visual sections and proper top spacing.
- Shift the staff UI to a Blueprint Cafe light theme that fits the public site branding while staying operationally dense.
- Keep completed and canceled orders visible to staff.

Out of scope:

- Editing customer details, notes, payment method, totals, or items after submission
- Cancelling `ready` or `completed` orders
- Push notifications
- Historical analytics and reporting
- Production-grade staff authentication and permissions

## Chosen Approach

Build on the existing `Orders` list and `OrderDetail` screens instead of returning to a board layout.

This matches the current app structure, keeps the implementation focused, and gives the redesign room to improve spacing, sectioning, and branding without reopening the higher-level navigation decision. The list screen remains the queue overview. The detail screen remains the single action surface for status changes and cancellation.

## Alternatives Considered

### 1. Refresh the existing orders list and detail flow

Recommended.

- Preserves the app’s current information architecture
- Gives the cleanest path to improve layout and branding
- Keeps operational actions concentrated in one detail screen

### 2. Restore a board-style screen

Rejected.

- Would require undoing the newer list-detail direction
- Adds unnecessary layout complexity on mobile
- Conflicts with the clearer sectioned flow now preferred for staff

### 3. Split active and historical orders into separate top-level screens

Rejected for this phase.

- Could improve long-term focus
- Adds navigation churn before the core queue is polished
- Not necessary to deliver the requested redesign and cancellation behavior

## Workflow

The first-pass operational workflow is:

- `pending -> preparing`
- `preparing -> ready`
- `ready -> completed`
- `pending -> canceled`
- `preparing -> canceled`

`completed` and `canceled` are terminal.

New web checkout orders must still be created as `pending`.

Staff cannot move orders backwards, skip statuses, or cancel orders once they reach `ready` or `completed`. This keeps the workflow explicit and prevents ambiguous recovery paths after an order is nearly or fully fulfilled.

## Data Model

The current single-literal status validator should be widened to an explicit union:

- `pending`
- `preparing`
- `ready`
- `completed`
- `canceled`

The rest of the submitted order snapshot remains unchanged so the staff app shows exactly what checkout saved.

To support operational timing without another schema break, add optional per-stage timestamps:

- `startedAt`
- `readyAt`
- `completedAt`
- `canceledAt`

Rules:

- `submittedAt` is still assigned on initial creation.
- `startedAt` is only set when moving to `preparing`.
- `readyAt` is only set when moving to `ready`.
- `completedAt` is only set when moving to `completed`.
- `canceledAt` is only set when moving to `canceled`.
- Existing `pending` rows remain valid without the optional timestamp fields.

## Backend API

The backend surface for this phase should stay small:

- `createOrder`: unchanged responsibility, still used by checkout to create `pending` orders
- `listBoardOrders`: continues returning a bounded set of recent staff orders, even if the mobile UI is now list-detail rather than board-based
- `advanceOrderStatus`: moves one order to its next valid forward status and rejects invalid transitions
- `cancelOrder`: cancels one order if and only if its current status is `pending` or `preparing`

### Query behavior

`listBoardOrders` should:

- return a bounded collection rather than all rows
- prioritize most recent operationally relevant orders
- include enough fields for direct rendering in the staff app
- include canceled orders so staff retain operational context

### Mutation behavior

`advanceOrderStatus` should:

- accept only `orderId`
- read the current stored status server-side
- derive the next valid status internally
- reject attempts to advance a terminal order
- stamp the corresponding stage timestamp when a transition succeeds

`cancelOrder` should:

- accept only `orderId`
- read the current stored status server-side
- reject cancellation unless the order is `pending` or `preparing`
- set `status` to `canceled`
- stamp `canceledAt` when the mutation succeeds

The client should never send arbitrary target statuses for this phase. The backend owns the transition rules.

## Indexing And Ordering

The orders query should continue to be supported by schema indexes rather than in-memory filtering over an unbounded table.

The design target is:

- predictable ordering inside each status tab
- newest orders first within a status
- bounded reads that remain safe as the table grows

If one index cannot satisfy all reads cleanly, add explicit indexes that match the real query shapes instead of falling back to broad `filter` usage.

## Orders List Screen

The `Orders` screen remains the primary authenticated staff surface.

It should render:

1. a branded light-theme header with proper top breathing room
2. a compact status-tab strip with counts
3. a clearly separated order list beneath it

The list should feel more intentionally sectioned than it does today, even though it remains a single scrolling screen. The redesign target is improved hierarchy and spacing, not a denser pile of rows.

Each row should stay compact enough for operational use, but spacing between the top header, tab strip, and list content should be visibly more generous and deliberate.

Statuses should be available in this order:

1. `pending`
2. `preparing`
3. `ready`
4. `completed`
5. `canceled`

## Order Detail Screen

The detail screen becomes the strongest expression of the redesign.

It should render the order as a set of clear content sections, such as:

- customer and service details
- item list
- notes when present
- timing and status metadata
- totals and payment details

The action area should be visually distinct from the content sections so the primary workflow action is obvious and the cancel action reads as secondary and destructive.

## Visual Direction

The staff app should move from the current dark operational palette to a Blueprint Cafe light theme.

The design target is a hybrid:

- public-site branding cues from Blueprint Cafe
- operational density appropriate for staff work
- clearer section boundaries and spacing than the current compact UI

Visual characteristics:

- soft off-white or cream background
- blue primary accents aligned with the public site
- dark slate text for readability
- subtle borders instead of heavy dark blocks
- warmer neutral surfaces where elevation is needed

This should feel branded and polished, but still fast to scan during service.

## Interaction Behavior

- The orders list subscribes live to Convex data and updates without polling.
- Staff tap a row to open the detail screen.
- The detail screen owns all state-changing actions.
- While a mutation is in flight, the relevant buttons are disabled.
- If an action fails, the user remains on the detail screen and sees a clear retryable error.

Action rules:

- `pending`: primary action `Start Preparing`, secondary destructive action `Cancel Order`
- `preparing`: primary action `Mark Ready`, secondary destructive action `Cancel Order`
- `ready`: primary action `Complete Order`
- `completed`: no action
- `canceled`: no action

Canceled orders remain visible in the queue under their own status so staff do not lose operational context.

## Error Handling

- Loading failures should show a visible error state instead of a blank screen.
- Mutation failures should not locally move or remove an order.
- Duplicate transitions and duplicate cancellations should be prevented by disabling actions while submitting.
- If the query returns no orders, show an explicit empty operational state.

## Verification Strategy

The implementation should be verified at both backend and mobile layers.

### Backend verification

- New checkout orders still save as `pending`
- `listBoardOrders` returns a bounded result with expected ordering
- `advanceOrderStatus` advances `pending -> preparing -> ready -> completed`
- `advanceOrderStatus` rejects advancing `completed` and `canceled` orders
- `cancelOrder` accepts `pending` and `preparing`
- `cancelOrder` rejects `ready`, `completed`, and already `canceled` orders
- Stage timestamps are set only when their corresponding transition occurs

### Mobile verification

- The staff app renders the redesigned light-theme orders screen with clearer top spacing and section separation
- Status tabs include `canceled`
- Orders appear in the correct tab based on Convex status
- The detail screen renders grouped content sections clearly
- The detail screen shows `Cancel Order` only for `pending` and `preparing`
- Successful updates move orders to the next status in real time
- Successful cancellation moves an order into the `canceled` tab in real time
- Failed updates and cancellations surface usable errors without corrupting local state

## Future Extension Path

This phase should leave clean room for later enhancements:

- history filtering or dedicated archived-order views
- richer kitchen timing displays using stored stage timestamps
- cancellation reasons and audit trails
- real staff authentication and role-based access
- push notifications for new incoming orders

The phase remains intentionally narrow: polish the existing staff order-management flow, align it with Blueprint Cafe branding, and add tightly controlled cancellation behavior.
