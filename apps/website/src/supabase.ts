import { createClient } from "@supabase/supabase-js";

// Vite requires the VITE_ prefix for env variables exposed to the client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabasePublicKey);
