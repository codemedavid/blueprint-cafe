import type { CartItem, PaymentMethod, ServiceType } from '../types';

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
