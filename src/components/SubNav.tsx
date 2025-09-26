import React from 'react';
import { useCategories } from '../hooks/useCategories';

interface SubNavProps {
  selectedCategory: string;
  onCategoryClick: (categoryId: string) => void;
}

const SubNav: React.FC<SubNavProps> = ({ selectedCategory, onCategoryClick }) => {
  const { categories, loading } = useCategories();

  return (
    <div className="sticky top-20 z-40 bg-blueprint-off-white/95 backdrop-blur-md border-b border-blueprint-blue/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-6 overflow-x-auto py-4 scrollbar-hide">
          {loading ? (
            <div className="flex space-x-6">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-10 w-24 bg-blueprint-blue/10 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <button
                onClick={() => onCategoryClick('all')}
                className={`px-6 py-2 rounded-lg text-sm font-blueprint-bold transition-all duration-200 ${
                  selectedCategory === 'all'
                    ? 'bg-blueprint-blue text-white shadow-md'
                    : 'bg-blueprint-blue/5 text-blueprint-blue hover:bg-blueprint-blue/10 border border-blueprint-blue/20'
                }`}
              >
                All Items
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onCategoryClick(c.id)}
                  className={`px-6 py-2 rounded-lg text-sm font-blueprint-bold transition-all duration-200 flex items-center space-x-2 ${
                    selectedCategory === c.id
                      ? 'bg-blueprint-blue text-white shadow-md'
                      : 'bg-blueprint-blue/5 text-blueprint-blue hover:bg-blueprint-blue/10 border border-blueprint-blue/20'
                  }`}
                >
                  <span className="text-lg">{c.icon}</span>
                  <span>{c.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubNav;


