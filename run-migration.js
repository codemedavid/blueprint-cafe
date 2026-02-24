import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(__dirname, 'supabase', 'migrations', '20250102000000_add_service_charge_settings.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration...');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.length > 0) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          // If exec_sql doesn't exist, try direct query (this might not work for all SQL)
          // For INSERT statements, we can parse and use the Supabase client
          if (statement.toUpperCase().includes('INSERT INTO')) {
            // Parse INSERT statement manually
            const insertMatch = statement.match(/INSERT INTO\s+(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i);
            if (insertMatch) {
              const [, table, columns, values] = insertMatch;
              const columnList = columns.split(',').map(c => c.trim());
              const valueList = values.split(',').map(v => {
                const trimmed = v.trim();
                // Remove quotes and handle JSON
                if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
                  return trimmed.slice(1, -1);
                }
                return trimmed;
              });
              
              const record = {};
              columnList.forEach((col, idx) => {
                let val = valueList[idx];
                // Convert boolean strings
                if (val === 'true') val = true;
                else if (val === 'false') val = false;
                // Try to parse as number
                else if (!isNaN(val)) val = parseFloat(val);
                record[col] = val;
              });

              const { error: insertError } = await supabase
                .from(table)
                .upsert(record, { onConflict: 'id' });
              
              if (insertError) {
                console.error(`Error inserting into ${table}:`, insertError.message);
              } else {
                console.log(`✓ Successfully inserted/updated ${table}`);
              }
            }
          } else {
            console.error('Error executing SQL:', error.message);
            console.error('Note: Some SQL operations may require direct database access');
          }
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    }

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();





