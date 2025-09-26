import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ cartItemsCount, onCartClick, onMenuClick }) => {
  const { siteSettings, loading } = useSiteSettings();

  return (
    <header className="sticky top-0 z-50 bg-blueprint-off-white/95 backdrop-blur-md border-b border-blueprint-blue/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <button 
            onClick={onMenuClick}
            className="flex items-center space-x-4 text-blueprint-dark hover:text-blueprint-blue transition-colors duration-200"
          >
            {loading ? (
              <div className="w-12 h-12 bg-blueprint-blue/10 rounded-full animate-pulse" />
            ) : (
              <div className="w-12 h-12 bg-blueprint-blue rounded-full flex items-center justify-center ring-2 ring-blueprint-blue/20">
                <span className="text-white font-blueprint-bold text-lg">B</span>
              </div>
            )}
            <div className="text-left">
              <h1 className="text-3xl font-blueprint-display text-blueprint-blue">
                {loading ? (
                  <div className="w-32 h-8 bg-blueprint-blue/10 rounded animate-pulse" />
                ) : (
                  "BLUEPRINT"
                )}
              </h1>
              <p className="text-sm font-blueprint text-blueprint-gray-soft -mt-1">
                {loading ? (
                  <div className="w-16 h-4 bg-blueprint-blue/10 rounded animate-pulse" />
                ) : (
                  "CAFE"
                )}
              </p>
            </div>
          </button>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-blueprint text-blueprint-gray-soft">OPEN DAILY</p>
              <p className="text-sm font-blueprint-bold text-blueprint-dark">9:00AM - 10:00PM</p>
            </div>
            <button 
              onClick={onCartClick}
              className="relative p-3 text-blueprint-gray-soft hover:text-blueprint-blue hover:bg-blueprint-blue/5 rounded-full transition-all duration-200"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-blueprint-blue text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-bounce-gentle font-blueprint-bold">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;