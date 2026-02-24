import React, { useState } from 'react';
import { Plus, Minus, X, ShoppingCart } from 'lucide-react';
import { MenuItem, Variation, AddOn } from '../types';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToCart: (item: MenuItem, quantity?: number, variations?: Variation | Variation[], addOns?: AddOn[]) => void;
  quantity: number;
  onUpdateQuantity: (id: string, quantity: number) => void;
  allItems?: MenuItem[];
  cartItems?: { id: string; quantity: number }[];
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  onAddToCart,
  quantity,
  onUpdateQuantity,
  allItems = [],
  cartItems = [],
}) => {
  const [showCustomization, setShowCustomization] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<(AddOn & { quantity: number })[]>([]);

  // Group variations by type
  const variationGroups = React.useMemo(() => {
    const map = new Map<string, Variation[]>();
    (item.variations || []).forEach(v => {
      const key = v.type || 'Variation';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    return Array.from(map.entries()); // [ [type, Variation[]], ... ]
  }, [item.variations]);

  // Track one selected variation per type
  const [selectedVariationsByType, setSelectedVariationsByType] = useState<Record<string, Variation>>(() => {
    const initial: Record<string, Variation> = {};
    const map = new Map<string, Variation[]>();
    (item.variations || []).forEach(v => {
      const key = v.type || 'Variation';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    });
    map.forEach((vars, type) => { if (vars[0]) initial[type] = vars[0]; });
    return initial;
  });

  // Flatten selected variations into an array
  const selectedVariationsArray = Object.values(selectedVariationsByType);

  const calculatePrice = () => {
    let price = item.effectivePrice || item.basePrice;
    selectedVariationsArray.forEach(v => { price += v.price; });
    selectedAddOns.forEach(addOn => { price += addOn.price * addOn.quantity; });
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
    const addOnsForCart: AddOn[] = selectedAddOns.flatMap(addOn =>
      Array(addOn.quantity).fill({ ...addOn, quantity: undefined })
    );
    onAddToCart(item, 1, selectedVariationsArray, addOnsForCart);
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
                className="w-7 h-7 md:w-10 md:h-10 bg-gray-200 text-gray-500 rounded-full cursor-not-allowed flex items-center justify-center"
                style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
              >
                <X className="h-3.5 w-3.5 md:h-5 md:w-5" />
              </button>
            ) : quantity === 0 ? (
              <button
                onClick={handleAddToCart}
                className="w-7 h-7 md:w-10 md:h-10 bg-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
                style={{ 
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                  strokeWidth: '2.5px'
                }}
              >
                <Plus className="h-3.5 w-3.5 md:h-5 md:w-5" style={{ color: '#1E3A8A' }} />
              </button>
            ) : (
              <div className="flex items-center space-x-0.5 md:space-x-1.5 bg-white rounded-full p-0.5 md:p-1.5" style={{ boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}>
                <button
                  onClick={handleDecrement}
                  className="w-5 h-5 md:w-7 md:h-7 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
                >
                  <Minus className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" style={{ color: '#1E3A8A' }} />
                </button>
                <span className="font-semibold min-w-[16px] md:min-w-[24px] text-center text-xs md:text-base" style={{ color: '#1E1E1E' }}>{quantity}</span>
                <button
                  onClick={handleIncrement}
                  className="w-5 h-5 md:w-7 md:h-7 hover:bg-gray-100 rounded-full transition-colors duration-200 flex items-center justify-center"
                >
                  <Plus className="h-2.5 w-2.5 md:h-3.5 md:w-3.5" style={{ color: '#1E3A8A' }} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Text Section - Below Card */}
        <div className="mt-2">
          {/* Product Title */}
          <h4 className="text-sm md:text-base font-semibold leading-tight mb-1" style={{ 
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
          <div className="text-sm md:text-base" style={{ 
            color: '#666666',
            fontSize: '13px',
            fontWeight: '400',
            lineHeight: '1.4'
          }}>
            {item.isOnDiscount && item.discountPrice ? (
              <div className="flex items-center space-x-2">
                <span>from ₱{item.discountPrice.toFixed(0)}</span>
                <span className="text-xs md:text-sm line-through opacity-75">₱{item.basePrice.toFixed(0)}</span>
              </div>
            ) : (
              <span>from ₱{item.basePrice.toFixed(0)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Customization Full-Screen Sheet */}
      {showCustomization && (() => {
        const suggestedItems = allItems
          .filter(i => i.id !== item.id && i.category === item.category && i.available !== false)
          .slice(0, 6);

        return (
        <div className="fixed inset-0 z-50 flex flex-col">
          {/* Sheet — full screen, slides up */}
          <div
            className="relative w-full h-full flex flex-col overflow-hidden"
            style={{
              background: '#FAFAF8',
              animation: 'ccSlideUp 0.42s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Hero image */}
            <div className="relative flex-shrink-0 overflow-hidden" style={{ height: '42dvh', minHeight: '220px', maxHeight: '340px' }}>
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1E3A8A, #1E40AF)' }}
                >
                  <span className="text-6xl opacity-20">☕</span>
                </div>
              )}
              {/* Gradient fade into sheet */}
              <div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, transparent 35%, rgba(250,250,248,0.72) 72%, #FAFAF8 100%)',
                }}
              />
              {/* Close button */}
              <button
                onClick={() => setShowCustomization(false)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                style={{ background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(6px)' }}
              >
                <X className="h-4 w-4 text-white" />
              </button>
              {/* Item title overlaid at bottom of image */}
              <div className="absolute bottom-0 left-0 right-0 px-5 pb-3">
                <h2
                  className="text-2xl font-bold leading-tight"
                  style={{ color: '#1E1E1E', fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.02em' }}
                >
                  {item.name}
                </h2>
                {item.description && (
                  <p className="text-sm mt-1 line-clamp-1" style={{ color: '#777' }}>
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ background: '#D8D8D0' }} />
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-5 pt-3 pb-32">

              {/* Variations — one section per type */}
              {variationGroups.map(([type, vars]) => (
                <div key={type} className="mb-7">
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className="font-semibold text-base"
                      style={{ color: '#1E1E1E', letterSpacing: '-0.01em' }}
                    >
                      {type}
                    </h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: 'rgba(30,58,138,0.08)', color: '#1E3A8A' }}
                    >
                      Pick 1
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {vars.map((variation) => {
                      const isSelected = selectedVariationsByType[type]?.id === variation.id;
                      return (
                        <button
                          key={variation.id}
                          type="button"
                          onClick={() =>
                            setSelectedVariationsByType(prev => ({ ...prev, [type]: variation }))
                          }
                          className="relative p-4 rounded-2xl text-left transition-all duration-200 active:scale-95"
                          style={{
                            background: isSelected ? '#1E3A8A' : '#fff',
                            border: `2px solid ${isSelected ? '#1E3A8A' : '#EAEAE6'}`,
                            boxShadow: isSelected
                              ? '0 4px 18px rgba(30,58,138,0.28)'
                              : '0 1px 4px rgba(0,0,0,0.05)',
                          }}
                        >
                          {isSelected && (
                            <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full border-2 border-white/40 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-white" />
                            </div>
                          )}
                          <div
                            className="font-semibold text-sm mb-0.5"
                            style={{ color: isSelected ? '#fff' : '#1E1E1E' }}
                          >
                            {variation.name}
                          </div>
                          <div
                            className="text-xs"
                            style={{ color: isSelected ? 'rgba(255,255,255,0.65)' : '#999' }}
                          >
                            {variation.price === 0 ? 'Included' : `+₱${variation.price.toFixed(0)}`}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Add-ons */}
              {groupedAddOns && Object.keys(groupedAddOns).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3
                      className="font-semibold text-base"
                      style={{ color: '#1E1E1E', letterSpacing: '-0.01em' }}
                    >
                      Add-ons
                    </h3>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: '#F0F0EC', color: '#999' }}
                    >
                      Optional
                    </span>
                  </div>
                  <div className="space-y-5">
                    {Object.entries(groupedAddOns).map(([category, addOns]) => (
                      <div key={category}>
                        <p
                          className="text-xs font-bold uppercase tracking-widest mb-2.5"
                          style={{ color: '#B8B8B0' }}
                        >
                          {category.replace(/-/g, ' ')}
                        </p>
                        <div className="space-y-2">
                          {addOns.map((addOn) => {
                            const selected = selectedAddOns.find(a => a.id === addOn.id);
                            return (
                              <div
                                key={addOn.id}
                                className="flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-200"
                                style={{
                                  background: selected ? 'rgba(30,58,138,0.05)' : '#fff',
                                  border: `1.5px solid ${selected ? 'rgba(30,58,138,0.2)' : '#EAEAE6'}`,
                                }}
                              >
                                <div>
                                  <div className="font-medium text-sm" style={{ color: '#1E1E1E' }}>
                                    {addOn.name}
                                  </div>
                                  <div className="text-xs mt-0.5" style={{ color: '#AAA' }}>
                                    {addOn.price > 0 ? `+₱${addOn.price.toFixed(0)}` : 'Free'}
                                  </div>
                                </div>

                                {selected ? (
                                  <div
                                    className="flex items-center gap-1 rounded-xl p-1"
                                    style={{ background: 'rgba(30,58,138,0.1)' }}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => updateAddOnQuantity(addOn, selected.quantity - 1)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90"
                                      style={{ background: '#1E3A8A', color: '#fff' }}
                                    >
                                      <Minus className="h-3 w-3" />
                                    </button>
                                    <span
                                      className="w-6 text-center text-sm font-bold"
                                      style={{ color: '#1E3A8A' }}
                                    >
                                      {selected.quantity}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => updateAddOnQuantity(addOn, selected.quantity + 1)}
                                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 active:scale-90"
                                      style={{ background: '#1E3A8A', color: '#fff' }}
                                    >
                                      <Plus className="h-3 w-3" />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => updateAddOnQuantity(addOn, 1)}
                                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-95"
                                    style={{ background: '#1E3A8A', color: '#fff' }}
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    Add
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Suggested Items */}
              {suggestedItems.length > 0 && (
                <div className="mb-6 mt-2">
                  <div className="mb-3">
                    <h3
                      className="font-semibold text-base"
                      style={{ color: '#1E1E1E', letterSpacing: '-0.01em' }}
                    >
                      You might also like
                    </h3>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                    {suggestedItems.map((s) => {
                      const sCartQty = cartItems.find(c => c.id === s.id)?.quantity || 0;
                      const displayPrice = s.effectivePrice ?? s.basePrice;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => {
                            if (s.variations?.length || s.addOns?.length) {
                              // add 1 to cart; they can open it from menu to customize
                              onAddToCart(s, 1);
                            } else {
                              onAddToCart(s, 1);
                            }
                          }}
                          className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-200 active:scale-95"
                          style={{
                            width: '130px',
                            background: '#fff',
                            border: '1.5px solid #EAEAE6',
                            boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                          }}
                        >
                          {/* Image */}
                          <div className="relative overflow-hidden" style={{ height: '88px' }}>
                            {s.image ? (
                              <img
                                src={s.image}
                                alt={s.name}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #1E3A8A22, #1E40AF33)' }}
                              >
                                <span className="text-2xl opacity-30">☕</span>
                              </div>
                            )}
                            {sCartQty > 0 && (
                              <div
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: '#1E3A8A' }}
                              >
                                {sCartQty}
                              </div>
                            )}
                          </div>
                          {/* Info */}
                          <div className="p-2.5">
                            <div
                              className="font-medium leading-tight mb-1"
                              style={{
                                color: '#1E1E1E',
                                fontSize: '12px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {s.name}
                            </div>
                            <div className="flex items-center justify-between">
                              <span style={{ color: '#888', fontSize: '11px' }}>
                                ₱{displayPrice.toFixed(0)}
                              </span>
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{ background: '#1E3A8A' }}
                              >
                                <Plus className="h-2.5 w-2.5 text-white" />
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Sticky bottom bar */}
            <div
              className="flex-shrink-0 flex items-center gap-4 px-5"
              style={{
                background: '#FAFAF8',
                borderTop: '1px solid #EAEAE6',
                paddingTop: '16px',
                paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
              }}
            >
              <div className="flex-shrink-0">
                <div className="text-xs font-medium mb-0.5" style={{ color: '#AAA' }}>Total</div>
                <div
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: '#1E1E1E', fontFamily: 'Georgia, "Times New Roman", serif' }}
                >
                  ₱{calculatePrice().toFixed(0)}
                </div>
              </div>
              <button
                onClick={handleCustomizedAddToCart}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold text-base transition-all duration-200 active:scale-95"
                style={{
                  background: '#1E3A8A',
                  color: '#fff',
                  boxShadow: '0 4px 22px rgba(30,58,138,0.38)',
                }}
              >
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
            </div>
          </div>

          <style>{`
            @keyframes ccSlideUp {
              from { transform: translateY(100%); }
              to { transform: translateY(0); }
            }
          `}</style>
        </div>
        );
      })()}
    </>
  );
};

export default MenuItemCard;