// src/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

// --- IMPORTANT: CONFIGURE YOUR SUPABASE CREDENTIALS ---
// This app is configured to ONLY use environment variables from a .env file.
// Create a file named .env in your project root and add your Supabase credentials:
//
// VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE
// VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE
//
// The application will not start without these variables.
// ---

// @ts-ignore - Vite/Snowpack environments provide import.meta.env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// @ts-ignore
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  const errorElement = document.getElementById('root');
  if (errorElement) {
    errorElement.innerHTML = `
      <div style="font-family: sans-serif; padding: 2rem; background-color: #fff3f3; border: 2px solid #ffcccc; border-radius: 8px; margin: 2rem;">
        <h1 style="color: #d92626; font-size: 1.5rem;">Supabase Configuration Error</h1>
        <p style="font-size: 1rem; color: #333;">Supabase URL or Key is missing. The application cannot start.</p>
        <p style="font-size: 0.9rem; color: #555; margin-top: 1rem;">
          <strong>Action Required:</strong>
        </p>
        <ul style="font-size: 0.9rem; color: #555; list-style-type: disc; padding-left: 20px;">
          <li>Create a file named <code>.env</code> in the root directory of this project.</li>
          <li>Add your Supabase project credentials to the <code>.env</code> file as follows:</li>
          <li style="margin-top: 8px; background: #f1f5f9; padding: 8px; border-radius: 4px; font-family: monospace;">VITE_SUPABASE_URL=YOUR_SUPABASE_URL_HERE</li>
          <li style="margin-top: 4px; background: #f1f5f9; padding: 8px; border-radius: 4px; font-family: monospace;">VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY_HERE</li>
          <li>Replace the placeholder values with your actual credentials from your Supabase dashboard.</li>
        </ul>
        <p style="font-size: 0.8rem; color: #888; margin-top: 1rem;">This message is shown because the Supabase client could not be initialized from the .env file.</p>
      </div>
    `;
  }
  throw new Error("Supabase URL or Key is not configured. Please create and configure your .env file.");
}

console.info("Supabase client: Configured successfully using environment variables.");

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);