# Convex Order Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect checkout to Convex so every order is saved with `pending` status before Facebook Messenger opens, while leaving the existing Supabase-powered menu and admin data flows unchanged.

**Architecture:** Add Convex as a dedicated orders backend beside Supabase. Normalize checkout state into a typed order snapshot in a frontend helper, persist it through a Convex mutation, and only then open Messenger. Preserve both cart line ids and stable menu item ids so later order-management screens can query reliable order documents.

**Tech Stack:** Vite, React 18, TypeScript, Supabase, Convex, Vitest

---

**Prerequisite:** Before any Convex CLI command in this plan, export the provided Convex dev deploy key into the shell as `CONVEX_DEPLOY_KEY`. Keep it out of version control.

## File Map

- `package.json`
  Adds the `convex` runtime dependency plus `vitest` scripts and dev dependency.
- `package-lock.json`
  Captures the dependency graph after installing Convex and Vitest.
- `convex/orderFields.ts`
  Holds the shared validator field maps for an order document and an order line item.
- `convex/schema.ts`
  Defines the `orders` table shape stored in Convex.
- `convex/orders.ts`
  Exposes the `createOrder` mutation that inserts a `pending` order and stamps `submittedAt`.
- `convex/_generated/*`
  Generated Convex client and server typings; created by `npx convex dev`, not hand-edited.
- `.env.local`
  Local-only Convex environment produced by the CLI. Must contain `VITE_CONVEX_URL`.
- `src/lib/convex.ts`
  Creates a single `ConvexReactClient` instance for the frontend.
- `src/lib/orders.ts`
  Owns checkout-to-order normalization and Messenger message formatting.
- `src/lib/orders.test.ts`
  Verifies the order normalization contract and message formatting.
- `src/types/index.ts`
  Adds `menuItemId` to cart items and fixes the payment-method type to match Supabase-backed ids.
- `src/hooks/useCart.ts`
  Preserves the original menu item id on cart lines and fixes line matching for duplicate customized items.
- `src/components/Checkout.tsx`
  Calls the Convex mutation before Messenger, shows loading/error state, and keeps form data intact on failure.
- `src/App.tsx`
  Passes a success callback that clears the cart and returns the customer to the menu after a saved order.
- `src/main.tsx`
  Wraps the app in `ConvexProvider`.

### Task 1: Add Convex And Test Tooling

**Files:**
- Modify: `package.json:6-36`
- Modify: `package-lock.json`

- [ ] **Step 1: Install Convex and Vitest**

Run:

```bash
npm install convex@1.26.2
npm install -D vitest@3.2.4
```

Expected: `package.json` and `package-lock.json` update successfully and the install exits with code `0`.

- [ ] **Step 2: Add test scripts to `package.json`**

