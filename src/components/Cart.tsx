import React from 'react';
import { Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { CartItem } from '../types';

interface CartProps {
  cartItems: CartItem[];
  updateQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  getTotalPrice: () => number;
  onContinueShopping: () => void;
  onCheckout: () => void;
}

const Cart: React.FC<CartProps> = ({
  cartItems,
  updateQuantity,
  removeFromCart,
  clearCart,
  getTotalPrice,
  onContinueShopping,
  onCheckout
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-16">
          <div className="text-6xl mb-4">☕</div>
          <h2 className="text-2xl font-blueprint-bold text-blueprint-dark mb-2">Your cart is empty</h2>
          <p className="text-blueprint-gray-soft mb-6 font-blueprint">Add some delicious items to get started!</p>
          <button
            onClick={onContinueShopping}
            className="bg-blueprint-blue text-white px-6 py-3 rounded-lg hover:bg-blueprint-blue-dark transition-all duration-200 font-blueprint-bold"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={onContinueShopping}
          className="flex items-center space-x-2 text-blueprint-gray-soft hover:text-blueprint-blue transition-colors duration-200 font-blueprint"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Continue Shopping</span>
        </button>
        <h1 className="text-3xl font-blueprint-display text-blueprint-dark">Your Cart</h1>
        <button
          onClick={clearCart}
          className="text-red-500 hover:text-red-600 transition-colors duration-200 font-blueprint"
        >
          Clear All
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8 border-2 border-blueprint-blue/10">
        {cartItems.map((item, index) => (
          <div key={item.id} className={`p-6 ${index !== cartItems.length - 1 ? 'border-b border-blueprint-blue/10' : ''}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-blueprint-bold text-blueprint-dark mb-1">{item.name}</h3>
                {item.selectedVariation && (
                  <p className="text-sm text-blueprint-gray-soft mb-1 font-blueprint">Size: {item.selectedVariation.name}</p>
                )}
                {item.selectedAddOns && item.selectedAddOns.length > 0 && (
                  <p className="text-sm text-blueprint-gray-soft mb-1 font-blueprint">
                    Add-ons: {item.selectedAddOns.map(addOn => 
                      addOn.quantity && addOn.quantity > 1 
                        ? `${addOn.name} x${addOn.quantity}`
                        : addOn.name
                    ).join(', ')}
                  </p>
                )}
                <p className="text-lg font-blueprint-bold text-blueprint-blue">₱{item.totalPrice} each</p>
              </div>
              
              <div className="flex items-center space-x-4 ml-4">
                <div className="flex items-center space-x-3 bg-blueprint-blue/10 rounded-full p-1 border border-blueprint-blue/20">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="p-2 hover:bg-blueprint-blue/20 rounded-full transition-colors duration-200"
                  >
                    <Minus className="h-4 w-4 text-blueprint-blue" />
                  </button>
                  <span className="font-blueprint-bold text-blueprint-dark min-w-[32px] text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="p-2 hover:bg-blueprint-blue/20 rounded-full transition-colors duration-200"
                  >
                    <Plus className="h-4 w-4 text-blueprint-blue" />
                  </button>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-blueprint-bold text-blueprint-dark">₱{item.totalPrice * item.quantity}</p>
                </div>
                
                <button
                  onClick={() => removeFromCart(item.id)}
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-all duration-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blueprint-blue/10">
        <div className="flex items-center justify-between text-2xl font-blueprint-display text-blueprint-dark mb-6">
          <span>Total:</span>
          <span className="text-blueprint-blue">₱{parseFloat(getTotalPrice() || 0).toFixed(2)}</span>
        </div>
        
        <button
          onClick={onCheckout}
          className="w-full bg-blueprint-blue text-white py-4 rounded-xl hover:bg-blueprint-blue-dark transition-all duration-200 transform hover:scale-[1.02] font-blueprint-bold text-lg"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;