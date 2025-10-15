import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variation?: Variation, addOns?: AddOn[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  item, 
  onAddToCart, 
  quantity, 
  onUpdateQuantity 
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<Variation | undefined>(
    item.variations?.[0]
  );
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  const calculatePrice = () => {
    // Use effective price (discounted or regular) as base
    let price = item.effectivePrice || item.basePrice;
    if (selectedVariation) {
      price = (item.effectivePrice || item.basePrice) + selectedVariation.price;
    }
    selectedAddOns.forEach(addOn => {
      price += addOn.price * addOn.quantity;
    });
    return price;
  };

  const handleAddToCart = () => {
    if (item.variations?.length || item.addOns?.length) {
      setShowCustomization(true);
    } else {
      onAddToCart(item, 1);
    }
  };

  const handleCustomizedAddToCart = () => {
    // Convert selectedAddOns back to regular AddOn array for cart
    const addOnsForCart: AddOn[] = selectedAddOns.flatMap(addOn => 
      Array(addOn.quantity).fill({ ...addOn, quantity: undefined })
    );
    onAddToCart(item, 1, selectedVariation, addOnsForCart);
    setShowCustomization(false);
    setSelectedAddOns([]);
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.id, quantity + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      onUpdateQuantity(item.id, quantity - 1);
    }
  };

  const updateAddOnQuantity = (addOn: AddOn, quantity: number) => {
    setSelectedAddOns(prev => {
      const existingIndex = prev.findIndex(a => a.id === addOn.id);
      
      if (quantity === 0) {
        // Remove add-on if quantity is 0
        return prev.filter(a => a.id !== addOn.id);
      }
      
      if (existingIndex >= 0) {
        // Update existing add-on quantity
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], quantity };
        return updated;
      } else {
        // Add new add-on with quantity
        return [...prev, { ...addOn, quantity }];
      }
    });
  };

  const groupedAddOns = item.addOns?.reduce((groups, addOn) => {
    const category = addOn.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(addOn);
    return groups;
  }, {} as Record<string, AddOn[]>);

  return (
    <>
      <div className="w-full">
        {/* Card Container - Blueish Gradient Design */}
        <div className={`relative aspect-square rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 group ${!item.available ? 'opacity-60' : ''}`}
             style={{
               background: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 25%, #1E40AF 50%, #1E3A8A 75%, #1E2A5E 100%)',
               boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
             }}>
          
          {/* Product Image - Covering the entire box */}
          <div className="absolute inset-0 z-10">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover rounded-2xl transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                decoding="async"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <div className={`absolute inset-0 flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
              <div className="text-6xl opacity-30" style={{ color: '#1E3A8A' }}>☕</div>
            </div>
          </div>
          
          {/* Popular Badge - Top Right */}
          {item.popular && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
              Popular
            </div>
          )}
          
          {!item.available && (
            <div className="absolute top-3 left-3 bg-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
              Unavailable
            </div>
          )}
          
          {/* Add to Cart Button - Bottom Right Corner */}
          <div className="absolute bottom-2 right-2 z-20">
            {!item.available ? (
              <button
                disabled
                className="w-7 h-7 bg-gray-200 text-gray-500 rounded-full cursor-not-allowed flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="w-7 h-7 bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{ 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  strokeWidth: '2.5px'
                }}
              >
                <Plus className="h-3.5 w-3.5" style={{ color: '#1E3A8A' }} />
              </button>
            ) : (
              <div className="flex items-center space-x-0.5 bg-white rounded-full p-0.5" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
                <button
                  onClick={handleDecrement}
                  className="w-5 h-5 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
                >
                  <Minus className="h-2.5 w-2.5" style={{ color: '#1E3A8A' }} />
                </button>
                <span className="font-semibold min-w-[16px] text-center text-xs" style={{ color: '#1E1E1E' }}>{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="w-5 h-5 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
                >
                  <Plus className="h-2.5 w-2.5" style={{ color: '#1E3A8A' }} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Text Section - Below Card */}
        <div className="mt-2">
          {/* Product Title */}
          <h4 className="text-sm font-semibold leading-tight mb-1" style={{ 
            color: '#1E1E1E',
            fontSize: '14px',
            fontWeight: '600',
            lineHeight: '1.3',
            maxHeight: '2.6em',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}>
            {item.name}
          </h4>
          
          {/* Product Price */}
          <div className="text-sm" style={{ 
            color: '#666666',
            fontSize: '13px',
            fontWeight: '400',
            lineHeight: '1.4'
          }}>
            {item.isOnDiscount && item.discountPrice ? (
              <div className="flex items-center space-x-2">
                <span>from ₱{item.discountPrice.toFixed(0)}</span>
                <span className="text-xs line-through opacity-75">₱{item.basePrice.toFixed(0)}</span>
              </div>
            ) : (
              <span>from ₱{item.basePrice.toFixed(0)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Customization Modal */}
      {showCustomization && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Customize {item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Choose your preferences</p>
              </div>
              <button
                onClick={() => setShowCustomization(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {/* Size Variations */}
              {item.variations && item.variations.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Choose Size</h4>
                  <div className="space-y-3">
                    {item.variations.map((variation) => (
                      <label
                        key={variation.id}
                        className={`flex items-center justify-between p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                          selectedVariation?.id === variation.id
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="variation"
                            checked={selectedVariation?.id === variation.id}
                            onChange={() => setSelectedVariation(variation)}
                            className="text-red-600 focus:ring-red-500"
                          />
                          <span className="font-medium text-gray-900">{variation.name}</span>
                        </div>
                        <span className="text-gray-900 font-semibold">
                          ₱{((item.effectivePrice || item.basePrice) + variation.price).toFixed(2)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Add-ons</h4>
                  {Object.entries(groupedAddOns).map(([category, addOns]) => (
                    <div key={category} className="mb-4">
                      <h5 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                        {category.replace('-', ' ')}
                      </h5>
                      <div className="space-y-3">
                        {addOns.map((addOn) => (
                          <div
                            key={addOn.id}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">{addOn.name}</span>
                              <div className="text-sm text-gray-600">
                                {addOn.price > 0 ? `₱${addOn.price.toFixed(2)} each` : 'Free'}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {selectedAddOns.find(a => a.id === addOn.id) ? (
                                <div className="flex items-center space-x-2 bg-red-100 rounded-xl p-1 border border-red-200">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 1) - 1);
                                    }}
                                    className="p-1.5 hover:bg-red-200 rounded-lg transition-colors duration-200"
                                  >
                                    <Minus className="h-3 w-3 text-red-600" />
                                  </button>
                                  <span className="font-semibold text-gray-900 min-w-[24px] text-center text-sm">
                                    {selectedAddOns.find(a => a.id === addOn.id)?.quantity || 0}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const current = selectedAddOns.find(a => a.id === addOn.id);
                                      updateAddOnQuantity(addOn, (current?.quantity || 0) + 1);
                                    }}
                                    className="p-1.5 hover:bg-red-200 rounded-lg transition-colors duration-200"
                                  >
                                    <Plus className="h-3 w-3 text-red-600" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => updateAddOnQuantity(addOn, 1)}
                                  className="flex items-center space-x-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 text-sm font-medium shadow-lg"
                                >
                                  <Plus className="h-3 w-3" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Price Summary */}
              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex items-center justify-between text-2xl font-bold text-gray-900">
                  <span>Total:</span>
                  <span className="text-red-600">₱{calculatePrice().toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCustomizedAddToCart}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-4 rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Add to Cart - ₱{calculatePrice().toFixed(2)}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MenuItemCard;