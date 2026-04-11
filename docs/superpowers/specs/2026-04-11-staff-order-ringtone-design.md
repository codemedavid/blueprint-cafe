# Staff Order Ringtone Design

## Summary

Add a foreground-only ringtone to the staff mobile app so staff hear an audible alert when a new order appears in the live orders queue. The app should use the existing bundled asset at `apps/blueprint-cafe-staff/ringtone.mp3`.

The ringtone should play once per newly received order after the initial orders query has loaded. Orders already present on first load must remain silent.

## Goals

- Play an audible notification in the staff app when a new order arrives in real time.
- Reuse the existing `ringtone.mp3` asset already checked into the app.
- Limit the behavior to the open foreground app.
- Play one ringtone per new order, even when multiple orders arrive together.

## Non-Goals

- Push notifications
- Background or terminated-app alerts
- Backend eventing changes for notifications
- Custom ringtone settings, mute controls, or notification preferences

## Chosen Approach

Detect newly appeared order IDs inside the mobile `OrdersScreen`, then play the bundled ringtone through an Expo audio module.

This keeps the feature aligned with the app's existing real-time Convex subscription and avoids unnecessary backend work. The screen already subscribes to `api.orders.listBoardOrders`, so the ringtone behavior can be derived directly from changes to that query result.

## Alternatives Considered

### 1. Screen-local detection with client-side audio

Recommended.

- Uses the existing live query with no backend changes
- Matches the foreground-only requirement naturally
- Keeps scope small and behavior easy to test

### 2. App-level notification provider

Not selected for now.

- Creates a cleaner central notification boundary
- Adds structure the app does not currently need for a single ringtone behavior

### 3. Backend notification events

Rejected for this feature.

- Stronger event semantics
- Unnecessary complexity for a foreground-only notification tied to an already-subscribed screen

## Behavior

### Initial Load

When `OrdersScreen` receives its first successful `listBoardOrders` result, the app must record the visible order IDs without playing any ringtone.

### Subsequent Live Updates

On each later query update:

- compare the latest order IDs to the previously seen set
- identify IDs that were not present in the prior result
- play the ringtone once for each newly added ID
- update the stored ID set after processing

### Multiple Orders At Once

If multiple new orders appear in a single update, the app should play the ringtone once per order in sequence rather than overlapping playback.

### Scope

The ringtone behavior applies only while the staff app is open and the orders screen is mounted in the foreground flow. No sound should be triggered by background app state handling.

## Technical Design

### Detection

`OrdersScreen` should keep a ref containing the previously seen order IDs and a separate flag for whether the first successful load has been processed.

An effect should watch the query result:

- ignore `undefined` while the query is still loading
- on first defined result, seed the previous ID set and mark initial load complete
- on later results, diff the current set against the previous set and enqueue ringtone playback for each added ID

The comparison should be based on order IDs, not object identity, to avoid false positives from normal query re-renders.

### Audio Helper

Create a small app-local audio helper that owns ringtone playback details:

- loads the bundled `ringtone.mp3`
- plays it on demand
- serializes multiple play requests so separate orders produce separate rings without stacking on top of each other

The screen should call a simple helper API rather than embedding low-level audio setup inline.

### Dependency

Add a supported Expo audio package to the staff app dependencies. The implementation should favor the Expo module that cleanly supports bundled local audio assets in this React Native app.

## Testing

Add or update tests around `OrdersScreen` to cover:

- no ringtone on initial load
- one ringtone when one order is added after initial load
- multiple ringtone plays when multiple new orders are added after initial load

Tests should mock the ringtone playback helper or underlying audio module instead of attempting real audio playback.

## Risks And Mitigations

### Risk: Normal query refreshes replay the ringtone

Mitigation: diff only by newly added order IDs and suppress playback on the first defined result.

### Risk: Simultaneous orders produce noisy overlapping audio

Mitigation: queue playback in a helper so each new order gets one distinct ring in sequence.

### Risk: Audio setup leaks resources

Mitigation: keep audio lifecycle inside a dedicated helper and unload playback resources after each ring completes.

## Verification

- Staff app tests should prove the initial-load suppression and per-order playback rules.
- Manual verification should confirm that submitting a new order from the customer flow causes the open staff app to ring once for each new order.
