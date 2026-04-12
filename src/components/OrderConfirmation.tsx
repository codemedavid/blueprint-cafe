import React from 'react';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import type { CreateOrderInput } from '../lib/orders';
import {
  buildMessengerRedirectUrl,
  getCountdownLabel,
} from '../lib/checkoutConfirmation';

interface OrderConfirmationProps {
  order: CreateOrderInput;
  onMessengerOpened: () => void;
}

const serviceTypeLabels: Record<CreateOrderInput['serviceType'], string> = {
  'dine-in': 'Dine In',
  pickup: 'Pickup',
  delivery: 'Delivery',
};

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  order,
  onMessengerOpened,
}) => {
  const [countdown, setCountdown] = React.useState(5);
  const [isRedirecting, setIsRedirecting] = React.useState(false);
  const [redirectError, setRedirectError] = React.useState<string | null>(null);

  const handleProceedToMessenger = React.useCallback(async () => {
    if (isRedirecting) {
      return;
    }

    setIsRedirecting(true);
    setRedirectError(null);

    const messengerWindow = window.open(
      buildMessengerRedirectUrl(order),
      '_blank',
      'noopener,noreferrer',
    );

    if (messengerWindow) {
      onMessengerOpened();
      return;
    }

    setIsRedirecting(false);
    setRedirectError('Messenger was blocked by your browser. Press the button to try again.');
  }, [isRedirecting, onMessengerOpened, order]);

  React.useEffect(() => {
    if (isRedirecting) {
      return;
    }

    if (countdown <= 0) {
      void handleProceedToMessenger();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCountdown((currentCountdown) => Math.max(currentCountdown - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [countdown, handleProceedToMessenger, isRedirecting]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-start gap-4">
            <div className="rounded-full bg-green-100 p-3 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-noto font-semibold text-black">Order confirmed</h1>
              <p className="mt-2 text-gray-600">
                Your order has been saved. Review the summary below before Messenger opens.
              </p>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-medium text-blue-900">
              {isRedirecting ? 'Opening Messenger...' : getCountdownLabel(countdown)}
            </p>
            <p className="mt-1 text-sm text-blue-700">
              Attach your payment screenshot in Messenger to help us verify your order faster.
            </p>
          </div>

          {redirectError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {redirectError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => {
              void handleProceedToMessenger();
            }}
            disabled={isRedirecting}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-medium transition-all duration-200 ${
              isRedirecting
                ? 'cursor-not-allowed bg-gray-300 text-gray-500'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            <MessageCircle className="h-5 w-5" />
            {isRedirecting ? 'Opening Messenger...' : 'Proceed to Messenger'}
          </button>

          <div className="mt-8 rounded-xl bg-slate-50 p-5">
            <h2 className="mb-4 text-xl font-noto font-medium text-black">Customer Summary</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium text-black">Name:</span> {order.customerName}
              </p>
              <p>
                <span className="font-medium text-black">Contact:</span> {order.contactNumber}
              </p>
              <p>
                <span className="font-medium text-black">Service:</span>{' '}
                {serviceTypeLabels[order.serviceType]}
              </p>
              {order.pickupTimeLabel ? (
                <p>
                  <span className="font-medium text-black">Pickup Time:</span>{' '}
                  {order.pickupTimeLabel}
                </p>
              ) : null}
              <p>
                <span className="font-medium text-black">Payment:</span>{' '}
                {order.paymentMethodName}
              </p>
              {order.notes ? (
                <p>
                  <span className="font-medium text-black">Notes:</span> {order.notes}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-6 text-2xl font-noto font-medium text-black">Order Summary</h2>

          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.lineItemId}
                className="border-b border-blue-100 pb-4 last:border-b-0 last:pb-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium text-black">{item.name}</h3>
                    {item.selectedVariations.length > 0 ? (
                      <p className="text-sm text-gray-600">
                        {item.selectedVariations
                          .map((variation) =>
                            variation.type ? `${variation.type}: ${variation.name}` : variation.name,
                          )
                          .join(', ')}
                      </p>
                    ) : null}
                    {item.selectedAddOns.length > 0 ? (
                      <p className="text-sm text-gray-600">
                        Add-ons:{' '}
                        {item.selectedAddOns
                          .map((addOn) =>
                            addOn.quantity > 1 ? `${addOn.name} x${addOn.quantity}` : addOn.name,
                          )
                          .join(', ')}
                      </p>
                    ) : null}
                    <p className="text-sm text-gray-600">
                      ₱{item.unitPrice.toFixed(2)} x {item.quantity}
                    </p>
                  </div>
                  <span className="font-semibold text-black">₱{item.lineTotal.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-blue-200 pt-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-gray-700">
                <span>Subtotal</span>
                <span>₱{order.subtotal.toFixed(2)}</span>
              </div>
              {order.serviceChargeEnabled && order.serviceChargeLabel ? (
                <div className="flex items-center justify-between text-gray-700">
                  <span>
                    {order.serviceChargeLabel} ({order.serviceChargePercentage}%)
                  </span>
                  <span>₱{order.serviceChargeAmount.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-blue-200 pt-2 text-xl font-semibold text-black">
                <span>Total</span>
                <span>₱{order.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
