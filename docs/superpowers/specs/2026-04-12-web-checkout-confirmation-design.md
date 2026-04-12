# Web Checkout Confirmation Screen Design

## Goal

Add a post-checkout confirmation screen to the customer web ordering flow so customers can review a final order summary before being redirected to Facebook Messenger. The screen should start a 5-second countdown as soon as it appears, allow an immediate manual redirect through a `Proceed to Messenger` button, and clear the cart only after the Messenger tab or window has been opened.

## Current Context

The customer ordering app in [src/App.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/src/App.tsx) already manages an in-memory `currentView` state for `menu`, `cart`, and `checkout`. The checkout submission logic in [src/components/Checkout.tsx](/Users/codemedavid/Documents/blueprint/blueprint-cafe/src/components/Checkout.tsx) builds a normalized order payload, saves it to Convex, opens Messenger immediately, then calls the parent success callback, which clears the cart and returns the app to the menu.

That current flow has two issues for the requested behavior:
- There is no stable success view after checkout submission.
- The cart is cleared before we can distinguish between "order saved" and "Messenger handoff attempted."

## Approaches Considered

### 1. Add a new top-level `confirmation` view in `App.tsx`

This keeps the existing single-page view switching model and introduces one additional success state after checkout. `App.tsx` becomes the owner of the saved order snapshot, the redirect completion callback, and the final cart-clearing transition.

Pros:
- Smallest change to the existing architecture
- Keeps checkout form concerns separate from post-submit countdown concerns
- Avoids introducing routing changes for a single new screen

Cons:
- Adds one more branch to the local `currentView` state

### 2. Render confirmation inline inside `Checkout.tsx`

This would reuse the checkout component after submission and swap the form for a success panel.

Pros:
- Fewer top-level state changes

Cons:
- Blends checkout input state, order persistence, and post-submit redirect behavior into one component
- Makes the confirmation logic harder to test in isolation

### 3. Convert the customer flow to route-based screens

This would create explicit URLs for cart, checkout, and confirmation.

Pros:
- Better long-term navigability if the customer app grows

Cons:
- Unnecessary scope for the current request
- Requires broader changes than the existing app structure justifies

## Recommended Approach

Use approach 1: add a new `confirmation` view in `App.tsx` and a dedicated confirmation component that receives a saved order snapshot plus redirect callbacks. This fits the app’s current structure, keeps responsibilities clear, and limits the change to the customer checkout flow.

## Architecture

### App state ownership

`App.tsx` should become the owner of:
- The current app view: `menu`, `cart`, `checkout`, `confirmation`
- The last successfully submitted order snapshot used for confirmation rendering

On checkout success, `Checkout` should no longer open Messenger directly. Instead, it should pass the normalized saved-order payload upward, and `App.tsx` should switch the view to `confirmation`.

### Checkout responsibilities

`Checkout.tsx` should continue to:
- Validate customer input
- Build the normalized order payload
- Save the order through the existing Convex mutation
- Surface submit errors inline when persistence fails

`Checkout.tsx` should stop being responsible for:
- Opening Messenger
- Clearing the cart
- Returning the user to the menu

Its success callback should change from "order placed" to "order submitted successfully with this order snapshot."

### Confirmation screen responsibilities

A new confirmation component should:
- Render a success heading such as `Order confirmed`
- Show customer and payment summary from the saved order snapshot
- Show the full order item summary, including quantities, variations, add-ons, subtotal, service charge or packaging fee when applicable, and total
- Start a visible 5-second countdown as soon as the component mounts
- Attempt to open Messenger automatically when the countdown reaches zero
- Provide a `Proceed to Messenger` button that triggers the same redirect immediately
- Prevent duplicate redirect attempts once one attempt is in progress or has succeeded

### Messenger handoff responsibilities

