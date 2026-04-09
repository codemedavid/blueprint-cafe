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
  it('keeps new checkout orders pending even when workflow statuses exist', () => {
    const order = buildOrderSubmission({
      cartItems: [sampleCartItem],
      customerName: 'Grace Hopper',
      contactNumber: '09179876543',
      serviceType: 'pickup',
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

    expect(order.status).toBe('pending');
  });

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
        selectedVariations: [{ id: 'large', name: 'Large', price: 20, type: 'Size' }],
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