Update `package.json` to include the new scripts and dependency entries:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "migrate:service-charge": "node run-migration-simple.js"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.56.1",
    "convex": "^1.26.2",
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^7.8.2"
  },
  "devDependencies": {
    "@eslint/js": "^9.9.1",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.18",
    "eslint": "^9.9.1",
    "eslint-plugin-react-hooks": "^5.1.0-rc.0",
    "eslint-plugin-react-refresh": "^0.4.11",
    "globals": "^15.9.0",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.5.3",
    "typescript-eslint": "^8.3.0",
    "vite": "^5.4.2",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 3: Verify the app still builds after dependency changes**

Run:

```bash
npm run build
```

Expected: Vite completes a production build without introducing new TypeScript or bundling failures.

- [ ] **Step 4: Commit the tooling bootstrap**

Run:

```bash
git add package.json package-lock.json
git commit -m "chore: add convex and vitest tooling"
```

### Task 2: Normalize Checkout Orders With Tests First

**Files:**
- Create: `src/lib/orders.test.ts`
- Create: `src/lib/orders.ts`
- Modify: `src/types/index.ts:37-62`
- Modify: `src/hooks/useCart.ts:21-73`
- Test: `src/lib/orders.test.ts`

- [ ] **Step 1: Write the failing normalization test**

Create `src/lib/orders.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { CartItem } from '../types';
import { buildMessengerOrderMessage, buildOrderSubmission } from './orders';

const sampleCartItem: CartItem = {
  id: 'iced-latte-large-extra-shot',
  menuItemId: 'iced-latte',
  name: 'Iced Latte',
  description: 'Espresso and milk over ice',
  basePrice: 150,
  category: 'iced-coffee',
  image: 'https://example.com/iced-latte.jpg',
  popular: true,
  available: true,
  quantity: 2,
  selectedVariation: { id: 'large', name: 'Large', price: 20, type: 'Size' },
  selectedVariations: [{ id: 'large', name: 'Large', price: 20, type: 'Size' }],
  selectedAddOns: [
    { id: 'extra-shot', name: 'Extra Shot', price: 30, category: 'Extras', quantity: 2 },
  ],
  totalPrice: 230,
};

describe('buildOrderSubmission', () => {
  it('creates a pending order payload with stable line and menu ids', () => {
    const order = buildOrderSubmission({
      cartItems: [sampleCartItem],
      customerName: 'Ada Lovelace',
      contactNumber: '09171234567',
      serviceType: 'pickup',
      pickupTimeSelection: 'custom',
      customPickupTime: '7:30 PM',
      paymentMethodId: 'gcash',
      paymentMethodName: 'GCash',
      notes: 'Less ice',
      subtotal: 460,
      serviceChargeEnabled: true,
      serviceChargeLabel: 'Packaging Fee',
      serviceChargePercentage: 7.5,
      serviceChargeAmount: 34.5,
      total: 494.5,
    });

    expect(order).toMatchObject({
      status: 'pending',
      source: 'web_checkout',
      customerName: 'Ada Lovelace',
      contactNumber: '09171234567',
      serviceType: 'pickup',
      pickupTimeLabel: '7:30 PM',
      paymentMethodId: 'gcash',
      paymentMethodName: 'GCash',
      subtotal: 460,
      serviceChargeEnabled: true,
      serviceChargeLabel: 'Packaging Fee',
      serviceChargePercentage: 7.5,
      serviceChargeAmount: 34.5,
      total: 494.5,
    });

    expect(order.items).toEqual([
      {
        lineItemId: 'iced-latte-large-extra-shot',
        menuItemId: 'iced-latte',
        name: 'Iced Latte',
        category: 'iced-coffee',
        quantity: 2,
        basePrice: 150,
        unitPrice: 230,
        lineTotal: 460,
        selectedVariations: [
          { id: 'large', name: 'Large', price: 20, type: 'Size' },
        ],
        selectedAddOns: [
          { id: 'extra-shot', name: 'Extra Shot', price: 30, category: 'Extras', quantity: 2 },
        ],
      },
    ]);
  });

  it('omits pickup time for non-pickup orders and keeps Messenger text aligned with the payload', () => {
    const order = buildOrderSubmission({
      cartItems: [sampleCartItem],
      customerName: 'Grace Hopper',
      contactNumber: '09179876543',
      serviceType: 'delivery',
      pickupTimeSelection: '5-10',
      customPickupTime: '',
      paymentMethodId: 'maya',
      paymentMethodName: 'Maya',
      notes: '',
      subtotal: 460,
      serviceChargeEnabled: false,
      serviceChargeLabel: 'Packaging Fee',
      serviceChargePercentage: 0,
      serviceChargeAmount: 0,
      total: 460,
    });

    expect(order.pickupTimeLabel).toBeUndefined();
    expect(order.notes).toBeUndefined();

    const message = buildMessengerOrderMessage(order);

    expect(message).toContain('Customer: Grace Hopper');
    expect(message).toContain('Payment: Maya');
    expect(message).toContain('Iced Latte (Large) + Extra Shot x2 x2 - ₱460');
    expect(message).not.toContain('Pickup Time');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails for the right reason**

Run:

```bash
npm run test -- src/lib/orders.test.ts
```

Expected: FAIL with a missing-module or missing-export error for `./orders`, proving the test is exercising code that does not exist yet.

- [ ] **Step 3: Write the minimal normalization implementation**

Create `src/lib/orders.ts`:

```ts
import { CartItem, PaymentMethod, ServiceType } from '../types';

export interface BuildOrderSubmissionInput {
  cartItems: CartItem[];
  customerName: string;
  contactNumber: string;
  serviceType: ServiceType;
  pickupTimeSelection: string;
  customPickupTime: string;
  paymentMethodId: PaymentMethod;
  paymentMethodName: string;
  notes: string;
  subtotal: number;
  serviceChargeEnabled: boolean;
  serviceChargeLabel: string;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  total: number;
}

export interface OrderLineSnapshot {
  lineItemId: string;
  menuItemId: string;
  name: string;
  category: string;
  quantity: number;
  basePrice: number;
  unitPrice: number;
  lineTotal: number;
  selectedVariations: Array<{
    id: string;
    name: string;
    type?: string;
    price: number;
  }>;
  selectedAddOns: Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }>;
}

