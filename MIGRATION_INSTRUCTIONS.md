# Running the Service Charge Migration

Since you don't have direct access to your Supabase account, you can run the migration using the provided script.

## Option 1: Using Environment Variables (Recommended)

1. Create a `.env` file in the project root with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

2. Run the migration:
   ```bash
   npm run migrate:service-charge
   ```
   or
   ```bash
   node run-migration-simple.js
   ```

## Option 2: Inline Environment Variables

Run the script with environment variables inline:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co VITE_SUPABASE_ANON_KEY=your-key node run-migration-simple.js
```

## Option 3: Find Your Credentials

If you don't remember your Supabase credentials:

1. Check if you have them saved in:
   - Your deployment platform (Vercel, Netlify, etc.)
   - Your `.env.local` or `.env.production` files
   - Your browser's developer tools (Network tab when the app loads)

2. If you can access your Supabase dashboard:
   - Go to Project Settings → API
   - Copy the Project URL and anon/public key

## What the Migration Does

The migration adds three new settings to your `site_settings` table:
- `service_charge_enabled` (default: false)
- `service_charge_percentage` (default: 7.5)
- `service_charge_applicable_to` (default: ["dine-in", "delivery"])

These can be configured later in the Admin Dashboard under Site Settings.

