-- Complete Blueprint Cafe Menu Migration
-- This script adds all menu items, categories, add-ons, and variations from the Blueprint Cafe menu

-- 1. Insert Categories
INSERT INTO categories (id, name, icon, sort_order, active) VALUES
  ('coffee-classics', 'Coffee Classics', '☕', 1, true),
  ('flavored-lattes', 'Flavored Lattes', '🥛', 2, true),
  ('specialty-drinks', 'Specialty Drinks', '⭐', 3, true),
  ('non-coffee', 'Non-Coffee', '🍵', 4, true),
  ('pasta', 'Pasta', '🍝', 5, true),
  ('pizza', 'Pizza', '🍕', 6, true),
  ('all-day-breakfast', 'All Day Breakfast', '🍳', 7, true),
  ('sandwiches', 'Sandwiches', '🥪', 8, true),
  ('pastry', 'Pastry', '🧁', 9, true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active;

-- 2. Insert Coffee Classics
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Espresso', 'A classic shot of concentrated coffee', 75, 'coffee-classics', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Americano', 'Espresso with hot water for a smooth, clean taste', 75, 'coffee-classics', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Cappuccino', 'Espresso with steamed milk and foam', 120, 'coffee-classics', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'French Vanilla', 'Rich vanilla flavored coffee', 130, 'coffee-classics', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Caramel Macchiato', 'Espresso with vanilla syrup, steamed milk, and caramel drizzle', 130, 'coffee-classics', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 3. Insert Flavored Lattes
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Salted Caramel', 'Rich caramel with a hint of sea salt', 130, 'flavored-lattes', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'White Mocha', 'Creamy white chocolate mocha', 130, 'flavored-lattes', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Spanish Latte', 'Traditional Spanish-style latte with condensed milk', 130, 'flavored-lattes', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Choco Hazelnut', 'Rich chocolate with hazelnut flavor', 130, 'flavored-lattes', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 4. Insert Specialty Drinks
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Blueprint Special', 'Our signature house blend with special ingredients', 170, 'specialty-drinks', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Sea Foam Americano', 'Americano topped with sea foam', 120, 'specialty-drinks', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Crema España', 'Spanish cream coffee specialty', 160, 'specialty-drinks', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Oatmilk Latte', 'Latte made with creamy oat milk', 180, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Honey Vanilla Oat Latte', 'Oat milk latte with honey and vanilla', 180, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'ICHIGO Matcha Latte', 'Strawberry matcha latte', 180, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Dirty Matcha', 'Matcha with espresso shot', 180, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 5. Insert Non-Coffee Drinks
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Matcha Latte', 'Traditional Japanese matcha green tea latte', 150, 'non-coffee', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Rich Chocolate', 'Decadent hot chocolate', 150, 'non-coffee', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Hot Tea', 'Selection of premium teas', 120, 'non-coffee', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Iced Shaken Strawberry', 'Refreshing strawberry iced tea', 150, 'non-coffee', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Pink Guava', 'Tropical pink guava drink', 120, 'non-coffee', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Triple Peach', 'Triple peach flavor drink', 120, 'non-coffee', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Black Tea & Pomegranate', 'Black tea with pomegranate flavor', 120, 'non-coffee', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'NZ Apple', 'New Zealand apple drink', 120, 'non-coffee', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Green Tea - Lychee', 'Green tea with lychee flavor', 120, 'non-coffee', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 6. Insert Pasta Items
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Sweet Basil Pomodoro', 'Fresh tomato sauce with sweet basil', 225, 'pasta', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Savory Amatriciana Duo', 'Traditional Italian amatriciana sauce', 395, 'pasta', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Bacon Beef Penne Ala Creamy Pomodoro', 'Penne with bacon, beef, and creamy tomato sauce', 330, 'pasta', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Loaded Four-Cheese Lasagna Indulgence', 'Rich lasagna with four types of cheese', 350, 'pasta', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Classic Carbonara', 'Traditional Italian carbonara with eggs and cheese', 375, 'pasta', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'BP Truffle Cream Special', 'Our signature truffle cream pasta', 425, 'pasta', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Penne Ala Baked Zitti', 'Baked penne with zitti sauce', 330, 'pasta', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Penne Fra Diablo', 'Spicy penne with diablo sauce', 275, 'pasta', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 7. Insert Pizza Items
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Pepperoni & Oregano Bliss', 'Classic pepperoni pizza with oregano', 375, 'pizza', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Four Cheese Pizza', 'Pizza with four different cheeses', 375, 'pizza', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Baked Ham Pizza', 'Pizza topped with baked ham', 375, 'pizza', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 8. Insert Breakfast Items
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Eggs & BP Toast', 'Scrambled eggs with Blueprint buttered toast', 195, 'all-day-breakfast', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Ham, Eggs, & BP Toast', 'Ham and eggs with Blueprint buttered toast', 275, 'all-day-breakfast', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Bacon, Eggs, & BP Toast', 'Bacon and eggs with Blueprint buttered toast', 275, 'all-day-breakfast', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 9. Insert Sandwich Items
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Tuna', 'Fresh tuna sandwich', 195, 'sandwiches', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Egg Mayo', 'Creamy egg mayonnaise sandwich', 175, 'sandwiches', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Grilled Cheesy', 'Grilled cheese sandwich', 225, 'sandwiches', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Hazelnut', 'Hazelnut spread sandwich', 145, 'sandwiches', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'White Choco Hazelnut', 'White chocolate hazelnut sandwich', 160, 'sandwiches', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 10. Insert Pastry Items
INSERT INTO menu_items (id, name, description, base_price, category, popular, available, image_url) VALUES
  (gen_random_uuid(), 'Choco Chip Cookies', 'Freshly baked chocolate chip cookies', 160, 'pastry', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Brownies', 'Rich chocolate brownies', 120, 'pastry', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop'),
  (gen_random_uuid(), 'Banana Bread', 'Homemade banana bread', 145, 'pastry', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop');

-- 11. Add Drink Add-ons to All Coffee and Non-Coffee Items
INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Extra Shot',
  60,
  'drinks'
FROM menu_items mi
WHERE mi.category IN ('coffee-classics', 'flavored-lattes', 'specialty-drinks', 'non-coffee');

INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Oatmilk',
  40,
  'drinks'
FROM menu_items mi
WHERE mi.category IN ('coffee-classics', 'flavored-lattes', 'specialty-drinks', 'non-coffee');

INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Sea Salt Foam',
  40,
  'drinks'
FROM menu_items mi
WHERE mi.category IN ('coffee-classics', 'flavored-lattes', 'specialty-drinks', 'non-coffee');

-- 12. Add Food Add-ons to Breakfast Items
INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'BP Buttered Toast (3 Slices)',
  75,
  'food'
FROM menu_items mi
WHERE mi.category = 'all-day-breakfast';

INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Egg',
  45,
  'food'
FROM menu_items mi
WHERE mi.category = 'all-day-breakfast';

INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Bacon',
  85,
  'food'
FROM menu_items mi
WHERE mi.category = 'all-day-breakfast';

INSERT INTO add_ons (id, menu_item_id, name, price, category) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Ham',
  75,
  'food'
FROM menu_items mi
WHERE mi.category = 'all-day-breakfast';

-- 13. Add Size Variations to All Drink Items
INSERT INTO variations (id, menu_item_id, name, price) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Hot 10oz',
  0
FROM menu_items mi
WHERE mi.category IN ('coffee-classics', 'flavored-lattes', 'specialty-drinks', 'non-coffee');

INSERT INTO variations (id, menu_item_id, name, price) 
SELECT 
  gen_random_uuid(),
  mi.id,
  'Cold 16oz',
  0
FROM menu_items mi
WHERE mi.category IN ('coffee-classics', 'flavored-lattes', 'specialty-drinks', 'non-coffee');

-- 14. Update site settings for Blueprint Cafe
UPDATE site_settings SET value = 'Blueprint Cafe' WHERE id = 'site_name';
UPDATE site_settings SET value = 'Welcome to Blueprint Cafe - Your perfect coffee destination' WHERE id = 'site_description';
UPDATE site_settings SET value = 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop' WHERE id = 'site_logo';