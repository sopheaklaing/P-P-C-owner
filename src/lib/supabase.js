// import { createClient } from "@supabase/supabase-js";

// const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
// const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// if (!SUPABASE_URL || !SUPABASE_KEY) {
//   throw new Error("Missing Supabase environment variables. Please check your .env.local file.");
// }


// export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
//   auth: {
//     autoRefreshToken: true,
//     persistSession: true,
//     detectSessionInUrl: true,
//   },
// });
import { createClient } from "@supabase/supabase-js";

// Server-side safe key (do NOT prefix with NEXT_PUBLIC)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    "Supabase environment variables missing. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set."
  );
}

// Server-side Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false, // server doesn’t need auto refresh
    persistSession: false,   // server doesn’t persist sessions
  },
});
