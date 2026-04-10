import { createClient } from '@supabase/supabase-js';

// Server-only: service role bypasses RLS. Never import this in client-side code.
export const supabaseAdmin = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL,
  import.meta.env.SUPABASE_SERVICE_KEY,
);
