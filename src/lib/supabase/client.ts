import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseDatabase } from "@/types/database";

export function createBrowserSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Thiếu cấu hình Supabase public cho browser client.");
  }

  return createBrowserClient<SupabaseDatabase>(supabaseUrl, supabaseAnonKey);
}
