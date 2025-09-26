import React from 'react';

const Hero: React.FC = () => {
  return (
    <section className="relative bg-gradient-to-br from-blueprint-off-white to-blueprint-cream py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-7xl font-blueprint-display text-blueprint-blue mb-6 animate-fade-in">
            MENU
          </h1>
          <div className="inline-flex items-center justify-center mb-8">
            <div className="bg-blueprint-blue rounded-full px-8 py-3">
              <h2 className="text-2xl font-blueprint-bold text-white">BLUEPRINT</h2>
              <p className="text-sm font-blueprint text-blue-100 -mt-1">CAFE</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left">
            <p className="text-xl font-blueprint text-blueprint-gray-soft mb-8 animate-slide-up">
              Crafted coffee experiences with premium beans and artisanal brewing methods. 
              From classic espresso to innovative specialty drinks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a 
                href="#coffee-classics"
                className="bg-blueprint-blue text-white px-8 py-4 rounded-lg hover:bg-blueprint-blue-dark transition-all duration-300 transform hover:scale-105 font-blueprint-bold text-lg"
              >
                Coffee Classics
              </a>
              <a 
                href="#specialty-drinks"
                className="border-2 border-blueprint-blue text-blueprint-blue px-8 py-4 rounded-lg hover:bg-blueprint-blue hover:text-white transition-all duration-300 transform hover:scale-105 font-blueprint-bold text-lg"
              >
                Specialty Drinks
              </a>
            </div>
          </div>
          
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              {/* Coffee cups illustration inspired by the menu design */}
              <div className="relative w-64 h-64">
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-white border-4 border-blueprint-blue rounded-lg"></div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-white border-4 border-blueprint-blue rounded-lg"></div>
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-white border-4 border-blueprint-blue rounded-lg"></div>
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-16 h-20 bg-white border-4 border-blueprint-blue rounded-lg">
                  <div className="w-full h-full bg-blueprint-blue/20 rounded-t-lg"></div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-blueprint-blue rounded-full flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;