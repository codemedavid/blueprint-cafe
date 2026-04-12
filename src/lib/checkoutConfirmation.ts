import type { CreateOrderInput } from './orders';
import { buildMessengerOrderMessage } from './orders';

export type CustomerView = 'menu' | 'cart' | 'checkout' | 'confirmation';

export interface CheckoutConfirmationState {
  currentView: CustomerView;
  confirmationOrder: CreateOrderInput | null;
}

export const showOrderConfirmation = (
  order: CreateOrderInput,
): CheckoutConfirmationState => ({
  currentView: 'confirmation',
  confirmationOrder: order,
});

export const completeMessengerRedirect = (): CheckoutConfirmationState => ({
  currentView: 'menu',
  confirmationOrder: null,
});

export const getCountdownLabel = (secondsRemaining: number) =>
  `Redirecting to Messenger in ${secondsRemaining}s`;

export const buildMessengerRedirectUrl = (order: CreateOrderInput) =>
  `https://m.me/BlueprintCafe?text=${encodeURIComponent(buildMessengerOrderMessage(order))}`;
