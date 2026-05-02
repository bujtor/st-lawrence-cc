import { supabase } from './supabase'

export type RecentFormEntry = {
  id: number
  result_text: string | null
  opponent: string
  match_date: string
  home_away: string
}

/**
 * Last N completed fixtures with a result, ordered most-recent first.
 * Used for the WWLLW "recent form" strip on the home page and fixtures page.
 */
export async function fetchRecentForm(limit = 5): Promise<RecentFormEntry[]> {
  const { data } = await supabase
    .from('fixtures')
    .select('id, result_text, opponent, match_date, home_away')
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })
    .limit(limit)
  return (data ?? []) as RecentFormEntry[]
}

/** Reduce a result_text to its single-letter form code. */
export function formLetter(result: string | null): 'W' | 'L' | 'T' | 'D' | 'A' | '?' {
  if (result === 'Won') return 'W'
  if (result === 'Lost') return 'L'
  if (result === 'Tied') return 'T'
  if (result === 'Drew') return 'D'
  if (result === 'Abandoned') return 'A'
  return '?'
}
