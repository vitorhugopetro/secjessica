"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/db";

export function createSupabaseClient() {
  return createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key"
  );
}
