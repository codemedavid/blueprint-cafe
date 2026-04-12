# Staff Order Alert Design

## Summary

Add a foreground-only order alert to the staff mobile app so staff reliably notice new orders in the live queue. The alert should combine three cues when a new order appears while the app is open: vibration, bundled ringtone playback, and a visible local notification banner.

The alert should fire once per newly received order after the initial orders query has loaded. Orders already present on first load must remain silent.

## Goals

- Play an audible notification in the staff app when a new order arrives in real time.
- Vibrate the device when a new order arrives in the open app.
- Show a foreground local notification banner as a fallback and visual cue.
- Reuse the existing `ringtone.mp3` asset already checked into the app.
- Limit the behavior to the open foreground app.
- Play one full alert per new order, even when multiple orders arrive together.

## Non-Goals

- Push token registration
- Remote push delivery
- Background or terminated-app alert delivery
- Backend eventing changes for notifications
- Custom ringtone settings, mute controls, or notification preferences

## Chosen Approach

Detect newly appeared order IDs inside the mobile `OrdersScreen`, then trigger a single app-local alert helper that owns:

- vibration
- bundled ringtone playback through Expo audio
- local foreground notification scheduling through Expo notifications

This keeps the feature aligned with the app's existing real-time Convex subscription and avoids unnecessary backend work. The screen already subscribes to `api.orders.listBoardOrders`, so the ringtone behavior can be derived directly from changes to that query result.

## Alternatives Considered

### 1. Screen-local detection with client-side audio

Partially selected.

- Uses the existing live query with no backend changes
- Matches the foreground-only requirement naturally
- Keeps scope small and behavior easy to test

### 2. App-level notification provider

Not selected for now.

- Creates a cleaner central notification boundary
- Adds structure the app does not currently need for a single ringtone behavior

### 3. Full notification-only implementation

Rejected for this feature.

- Requires relying on native notification sound configuration for the primary alert path
- Adds rebuild and channel-management complexity without solving the screen-local detection problem

## Behavior

### Initial Load

When `OrdersScreen` receives its first successful `listBoardOrders` result, the app must record the visible order IDs without triggering any alert.

### Subsequent Live Updates

On each later query update:

- compare the latest order IDs to the previously seen set
- identify IDs that were not present in the prior result
- trigger one alert sequence for each newly added ID
- update the stored ID set after processing

### Multiple Orders At Once

If multiple new orders appear in a single update, the app should trigger one alert per order in sequence rather than overlapping ringtone playback or collapsing them into one combined event.

### Scope

The alert behavior applies only while the staff app is open and the orders screen is mounted in the foreground flow. No sound, vibration, or local notification should be triggered by background app state handling.

## Technical Design

### Detection

`OrdersScreen` should keep a ref containing the previously seen order IDs and a separate flag for whether the first successful load has been processed.

An effect should watch the query result:

- ignore `undefined` while the query is still loading
- on first defined result, seed the previous ID set and mark initial load complete
- on later results, diff the current set against the previous set and enqueue one alert for each added ID

The comparison should be based on order IDs, not object identity, to avoid false positives from normal query re-renders.

### Alert Helper

Create a small app-local alert helper that owns vibration, ringtone playback, and local notification details:

- configures foreground notification handling once
- creates the Android notification channel used for local foreground banners
- vibrates on demand
- loads and replays the bundled `ringtone.mp3`
- schedules a local notification banner on demand
- serializes multiple play requests so separate orders produce separate alerts without stacking on top of each other

The screen should call a simple helper API rather than embedding low-level audio setup inline.

### Dependency

Use the already installed Expo audio package for in-app sound playback and add Expo notifications for local foreground banners. The implementation should avoid push token registration and use notifications only as an app-local fallback and visual cue.

### Notification Behavior

Foreground local notifications should use concise order-alert copy, for example:

- title: `New order received`
- body: `Open staff orders to review it.`

On Android, the app should create a high-importance channel with vibration enabled. The local notification path is a foreground supplement to the in-app ringtone, not a replacement for it.

## Testing

Add or update tests around `OrdersScreen` to cover:

- no alert on initial load
- one alert when one order is added after initial load
- multiple alert calls when multiple new orders are added after initial load

Add or update alert-helper tests to cover:

- ringtone playback is attempted
- vibration is triggered
- local notification scheduling is triggered
- alert calls remain serialized for multiple new orders

Tests should mock the alert helper dependencies instead of attempting real audio playback, real vibration, or real notification delivery.

## Risks And Mitigations

### Risk: Normal query refreshes replay the alert

Mitigation: diff only by newly added order IDs and suppress playback on the first defined result.

### Risk: Simultaneous orders produce noisy overlapping cues

Mitigation: queue alert execution in a helper so each new order gets one distinct sequence in order.

### Risk: Local notifications duplicate the app sound without helping

Mitigation: keep the banner copy short and treat it as a visual fallback while preserving the audible ringtone as the primary cue.

### Risk: Notification setup becomes coupled to push implementation later

Mitigation: keep all notification usage local to the app alert helper and avoid push registration in this feature.

## Verification

- Staff app tests should prove the initial-load suppression and per-order alert rules.
- Manual verification should confirm that submitting a new order from the customer flow causes the open staff app to vibrate, play the ringtone, and show a foreground banner once for each new order.