export interface CreateOrderInput {
  status: 'pending';
  source: 'web_checkout';
  customerName: string;
  contactNumber: string;
  serviceType: ServiceType;
  pickupTimeLabel?: string;
  paymentMethodId: PaymentMethod;
  paymentMethodName: string;
  notes?: string;
  subtotal: number;
  serviceChargeEnabled: boolean;
  serviceChargeLabel?: string;
  serviceChargePercentage: number;
  serviceChargeAmount: number;
  total: number;
  items: OrderLineSnapshot[];
}

const getPickupTimeLabel = (
  serviceType: ServiceType,
  pickupTimeSelection: string,
  customPickupTime: string,
) => {
  if (serviceType !== 'pickup') {
    return undefined;
  }

  return pickupTimeSelection === 'custom'
    ? customPickupTime.trim()
    : `${pickupTimeSelection} minutes`;
};

export const buildOrderSubmission = ({
  cartItems,
  customerName,
  contactNumber,
  serviceType,
  pickupTimeSelection,
  customPickupTime,
  paymentMethodId,
  paymentMethodName,
  notes,
  subtotal,
  serviceChargeEnabled,
  serviceChargeLabel,
  serviceChargePercentage,
  serviceChargeAmount,
  total,
}: BuildOrderSubmissionInput): CreateOrderInput => {
  const pickupTimeLabel = getPickupTimeLabel(serviceType, pickupTimeSelection, customPickupTime);
  const trimmedNotes = notes.trim();

  return {
    status: 'pending',
    source: 'web_checkout',
    customerName: customerName.trim(),
    contactNumber: contactNumber.trim(),
    serviceType,
    ...(pickupTimeLabel ? { pickupTimeLabel } : {}),
    paymentMethodId,
    paymentMethodName,
    ...(trimmedNotes ? { notes: trimmedNotes } : {}),
    subtotal,
    serviceChargeEnabled,
    ...(serviceChargeEnabled ? { serviceChargeLabel } : {}),
    serviceChargePercentage,
    serviceChargeAmount,
    total,
    items: cartItems.map((item) => {
      const selectedVariations =
        item.selectedVariations && item.selectedVariations.length > 0
          ? item.selectedVariations
          : item.selectedVariation
            ? [item.selectedVariation]
            : [];

      return {
        lineItemId: item.id,
        menuItemId: item.menuItemId,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        basePrice: item.basePrice,
        unitPrice: item.totalPrice,
        lineTotal: item.totalPrice * item.quantity,
        selectedVariations: selectedVariations.map((variation) => ({
          id: variation.id,
          name: variation.name,
          type: variation.type,
          price: variation.price,
        })),
        selectedAddOns: (item.selectedAddOns || []).map((addOn) => ({
          id: addOn.id,
          name: addOn.name,
          category: addOn.category,
          price: addOn.price,
          quantity: addOn.quantity || 1,
        })),
      };
    }),
  };
};

