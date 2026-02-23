import { app, auth, db, storage, isSupabaseReady } from "@/lib/supabaseWrapper";

// Dummy analytics since Supabase doesn't have a direct equivalent in the basic setup
export const analytics = undefined;

export { app, auth, db, storage, isSupabaseReady };
