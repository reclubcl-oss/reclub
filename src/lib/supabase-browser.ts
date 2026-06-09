import { createClient } from '@supabase/supabase-js';

// Browser-safe: anon key, used only for business dashboard auth.
export const supabase = createClient(
  import.meta.env.PUBLIC_SUPABASE_URL?.trim(),
  import.meta.env.PUBLIC_SUPABASE_ANON_KEY?.trim(),
);
