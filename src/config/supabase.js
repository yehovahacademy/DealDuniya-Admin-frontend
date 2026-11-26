import { createClient } from "@supabase/supabase-js";

// Shared supabase-js client. Null when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
// are unset or invalid, so the Supabase sign-in option is hidden instead of
// createClient throwing and blanking the whole app.
const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function makeClient() {
  if (!url || !anonKey) return null;
  try {
    return createClient(url, anonKey);
  } catch (error) {
    console.error(
      `Supabase sign-in disabled: VITE_SUPABASE_URL "${url}" is invalid. ` +
        "It must be the full project URL, e.g. https://<project-ref>.supabase.co",
      error
    );
    return null;
  }
}

export const supabase = makeClient();
