import { createClient } from "@supabase/supabase-js";

// Shared supabase-js client. Null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// aren't set, so the Supabase sign-in option is simply hidden.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;