export const buildMessengerOrderMessage = (order: CreateOrderInput) => {
  const serviceLabel = order.serviceType.charAt(0).toUpperCase() + order.serviceType.slice(1);
  const deliveryBlock =
    order.serviceType === 'delivery'
      ? `📍 Self Booking - Pin: Blueprint Cafe
9730 kamagong st, Makati City
Contact Person: Blueprint Cafe
Number: 0917 190 4334`
      : '';

  const pickupBlock =
    order.serviceType === 'pickup' && order.pickupTimeLabel
      ? `⏰ Pickup Time: ${order.pickupTimeLabel}`
      : '';

  const itemLines = order.items
    .map((item) => {
      let line = `• ${item.name}`;

      if (item.selectedVariations.length > 0) {
        line += ` (${item.selectedVariations.map((variation) => variation.name).join(', ')})`;
      }

      if (item.selectedAddOns.length > 0) {
        line += ` + ${item.selectedAddOns
          .map((addOn) => (addOn.quantity > 1 ? `${addOn.name} x${addOn.quantity}` : addOn.name))
          .join(', ')}`;
      }

      line += ` x${item.quantity} - ₱${item.lineTotal}`;
      return line;
    })
    .join('\n');

  return `
🛒 Blueprint Cafe ORDER

👤 Customer: ${order.customerName}
📞 Contact: ${order.contactNumber}
📍 Service: ${serviceLabel}
${deliveryBlock}
${pickupBlock}

📋 ORDER DETAILS:
${itemLines}

💰 SUBTOTAL: ₱${order.subtotal.toFixed(2)}
${order.serviceChargeEnabled && order.serviceChargeLabel ? `💼 ${order.serviceChargeLabel} (${order.serviceChargePercentage}%): ₱${order.serviceChargeAmount.toFixed(2)}` : ''}
💰 TOTAL: ₱${order.total.toFixed(2)}
${order.serviceType === 'delivery' ? '🛵 DELIVERY FEE:' : ''}

💳 Payment: ${order.paymentMethodName}
📸 Payment Screenshot: Please attach your payment receipt screenshot

${order.notes ? `📝 Notes: ${order.notes}` : ''}

Please confirm this order to proceed. Thank you for choosing BlueprintCafe! 🥟
  `.trim();
};
```

Update the cart type in `src/types/index.ts`:

```ts
export interface CartItem extends MenuItem {
  menuItemId: string;
  quantity: number;
  selectedVariation?: Variation;
  selectedVariations?: Variation[];
  selectedAddOns?: AddOn[];
  totalPrice: number;
}

export interface OrderData {
  items: CartItem[];
  customerName: string;
  contactNumber: string;
  serviceType: 'dine-in' | 'pickup' | 'delivery';
  address?: string;
  pickupTime?: string;
  partySize?: number;
  dineInTime?: string;
  paymentMethod: PaymentMethod;
  referenceNumber?: string;
  total: number;
  notes?: string;
}

export type PaymentMethod = string;
export type ServiceType = 'dine-in' | 'pickup' | 'delivery';
```

Update the cart id handling in `src/hooks/useCart.ts`:

```ts
const existingItem = prev.find(cartItem => {
  const cartVarsKey = (cartItem.selectedVariations || (cartItem.selectedVariation ? [cartItem.selectedVariation] : []))
    .map(v => v.id).sort().join(',') || 'default';
  return (
    cartItem.menuItemId === item.id &&
    cartVarsKey === variationsKey &&
    JSON.stringify(cartItem.selectedAddOns?.map(a => `${a.id}-${a.quantity || 1}`).sort()) ===
      JSON.stringify(groupedAddOns?.map(a => `${a.id}-${a.quantity}`).sort())
  );
});

if (existingItem) {
  return prev.map(cartItem =>
    cartItem === existingItem
      ? { ...cartItem, quantity: cartItem.quantity + quantity }
      : cartItem
  );
}

