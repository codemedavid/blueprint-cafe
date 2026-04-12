# Staff Password Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a hardcoded password gate to the staff mobile login screen so the app only enters the persisted authenticated flow after the correct password is submitted once.

**Architecture:** Keep the existing persisted auth model in `AuthProvider` unchanged and gate access in `AppNavigator`'s signed-out screen. Add only local component state for password input and inline validation, with navigator tests covering the new behavior before implementation.

**Tech Stack:** Expo, React Native, React Navigation, Jest, Testing Library React Native

---

### Task 1: Cover the guest login gate with tests

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`
- Test: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
it('blocks sign-in and shows an error when the password is wrong', () => {
  const signIn = jest.fn();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    signIn,
  });

  render(<AppNavigator />);

  fireEvent.changeText(screen.getByLabelText('Staff Password'), 'wrong-password');
  fireEvent.press(screen.getByRole('button', { name: 'Open Orders' }));

  expect(signIn).not.toHaveBeenCalled();
  expect(screen.getByText('Incorrect password. Try again.')).toBeTruthy();
});

it('signs in when the correct password is entered', () => {
  const signIn = jest.fn();
  mockUseAuth.mockReturnValue({
    isAuthenticated: false,
    signIn,
  });

  render(<AppNavigator />);

  fireEvent.changeText(
    screen.getByLabelText('Staff Password'),
    'BlueprintCafe@Admin!2026',
  );
  fireEvent.press(screen.getByRole('button', { name: 'Open Orders' }));

  expect(signIn).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Incorrect password. Try again.')).toBeNull();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx`
Expected: FAIL because the login screen does not yet render a password field or validation message.

- [ ] **Step 3: Commit**

```bash
git add apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx
git commit -m "test: cover staff password gate"
```

### Task 2: Implement the password gate in the login screen

**Files:**
- Modify: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx`
- Test: `apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx`

- [ ] **Step 1: Write minimal implementation**

```tsx
const HARD_CODED_PASSWORD = 'BlueprintCafe@Admin!2026';

function LoginScreen() {
  const { signIn } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const submit = () => {
    if (password !== HARD_CODED_PASSWORD) {
      setErrorMessage('Incorrect password. Try again.');
      return;
    }

    setErrorMessage(null);
    void signIn();
  };

  return (
    <>
      <TextInput
        accessibilityLabel="Staff Password"
        secureTextEntry
        value={password}
        onChangeText={(nextValue) => {
          setPassword(nextValue);
          if (errorMessage) {
            setErrorMessage(null);
          }
        }}
      />
      {errorMessage ? <Text>{errorMessage}</Text> : null}
      <Pressable accessibilityLabel="Open Orders" onPress={submit} />
    </>
  );
}
```

- [ ] **Step 2: Run test to verify it passes**

Run: `npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx`
Expected: PASS

- [ ] **Step 3: Run focused safety checks**

Run: `npm test -- --runTestsByPath src/navigation/AppNavigator.test.tsx src/screens/OrdersScreen.test.tsx`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add apps/blueprint-cafe-staff/src/navigation/AppNavigator.tsx apps/blueprint-cafe-staff/src/navigation/AppNavigator.test.tsx
git commit -m "feat: add staff app password gate"
```
