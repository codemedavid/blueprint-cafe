# Staff Password Gate Design

## Goal

Require a hardcoded password before the staff mobile app can enter the authenticated orders flow, while preserving the existing persisted auth behavior so the device stays unlocked after the first correct entry until sign-out.

## Current Context

The Expo staff app already has a signed-out entry screen in `src/navigation/AppNavigator.tsx` and a persisted auth state in `src/providers/AuthProvider.tsx`. When `signIn()` is called, `AuthProvider` stores `blueprint-cafe-staff.is-authenticated=true` in AsyncStorage and the app starts on the orders stack on later launches.

## Recommended Approach

Add the password prompt to the existing signed-out login screen and only call `signIn()` after the entered password matches the requested hardcoded value. Keep `AuthProvider` unchanged so the successful login remains durable across app restarts.

## Alternatives Considered

### 1. Move password verification into `AuthProvider`

This would couple a presentation concern to storage logic and force the provider to manage password entry state that only exists on the login screen.

### 2. Add a second persisted “password accepted” flag

This would duplicate the meaning of the current authenticated flag and create unnecessary state synchronization risk.

## UI and Behavior

- Replace the single-button guest entry with a secure password input plus the existing action button.
- Keep the screen copy and visual tone aligned with the current entry card.
- Use inline validation feedback when the password is wrong.
- Clear the validation error as soon as the user edits the password again.
- Keep the password on-device and hardcoded in the app code because that was explicitly requested.
- After a correct password entry, call `signIn()` and rely on the existing persisted auth state to bypass the prompt on future launches.

## Error Handling

- Wrong password: show a short inline error message and do not call `signIn()`.
- Empty password submission: treat it the same as a wrong password to keep the gate behavior simple.

## Testing

- Extend `src/navigation/AppNavigator.test.tsx` to cover the signed-out screen with:
  - wrong password submission showing an error and not calling `signIn()`
  - correct password submission calling `signIn()` and not leaving the error visible
- Keep the existing authenticated-route test intact.
