import { createClient } from '@supabase/supabase-js'

// Varre todas as possibilidades de variáveis para nunca dar undefined
const supabaseUrl = 
  import.meta.env?.VITE_SUPABASE_URL || 
  process.env?.NEXT_PUBLIC_SUPABASE_URL || 
  process.env?.VITE_SUPABASE_URL ||
  "https://xdybbsfyggzzjkfcpcoe.supabase.co"; // URL fallback garantida

const supabaseAnonKey = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env?.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_1hCxBjfenQ8KUML5m-QpLg_Ok2tNX8Y"; // Key fallback garantida

export const supabase = createClient(supabaseUrl, supabaseAnonKey)