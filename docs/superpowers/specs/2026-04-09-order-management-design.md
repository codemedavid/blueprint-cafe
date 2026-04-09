# Order Management Design

## Goal

Deliver the first working staff-facing order management flow in the Expo mobile app so cafe staff can see incoming orders in real time and advance them through the kitchen workflow.

## Current State

- Convex already stores submitted checkout orders in the `orders` table through [convex/orders.ts](/Users/codemedavid/Documents/blueprint/blueprint-cafe/convex/orders.ts).
- The existing order schema only allows `status: "pending"` in [convex/orderFields.ts](/Users/codemedavid/Documents/blueprint/blueprint-cafe/convex/orderFields.ts).
- The staff app already exists at `apps/blueprint-cafe-staff`, but its `OrdersBoard` screen is still a placeholder in [apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx).
- Staff authentication is currently a temporary local password gate and is not part of this feature’s scope.

## Scope

This phase adds operational order management for staff.

In scope:

- Extend the Convex order model to support the staff workflow statuses.
- Add a bounded Convex query for loading board orders for the mobile app.
- Add a staff mutation that advances an order forward through the workflow.
- Replace the placeholder `OrdersBoard` screen with a real-time mobile order board.
- Show submitted order details on each order card.
- Group the board into separate vertical sections for `pending`, `preparing`, `ready`, and `completed`.
- Keep completed orders visible on the board.

Out of scope:

- Editing customer details, notes, payment method, totals, or items after submission
- Cancelling orders
- Push notifications
- Historical analytics and reporting
- Production-grade staff authentication and permissions
- A separate order detail screen unless implementation pressure makes it necessary

## Chosen Approach

Build a single live `OrdersBoard` screen in the staff app with four stacked sections, one per status.

This is the smallest design that satisfies the operational requirement without overfitting the app to a desktop-style board. It preserves a full kitchen overview on mobile, avoids horizontal layout complexity, and keeps the backend contract narrow by limiting staff writes to forward-only status transitions.

## Alternatives Considered

### 1. Four stacked status sections on one screen

Recommended.

- Preserves visibility across all statuses on a phone screen
- Fits the current simple navigation structure
- Keeps gestures, layout, and testing complexity low

### 2. Kanban-style horizontal columns

Rejected for phase 1.

- Matches “board” language better
- Adds mobile layout and scrolling complexity immediately
- Makes card readability worse on narrow screens

### 3. One list with filter chips

Rejected for phase 1.

- Simpler to build
- Hides overall operational state unless staff switch filters constantly

## Workflow

The first-pass order workflow is linear and status-only:

- `pending -> preparing`
- `preparing -> ready`
- `ready -> completed`
- `completed` is terminal

New web checkout orders must still be created as `pending`.

Staff cannot move orders backwards, skip statuses, or edit any other order fields in this phase. This keeps the operational contract explicit and removes ambiguity around reconciliation.

## Data Model

The current single-literal status validator should be widened to an explicit union:

- `pending`
- `preparing`
- `ready`
- `completed`

The rest of the submitted order snapshot remains unchanged so the board shows exactly what checkout saved.

To support future operational timing without another schema break, add optional per-stage timestamps:

- `startedAt`
- `readyAt`
- `completedAt`

Rules:

- `submittedAt` is still assigned on initial creation.
- `startedAt` is only set when moving to `preparing`.
- `readyAt` is only set when moving to `ready`.
- `completedAt` is only set when moving to `completed`.
- Existing `pending` rows remain valid without the optional timestamp fields.

## Backend API

The backend surface for this phase should stay small:

- `createOrder`: unchanged responsibility, still used by checkout to create `pending` orders
- `listBoardOrders`: returns a bounded set of recent orders for the staff board
- `advanceOrderStatus`: moves one order to its next valid status and rejects invalid transitions

### Query behavior

`listBoardOrders` should:

- return a bounded collection rather than all rows
- prioritize most recent operationally relevant orders
- include enough fields for direct rendering in the staff app
- support grouping in the client by status sections

### Mutation behavior

`advanceOrderStatus` should:

- accept only `orderId`
- read the current stored status server-side
- derive the next valid status internally
- reject attempts to advance a `completed` order
- stamp the corresponding stage timestamp when a transition succeeds

The client should never send an arbitrary target status for this first pass. That avoids invalid transitions and keeps the mobile action model consistent with the workflow.

## Indexing And Ordering

The board query should be supported by schema indexes rather than in-memory filtering.

The design target is:

- predictable ordering inside each status section
- newest orders first within a section
- bounded reads that remain safe as the table grows

If one index cannot satisfy all board reads cleanly, add explicit indexes that match the actual query shapes instead of falling back to `filter`.

## Orders Board

The `OrdersBoard` screen should become the primary authenticated staff surface.

It should render four vertical sections in this order:

1. `pending`
2. `preparing`
3. `ready`
4. `completed`

Each section should show:

- a status title
- an order count
- cards for each order in that status
- an empty state when there are no orders in that section

### Order cards

Each card should show the submitted order snapshot directly on the board:

- customer name
- service type
- payment method name
- notes when present
- submitted time
- total
- full item list with quantities

Each non-terminal card should expose one clear primary action:

- `pending`: `Start Preparing`
- `preparing`: `Mark Ready`
- `ready`: `Complete Order`

Completed cards remain visible but have no action button.

## Interaction Behavior

- The board subscribes live to Convex data and updates without polling.
- While a status mutation is in flight for a card, its action button is disabled.
- If a status update fails, the user stays on the board and sees a clear retryable error.
- The board should remain useful even when one section is empty or one mutation fails.

For phase 1, card-level actions are preferred over a separate detail screen because staff only need to review submitted contents and advance status.

## Error Handling

- Loading failures should show a visible error state instead of a blank screen.
- Mutation failures should not remove or locally move the card.
- The app should avoid duplicate transitions by disabling the action during submission.
- If the board has no orders at all, show an explicit empty operational state.

## Verification Strategy

The implementation should be verified at both backend and mobile layers.

### Backend verification

- New checkout orders still save as `pending`
- `listBoardOrders` returns a bounded result with expected ordering
- `advanceOrderStatus` advances `pending -> preparing -> ready -> completed`
- `advanceOrderStatus` rejects advancing a completed order
- Stage timestamps are set only when their corresponding transition occurs

### Mobile verification

- The staff app renders all four status sections
- Orders appear in the correct section based on Convex status
- Cards display submitted order details from the stored snapshot
- Status buttons invoke the correct next-step action
- Successful updates move cards to the next section in real time
- Failed updates surface a usable error without corrupting board state

## Future Extension Path

This phase should leave clean room for later enhancements:

- history filtering or dedicated completed-order screens
- richer kitchen timing displays using stored stage timestamps
- order cancellation flows
- real staff authentication and role-based access
- push notifications for new incoming orders

The phase remains intentionally narrow: the mobile staff app gets a reliable live order board first, with status advancement only.
