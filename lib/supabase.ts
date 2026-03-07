import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!_supabase) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!url || !key) {
        throw new Error('Supabase URL and Anon Key must be set in environment variables')
      }
      _supabase = createClient(url, key)
    }
    return (_supabase as unknown as Record<string, unknown>)[prop as string]
  },
})

export type Player = {
  id: number
  name: string
  role: 'BAT' | 'BOWL' | 'AR' | 'WK'
  is_ringin: boolean
  is_active: boolean
  created_at: string
}

export type Fixture = {
  id: number
  play_cricket_match_id: number | null
  match_date: string
  start_time: string | null
  meet_time: string | null
  opponent: string
  venue: string
  home_away: 'H' | 'A'
  competition: string | null
  season: number
  result_text: string | null
  lat: number | null
  lng: number | null
  last_synced: string | null
}

export type Availability = {
  player_id: number
  fixture_id: number
  status: 'available' | 'unavailable' | 'tentative'
  notes: string | null
  updated_at: string
}
