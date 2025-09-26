/*
  # Add Blueprint Cafe Menu Items
  
  This migration adds all the Blueprint Cafe menu items including:
  - Food Menu (Pasta, Pizza, Sandwiches, Bakery & Snacks)
  - Drink Menu (Coffee Classics, Flavored Lattes, Specialty Drinks, Non-Coffee)
  
  Categories will be created and menu items will be inserted with proper pricing.
*/

-- First, let's create the new categories for Blueprint Cafe
INSERT INTO categories (id, name, icon, sort_order, active, created_at, updated_at) VALUES
  ('pasta', 'Pasta', '🍝', 1, true, now(), now()),
  ('pizza', 'Pizza', '🍕', 2, true, now(), now()),
  ('sandwiches', 'Sandwiches', '🥪', 3, true, now(), now()),
  ('bakery-snacks', 'Bakery & Snacks', '🥐', 4, true, now(), now()),
  ('coffee-classics', 'Coffee Classics', '☕', 5, true, now(), now()),
  ('flavored-lattes', 'Flavored Lattes', '🥤', 6, true, now(), now()),
  ('specialty-drinks', 'Specialty Drinks', '🌟', 7, true, now(), now()),
  ('non-coffee', 'Non-Coffee', '🧊', 8, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order,
  active = EXCLUDED.active,
  updated_at = now();

-- Clear existing menu items to start fresh with Blueprint Cafe menu
DELETE FROM menu_items;

-- Insert Pasta items
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Sweet Basil Pomodoro', 'Sweet, slightly spicy, homemade Pomodoro sauce', 60.00, 'pasta', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Lemon Caper Agio E Olio', 'Extra virgin olive oil, lemon, capers, and fresh parsley', 120.00, 'pasta', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Savory Amatriciana Duo', 'Beef, bacon, onions, garlic, and signature sauce', 150.00, 'pasta', true, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Creamy Tomato Basil Penne Bliss', 'Creamy tomato basil, secret creamy-sauce base', 180.00, 'pasta', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Five-Cheese Lasagna Indulgence', '2 layered, five cheeses, meat sauce, baked', 180.00, 'pasta', true, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Carbonara', 'With truffle oil', 150.00, 'pasta', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Truffle Cream Special', 'Truffle, bacon, secret sauce', 180.00, 'pasta', true, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Pizza items
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Pepperoni & Oregano Bliss', 'Classic pepperoni pizza with fresh oregano', 60.00, 'pizza', true, true, 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Six Cheese Pizza', 'A blend of six different cheeses for ultimate cheesiness', 60.00, 'pizza', false, true, 'https://images.pexels.com/photos/1566837/pexels-photo-1566837.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Sandwiches
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Tuna Sandwich', 'Fresh tuna with crisp vegetables', 60.00, 'sandwiches', false, true, 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Egg Mayo Sandwich', 'Creamy egg mayonnaise with fresh bread', 60.00, 'sandwiches', false, true, 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Cheesy Sandwich', 'Melted cheese with your choice of fillings', 60.00, 'sandwiches', false, true, 'https://images.pexels.com/photos/1600711/pexels-photo-1600711.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Bakery & Snacks
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Apple & Cream Cheese Croissant', 'Flaky croissant with apple and cream cheese filling', 80.00, 'bakery-snacks', false, true, 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Banana Hazelnut Croissant', 'Rich croissant with banana and hazelnut spread', 80.00, 'bakery-snacks', false, true, 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Chocolate Cookies', 'Rich chocolate cookies baked fresh daily', 40.00, 'bakery-snacks', false, true, 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Oatmeal Cookies', 'Hearty oatmeal cookies with a soft center', 40.00, 'bakery-snacks', false, true, 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Sugar Cookies', 'Classic sugar cookies, perfect with coffee', 40.00, 'bakery-snacks', false, true, 'https://images.pexels.com/photos/230325/pexels-photo-230325.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Coffee Classics
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Espresso', 'Rich, full-bodied espresso shot', 60.00, 'coffee-classics', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Americano', 'Espresso with hot water for a smooth, clean taste', 120.00, 'coffee-classics', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Cappuccino', 'Perfect balance of espresso, steamed milk, and foam', 150.00, 'coffee-classics', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('French Vanilla', 'Smooth coffee with sweet vanilla flavor', 180.00, 'coffee-classics', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Caramel Macchiato', 'Espresso with vanilla syrup, steamed milk, and caramel drizzle', 180.00, 'coffee-classics', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Flavored Lattes
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Salted Caramel Latte', 'Rich latte with salted caramel syrup', 200.00, 'flavored-lattes', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('White Mocha Latte', 'Creamy white chocolate mocha latte', 200.00, 'flavored-lattes', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Spanish Latte', 'Traditional Spanish-style latte with condensed milk', 220.00, 'flavored-lattes', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Choco Hazelnut Latte', 'Decadent chocolate hazelnut latte', 220.00, 'flavored-lattes', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Specialty Drinks
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Blueprint Special', 'Our signature coffee blend with special ingredients', 220.00, 'specialty-drinks', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Amerikano', 'Unique take on the classic Americano', 220.00, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Espana', 'Spanish-inspired coffee creation', 220.00, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Oatmilk Latte', 'Creamy oatmilk latte for a dairy-free option', 200.00, 'specialty-drinks', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Macadamia Oat Latte', 'Rich macadamia nut flavor with oatmilk', 200.00, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Honey Vanilla Oat Latte', 'Sweet honey and vanilla with oatmilk', 200.00, 'specialty-drinks', false, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Dirty Matcha', 'Matcha latte with a shot of espresso', 200.00, 'specialty-drinks', true, true, 'https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Insert Non-Coffee Drinks
INSERT INTO menu_items (name, description, base_price, category, popular, available, image_url, created_at, updated_at) VALUES
  ('Iced Shaken Strawberry', 'Refreshing strawberry drink, shaken not stirred', 150.00, 'non-coffee', true, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Matcha Latte', 'Creamy matcha green tea latte', 180.00, 'non-coffee', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Rich Chocolate', 'Decadent hot chocolate made with premium cocoa', 200.00, 'non-coffee', true, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Pink Guava', 'Tropical pink guava drink', 150.00, 'non-coffee', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Triple Peach', 'Three times the peach flavor', 150.00, 'non-coffee', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Black Tea & Pomegranate', 'Earl Grey black tea with pomegranate', 150.00, 'non-coffee', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Apple', 'Fresh apple juice or apple tea', 150.00, 'non-coffee', false, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now()),
  ('Green Tea - Lychee', 'Green tea infused with lychee flavor', 150.00, 'non-coffee', true, true, 'https://images.pexels.com/photos/1435735/pexels-photo-1435735.jpeg?auto=compress&cs=tinysrgb&w=800', now(), now());

-- Update site settings to reflect Blueprint Cafe branding
UPDATE site_settings SET 
  value = 'Blueprint Cafe',
  updated_at = now()
WHERE id = 'site_name';

UPDATE site_settings SET 
  value = 'Welcome to Blueprint Cafe - Your perfect coffee destination',
  updated_at = now()
WHERE id = 'site_description';

-- Add some variations for certain items (like croissants and cookies)
-- Note: These will be added after menu items are created, using subqueries to get the IDs
INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Regular', 0, now() FROM menu_items WHERE name = 'Apple & Cream Cheese Croissant';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Regular', 0, now() FROM menu_items WHERE name = 'Banana Hazelnut Croissant';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Single', 0, now() FROM menu_items WHERE name = 'Chocolate Cookies';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Pack of 6', 200, now() FROM menu_items WHERE name = 'Chocolate Cookies';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Single', 0, now() FROM menu_items WHERE name = 'Oatmeal Cookies';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Pack of 6', 200, now() FROM menu_items WHERE name = 'Oatmeal Cookies';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Single', 0, now() FROM menu_items WHERE name = 'Sugar Cookies';

INSERT INTO variations (menu_item_id, name, price, created_at) 
SELECT id, 'Pack of 6', 200, now() FROM menu_items WHERE name = 'Sugar Cookies';

-- Add some add-ons for coffee drinks
INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Extra Shot', 30, 'coffee', now() FROM menu_items WHERE name = 'Espresso';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Extra Shot', 30, 'coffee', now() FROM menu_items WHERE name = 'Americano';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Extra Shot', 30, 'coffee', now() FROM menu_items WHERE name = 'Cappuccino';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Extra Shot', 30, 'coffee', now() FROM menu_items WHERE name = 'French Vanilla';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Extra Shot', 30, 'coffee', now() FROM menu_items WHERE name = 'Caramel Macchiato';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Oatmilk', 20, 'milk', now() FROM menu_items WHERE name = 'Cappuccino';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Oatmilk', 20, 'milk', now() FROM menu_items WHERE name = 'French Vanilla';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Oatmilk', 20, 'milk', now() FROM menu_items WHERE name = 'Caramel Macchiato';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Vanilla Syrup', 15, 'flavor', now() FROM menu_items WHERE name = 'Cappuccino';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Caramel Syrup', 15, 'flavor', now() FROM menu_items WHERE name = 'Cappuccino';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Hazelnut Syrup', 15, 'flavor', now() FROM menu_items WHERE name = 'Cappuccino';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Extra Caramel', 10, 'topping', now() FROM menu_items WHERE name = 'Caramel Macchiato';

INSERT INTO add_ons (menu_item_id, name, price, category, created_at) 
SELECT id, 'Whipped Cream', 10, 'topping', now() FROM menu_items WHERE name = 'Caramel Macchiato';
