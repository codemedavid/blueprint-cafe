import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

// Try to load .env file if it exists
let envVars = {};
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
  });
}

// Get environment variables from .env file or process.env
const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 
                    envVars.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase environment variables\n');
  console.error('Please provide your Supabase credentials in one of these ways:');
  console.error('\n1. Create a .env file with:');
  console.error('   VITE_SUPABASE_URL=your-project-url');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('\n2. Or set them as environment variables:');
  console.error('   export VITE_SUPABASE_URL=your-project-url');
  console.error('   export VITE_SUPABASE_ANON_KEY=your-anon-key');
  console.error('\n3. Or run with inline variables:');
  console.error('   VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... node run-migration-simple.js');
  console.error('\nYou can find these values in your Supabase project settings.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Running service charge migration...\n');

    // Service charge settings to insert
    const settings = [
      {
        id: 'service_charge_enabled',
        value: 'false',
        type: 'boolean',
        description: 'Whether service charge is enabled'
      },
      {
        id: 'service_charge_percentage',
        value: '7.5',
        type: 'number',
        description: 'Service charge percentage (e.g., 7.5 for 7.5%)'
      },
      {
        id: 'service_charge_applicable_to',
        value: '["dine-in", "delivery"]',
        type: 'text',
        description: 'JSON array of service types: dine-in, pickup, delivery'
      }
    ];

    console.log('Inserting service charge settings...');
    
    for (const setting of settings) {
      const { data, error } = await supabase
        .from('site_settings')
        .upsert(setting, { onConflict: 'id' });

      if (error) {
        console.error(`❌ Error inserting ${setting.id}:`, error.message);
      } else {
        console.log(`✓ ${setting.id} - ${setting.value}`);
      }
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('Service charge settings have been added to your database.');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. Your Supabase URL and key are correct');
    console.error('2. The site_settings table exists');
    console.error('3. You have the necessary permissions');
    process.exit(1);
  }
}

runMigration();