Messenger redirect logic should move into the confirmation layer so it can use the saved order snapshot rather than live cart state. The redirect helper should:
- Build the Messenger URL from the existing order message formatter in [src/lib/orders.ts](/Users/codemedavid/Documents/blueprint/blueprint-cafe/src/lib/orders.ts)
- Call `window.open(..., '_blank', 'noopener,noreferrer')`
- Treat the redirect as successful when the open attempt returns a window handle
- Only after a successful open attempt:
  - clear the cart
  - clear the stored confirmation snapshot
  - return the app to the menu view

If the browser blocks the popup or `window.open` returns `null`, the app should remain on the confirmation screen and allow the user to try the button again manually.

## Data Flow

1. Customer completes the checkout form and presses the existing submit action.
2. `Checkout.tsx` builds the normalized order snapshot with `buildOrderSubmission`.
3. `Checkout.tsx` persists the order with the existing Convex mutation.
4. If the mutation fails, checkout stays in place and shows the existing inline error state.
5. If the mutation succeeds, `Checkout.tsx` passes the normalized order snapshot to `App.tsx`.
6. `App.tsx` stores that snapshot and changes the active view to `confirmation`.
7. The confirmation screen mounts, initializes a 5-second countdown, and renders the order summary.
8. When the countdown reaches zero, the screen attempts to open Messenger.
9. If the customer presses `Proceed to Messenger` before zero, the screen attempts the redirect immediately and cancels the timer.
10. On successful Messenger open, the cart is cleared and the app returns to the menu.
11. On blocked or failed Messenger open, the confirmation screen stays visible and the button remains available for retry.

## UI Design

The confirmation screen should visually align with the existing checkout cards and spacing rather than introduce a new visual language.

Required sections:
- Success header with concise copy confirming the order has been saved
- Countdown text that updates every second, for example `Redirecting to Messenger in 5s`
- Primary button labeled `Proceed to Messenger`
- Customer summary block with name, contact number, service type, pickup time if applicable, payment method, and notes if present
- Order summary block reusing the same item and pricing structure customers already see during checkout

Button behavior:
- Enabled on first render
- Clicking it immediately triggers the redirect attempt
- While a redirect attempt is underway, show a loading or disabled state to prevent duplicate tabs

## Error Handling

Two distinct failure states must remain separate:

### Order save failure

If the Convex mutation fails:
- Stay on checkout
- Show the existing inline error
- Preserve all entered checkout details
- Do not show the confirmation screen
- Do not attempt Messenger

### Messenger open failure

If `window.open` is blocked or returns `null`:
- Stay on the confirmation screen
- Keep the saved order summary visible
- Do not clear the cart
- Allow the customer to press `Proceed to Messenger` again
- Show a short inline message that the browser blocked Messenger and the customer should use the button to retry

## Testing Strategy

Follow test-first changes for the web app.

Minimum automated coverage:
- Checkout success switches the app into the confirmation view with the saved order snapshot
- Confirmation renders the submitted customer and item summary
- Countdown starts at 5 and triggers automatic Messenger redirect after 5 seconds
- Manual button press opens Messenger immediately and cancels the pending auto-redirect
- Cart clear happens only after a successful Messenger open attempt
- Failed order persistence keeps the customer on checkout and skips the confirmation view
- Blocked Messenger open keeps the customer on confirmation with retry available

## Scope Boundaries

Included:
- Web customer ordering flow only
- Existing Messenger destination and message format
- In-memory confirmation state only for the current session

Not included:
- Staff mobile app changes
- New customer-facing order tracking
- Persisted confirmation pages on reload
- Routing refactor for the customer app

## Acceptance Criteria

1. A successful checkout no longer jumps directly to Messenger.
2. A successful checkout shows a confirmation screen with the submitted order summary.
3. The confirmation screen starts a 5-second countdown immediately on entry.
4. The customer can click `Proceed to Messenger` before the timer ends.
5. When the timer finishes, Messenger opens automatically.
6. The cart is cleared only after Messenger was successfully opened.
7. If Messenger is blocked, the confirmation screen remains visible and retry is possible.
8. If order saving fails, the customer stays on checkout with their entered data intact.
