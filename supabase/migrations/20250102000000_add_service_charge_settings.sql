/*
  # Add Service Charge Settings

  Adds service charge configuration to site_settings table:
    - service_charge_enabled (boolean) - whether service charge is enabled
    - service_charge_percentage (number) - the percentage to charge (e.g., 7.5)
    - service_charge_applicable_to (text/JSON) - array of service types it applies to
*/

-- Insert service charge settings into site_settings table
INSERT INTO site_settings (id, value, type, description) VALUES
  ('service_charge_enabled', 'false', 'boolean', 'Whether service charge is enabled'),
  ('service_charge_percentage', '7.5', 'number', 'Service charge percentage (e.g., 7.5 for 7.5%)'),
  ('service_charge_applicable_to', '["dine-in", "delivery"]', 'text', 'JSON array of service types: dine-in, pickup, delivery')
ON CONFLICT (id) DO NOTHING;

