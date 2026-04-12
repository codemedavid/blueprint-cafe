import { describe, expect, it } from 'vitest';
import type { CreateOrderInput } from './orders';
import {
  completeMessengerRedirect,
  getCountdownLabel,
  showOrderConfirmation,
} from './checkoutConfirmation';

const sampleOrder: CreateOrderInput = {
  status: 'pending',
  source: 'web_checkout',
  customerName: 'Ada Lovelace',
  contactNumber: '09171234567',
  serviceType: 'pickup',
  pickupTimeLabel: '5-10 minutes',
  paymentMethodId: 'gcash',
  paymentMethodName: 'GCash',
  subtotal: 180,
  serviceChargeEnabled: false,
  serviceChargePercentage: 0,
  serviceChargeAmount: 0,
  total: 180,
  items: [
    {
      lineItemId: 'iced-latte-large',
      menuItemId: 'iced-latte',
      name: 'Iced Latte',
      category: 'coffee',
      quantity: 1,
      basePrice: 150,
      unitPrice: 180,
      lineTotal: 180,
      selectedVariations: [{ id: 'large', name: 'Large', price: 30, type: 'Size' }],
      selectedAddOns: [],
    },
  ],
};

describe('checkout confirmation flow helpers', () => {
  it('switches the app into a confirmation view while preserving the saved order summary', () => {
    expect(showOrderConfirmation(sampleOrder)).toEqual({
      currentView: 'confirmation',
      confirmationOrder: sampleOrder,
    });
  });

  it('returns to the menu after Messenger is opened', () => {
    expect(completeMessengerRedirect()).toEqual({
      currentView: 'menu',
      confirmationOrder: null,
    });
  });

  it('formats the countdown label shown on the confirmation screen', () => {
    expect(getCountdownLabel(5)).toBe('Redirecting to Messenger in 5s');
  });
});
