import { createClient } from '@supabase/supabase-js'

// Fallback placeholders allow `next build` to succeed locally.
// Real values must be set in Vercel environment settings.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