const uniqueId = `${item.id}-${variationsKey}-${addOns?.map(a => a.id).join(',') || 'none'}`;
return [...prev, {
  ...item,
  id: uniqueId,
  menuItemId: item.id,
  quantity,
  selectedVariation: variationsArray[0],
  selectedVariations: variationsArray,
  selectedAddOns: groupedAddOns || [],
  totalPrice
}];
```

- [ ] **Step 4: Run the tests to verify the helper passes**

Run:

```bash
npm run test -- src/lib/orders.test.ts
```

Expected: PASS with both tests green.

- [ ] **Step 5: Commit the normalization slice**

Run:

```bash
git add src/lib/orders.ts src/lib/orders.test.ts src/types/index.ts src/hooks/useCart.ts
git commit -m "feat: normalize checkout orders for convex"
```

### Task 3: Add Convex Order Schema And Mutation

**Files:**
- Create: `convex/orderFields.ts`
- Create: `convex/schema.ts`
- Create: `convex/orders.ts`
- Create: `convex/_generated/*` (generated)
- Create: `.env.local` (generated, local-only)

- [ ] **Step 1: Create the shared Convex validator field maps**

Create `convex/orderFields.ts`:

```ts
import { v } from 'convex/values';

export const serviceTypeValidator = v.union(
  v.literal('dine-in'),
  v.literal('pickup'),
  v.literal('delivery'),
);

export const orderLineFields = {
  lineItemId: v.string(),
  menuItemId: v.string(),
  name: v.string(),
  category: v.string(),
  quantity: v.number(),
  basePrice: v.number(),
  unitPrice: v.number(),
  lineTotal: v.number(),
  selectedVariations: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      type: v.optional(v.string()),
      price: v.number(),
    }),
  ),
  selectedAddOns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      category: v.string(),
      price: v.number(),
      quantity: v.number(),
    }),
  ),
};

export const orderFields = {
  status: v.literal('pending'),
  source: v.literal('web_checkout'),
  customerName: v.string(),
  contactNumber: v.string(),
  serviceType: serviceTypeValidator,
  pickupTimeLabel: v.optional(v.string()),
  paymentMethodId: v.string(),
  paymentMethodName: v.string(),
  notes: v.optional(v.string()),
  subtotal: v.number(),
  serviceChargeEnabled: v.boolean(),
  serviceChargeLabel: v.optional(v.string()),
  serviceChargePercentage: v.number(),
  serviceChargeAmount: v.number(),
  total: v.number(),
  items: v.array(v.object(orderLineFields)),
};
```

- [ ] **Step 2: Create the schema and mutation**

Create `convex/schema.ts`:

```ts
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { orderFields } from './orderFields';

export default defineSchema({
  orders: defineTable({
    ...orderFields,
    submittedAt: v.number(),
  }),
});
```

Create `convex/orders.ts`:

```ts
import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { orderFields } from './orderFields';

export const createOrder = mutation({
  args: {
    order: v.object(orderFields),
  },
  handler: async (ctx, { order }) => {
    const orderId = await ctx.db.insert('orders', {
      ...order,
      submittedAt: Date.now(),
    });

    return { orderId };
  },
});
```

- [ ] **Step 3: Sync Convex and generate the typed client/server files**

Run:

```bash
npx convex dev
```

Expected:

- `.env.local` is created or updated locally
- `VITE_CONVEX_URL` points at `https://shocking-moose-193.convex.cloud`
- `convex/_generated/api.d.ts`, `convex/_generated/server.d.ts`, and related files are generated
- the CLI reports that functions and schema are synced successfully

Leave `npx convex dev` running while implementing Task 4, because it will keep generated files and backend code in sync.

- [ ] **Step 4: Commit the Convex backend files**

Run:

```bash
git add convex/orderFields.ts convex/schema.ts convex/orders.ts convex/_generated
git commit -m "feat: add convex orders backend"
```

### Task 4: Submit Checkout Orders To Convex Before Messenger

**Files:**
- Create: `src/lib/convex.ts`
- Modify: `src/main.tsx:1-10`
- Modify: `src/App.tsx:13-67`
- Modify: `src/components/Checkout.tsx:7-116, 323-480`
- Test: `src/lib/orders.test.ts`

- [ ] **Step 1: Create the frontend Convex client**

Create `src/lib/convex.ts`:

```ts
import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing Convex environment variable: VITE_CONVEX_URL');
}

export const convex = new ConvexReactClient(convexUrl);
```

- [ ] **Step 2: Wrap the app in `ConvexProvider`**

Update `src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ConvexProvider } from 'convex/react';
import App from './App.tsx';
import { convex } from './lib/convex';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConvexProvider client={convex}>
      <App />
    </ConvexProvider>
  </StrictMode>,
);
```

- [ ] **Step 3: Pass a post-submit success callback from `App.tsx`**

Update the checkout usage in `src/App.tsx`:

```tsx
{currentView === 'checkout' && (
  <Checkout
    cartItems={cart.cartItems}
    totalPrice={cart.getTotalPrice()}
    onBack={() => handleViewChange('cart')}
    onOrderPlaced={() => {
      cart.clearCart();
      handleViewChange('menu');
    }}
  />
)}
```

Update the `CheckoutProps` interface accordingly:

```tsx
interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  onOrderPlaced: () => void;
}
```

- [ ] **Step 4: Replace direct Messenger-only submit with save-then-open logic**

Update the top of `src/components/Checkout.tsx`:

```tsx
import React, { useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { CartItem, PaymentMethod, ServiceType } from '../types';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { buildMessengerOrderMessage, buildOrderSubmission } from '../lib/orders';

interface CheckoutProps {
  cartItems: CartItem[];
  totalPrice: number;
  onBack: () => void;
  onOrderPlaced: () => void;
}

const Checkout: React.FC<CheckoutProps> = ({ cartItems, totalPrice: _totalPrice, onBack, onOrderPlaced }) => {
  const { paymentMethods } = usePaymentMethods();
  const { siteSettings } = useSiteSettings();
  const createOrder = useMutation(api.orders.createOrder);
  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [customerName, setCustomerName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('dine-in');
  const [pickupTime, setPickupTime] = useState('5-10');
  const [customTime, setCustomTime] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
```

Replace `handlePlaceOrder` with an async submit:

```tsx
const handlePlaceOrder = async () => {
  if (!selectedPaymentMethod || isSubmitting) {
    return;
  }

  setIsSubmitting(true);
  setSubmitError(null);

  try {
    const order = buildOrderSubmission({
      cartItems,
      customerName,
      contactNumber,
      serviceType,
      pickupTimeSelection: pickupTime,
      customPickupTime: customTime,
      paymentMethodId: paymentMethod,
      paymentMethodName: selectedPaymentMethod.name,
      notes,
      subtotal,
      serviceChargeEnabled: isServiceChargeApplicable,
      serviceChargeLabel: feeLabel,
      serviceChargePercentage: isServiceChargeApplicable ? serviceChargePercentage : 0,
      serviceChargeAmount: serviceCharge,
      total: finalTotal,
    });

    await createOrder({ order });

    const messengerUrl = `https://m.me/BlueprintCafe?text=${encodeURIComponent(buildMessengerOrderMessage(order))}`;
    window.open(messengerUrl, '_blank', 'noopener,noreferrer');
    onOrderPlaced();
  } catch (error) {
    console.error('Error saving order to Convex:', error);
    setSubmitError('We could not save your order. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

Update the final payment action area to surface the error and block duplicate submissions:

```tsx
{submitError && (
  <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    {submitError}
  </div>
)}

<button
  onClick={handlePlaceOrder}
  disabled={isSubmitting || !selectedPaymentMethod}
  className={`w-full py-4 rounded-xl font-medium text-lg transition-all duration-200 transform ${
    isSubmitting || !selectedPaymentMethod
      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
      : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.02]'
  }`}
>
  {isSubmitting ? 'Saving Order...' : 'Place Order via Messenger'}
</button>
```

- [ ] **Step 5: Re-run the targeted tests**

Run:

```bash
npm run test -- src/lib/orders.test.ts
```

Expected: PASS with the same two tests still green after wiring the UI.

- [ ] **Step 6: Verify the full frontend build**

Run:

```bash
npm run build
```

Expected: PASS with the Convex-generated imports resolved and no TypeScript errors in checkout.

- [ ] **Step 7: Commit the checkout integration**

Run:

```bash
git add src/lib/convex.ts src/main.tsx src/App.tsx src/components/Checkout.tsx
git commit -m "feat: save checkout orders to convex"
```

### Task 5: Manual Verification Against The Real Convex Deployment

**Files:**
- Local-only: `.env.local`

- [ ] **Step 1: Start the frontend with Convex still synced**

Run:

```bash
npm run dev
```

Expected: Vite serves the app locally and checkout can reach the configured Convex deployment.

- [ ] **Step 2: Submit a real smoke-test order**

Manual steps:

1. Open the local app.
2. Add at least one menu item to the cart.
3. Complete the checkout details form.
4. Select a payment method.
5. Click `Place Order via Messenger`.

Expected:

- The button changes to `Saving Order...` while the mutation runs.
- No duplicate submission is possible while loading.
- A Messenger tab opens only after the save succeeds.
- The cart clears and the app returns to the menu after success.

- [ ] **Step 3: Verify the saved document in Convex**

Check the `orders` table in the Convex dashboard for the newest document.

Expected fields:

- `status` is `"pending"`
- `source` is `"web_checkout"`
- `submittedAt` is present
- `items[0].lineItemId` is the cart line id
- `items[0].menuItemId` is the original menu item id
- pricing fields match the checkout summary

- [ ] **Step 4: Verify the failure path blocks Messenger**

Temporarily break the frontend connection by changing `.env.local`:

```dotenv
VITE_CONVEX_URL=https://invalid-convex-url.example
```

Restart the Vite dev server and try the same checkout flow again.

Expected:

- Messenger does not open
- The payment screen stays visible
- The inline error message appears
- The entered checkout data remains intact for retry

After verifying the failure path, restore the real URL:

```dotenv
VITE_CONVEX_URL=https://shocking-moose-193.convex.cloud
```

- [ ] **Step 5: Capture final verification**

Run:

```bash
npm run test -- src/lib/orders.test.ts
npm run build
git status --short
```

Expected:

- tests pass
- build passes
- `git status --short` only shows the intended tracked changes because `.env.local` remains ignored by `*.local`
