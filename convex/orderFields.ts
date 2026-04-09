import { v } from 'convex/values';
import { orderStatusValidator } from './orderStatus';

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
  status: orderStatusValidator,
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
