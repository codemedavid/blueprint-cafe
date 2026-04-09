# Staff Orders List Redesign

## Summary

Redesign the staff mobile app from a board-based workflow into a compact list-based management interface. The primary surface becomes a dense queue with status tabs for `Pending`, `Preparing`, `Ready`, and `Completed`. Tapping a queue row opens a dedicated order detail screen. Status changes only happen inside the detail screen.

The goal is to make the app faster to scan, easier to manage, and visually more restrained. The redesign should reduce oversized cards, remove board language and layout patterns, and establish a more minimalist operational UI.

## Goals

- Replace the board paradigm with a list-first workflow.
- Keep status separation explicit through tabs rather than columns.
- Make the main orders view compact and scan-friendly.
- Move full order context and workflow actions into a dedicated detail screen.
- Improve the overall UI system so it feels more polished, quieter, and less oversized.

## Non-Goals

- Changing backend workflow states or status rules.
- Adding new order statuses.
- Adding drag-and-drop or board interactions.
- Introducing complex analytics, sorting logic, or multi-select bulk actions in this redesign.

## Product Direction

### Primary Navigation

The authenticated experience remains centered on order management, but the main destination is renamed from a board-oriented screen to a generic orders screen. The login screen should also stop referring to a board and instead describe entry into the staff orders queue.

### Orders Screen

The main screen is a compact queue organized by tabs:

- `Pending`
- `Preparing`
- `Ready`
- `Completed`

Each tab shows only orders in that status. The screen should feel dense enough for operational use while still remaining readable on a phone. The UI should avoid large cards, heavy padding, and oversized typography.

### Order Detail Screen

Selecting a row opens a dedicated detail screen. This screen becomes the single place where staff can:

- review the full order
- inspect notes and line items
- confirm service and payment context
- move the order to its next status

The list screen is intentionally action-light. Workflow mutation is deferred to the detail screen to keep the queue uncluttered.

## Information Architecture

### Orders Tab Screen

The orders screen should include:

- a compact title area
- status tabs near the top
- a dense list for the selected status
- lightweight loading and error states

Each row should show only high-value summary fields:

- customer name
- service type
- item count
- total
- optional recency or timestamp cue if available from existing data

Rows should be tappable and visually restrained. They should read more like list entries or table rows than standalone cards.

### Detail Screen

The detail screen should show:

- customer name
- current status
- service type
- payment method
- total
- notes, when present
- full line items with quantities
- primary action for advancing status, when the order is not completed

The detail screen should also preserve clear read hierarchy so staff can verify the order before changing state.

## Interaction Model

### Tab Switching

Tabs switch between status queues. The selected tab should be immediately obvious, but the visual treatment should stay minimalist rather than pill-heavy or overly colorful.

### Row Selection

Tapping a row navigates to the detail screen for that order. There is no inline expansion on the list screen.

### Status Advancement

Only the detail screen contains the status action. The button label should continue mapping to the next logical workflow step:

- `Pending` -> `Start Preparing`
- `Preparing` -> `Mark Ready`
- `Ready` -> `Complete Order`
- `Completed` -> no action button

### Loading and Error Handling

The list screen should show lightweight loading and updating feedback without dominating the layout. Errors should be visible but understated, consistent with the more minimal visual system.

## Visual Design Direction

### Core Principles

- Compact over spacious
- Structured over decorative
- Neutral surfaces over high-contrast stacked cards
- Clear hierarchy over large typography

### Styling Changes

The redesign should move away from the current large dark-card board look. The updated UI should:

- tighten vertical and horizontal spacing
- reduce font sizes for headings and body copy
- flatten the visual system into list rows with subtle separators
- use smaller radii and lighter emphasis
- keep strong contrast for readability while avoiding a bulky feel

The screen should feel purpose-built for staff operations rather than a showcase dashboard.

### Queue Row Design

Rows should present information in a table-like way while still fitting React Native mobile constraints. That means:

- consistent columns or aligned content blocks
- concise metadata
- minimal wrapping where possible
- restrained dividers instead of elevated cards

### Detail Screen Design

The detail screen can use grouped sections, but those sections should still remain compact. It should not revert to the oversized card style from the existing board UI.

## Data and Technical Considerations

### Data Reuse

Existing order data should be reused as much as possible. The redesign is primarily a presentation and navigation change. If the current list query already returns all orders needed for the queue, the screen can filter client-side by selected tab. If not, a status-aware query can be introduced as long as it follows existing Convex guidance and index patterns.

### Navigation Changes

The current single-screen authenticated flow will expand to at least two authenticated screens:

- `Orders`
- `OrderDetail`

Navigation naming should be updated to remove board terminology from route and UI labels.

### Component Structure

The board-oriented components should be replaced or refactored into list-oriented pieces with clearer responsibilities:

- tab control for statuses
- compact order row component
- orders list screen container
- order detail screen container

The new structure should favor smaller components with explicit responsibilities rather than one screen holding all board grouping logic.

## Testing Strategy

Update tests to reflect the redesigned flow:

- orders screen renders tabs instead of board sections
- selected tab shows only matching orders
- tapping an order navigates to the detail screen
- detail screen shows notes and line items
- status action exists only on the detail screen
- completed orders show no advance action

Existing tests that assert board terminology or board grouping should be rewritten rather than patched around.

## Risks and Mitigations

### Risk: Table-Like Layout Becomes Cramped On Mobile

Mitigation: use a row structure that prioritizes 3 to 5 key fields, allows controlled truncation, and avoids trying to mimic a full desktop table.

### Risk: Removing Inline Actions Slows Down Power Use

Mitigation: keep row taps responsive, make the detail screen fast to parse, and place the primary status action in a consistent prominent location.

### Risk: Dense UI Reduces Readability

Mitigation: reduce size and spacing deliberately, but preserve contrast, hierarchy, and touch targets appropriate for mobile.

## Implementation Boundaries

This redesign should include:

- screen restructuring
- navigation changes
- new compact list UI
- dedicated detail screen
- refreshed copy and naming
- corresponding test updates

This redesign should not include:

- backend workflow redesign
- admin analytics surfaces
- advanced filtering beyond status tabs unless already trivial in the current architecture
