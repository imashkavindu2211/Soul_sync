import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPlaceholder = !url || !key || 
    url.includes('your-project') || 
    url.includes('placeholder.supabase.co')

  if (isPlaceholder) {
    if (typeof window !== 'undefined') {
      console.warn(
        '%cSupabase Config Error: %cPlease set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.',
        'color: #ff4d4f; font-weight: bold;',
        'color: inherit;'
      )
    }
  }

  return createBrowserClient(
    url || 'https://placeholder.supabase.co',
    key || 'placeholder-key'
  )
}
