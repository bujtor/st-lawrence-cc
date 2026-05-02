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
 * Used for the overall "recent form" strip on the home page and fixtures page.
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

/**
 * Build a per-opponent map of the last N completed results vs each club.
 * Returned record is keyed by opponent club name (matching fixtures.opponent).
 * Used for per-row form chips on the upcoming-matches list.
 */
export async function fetchFormByOpponent(perOpponent = 5): Promise<Record<string, RecentFormEntry[]>> {
  const { data } = await supabase
    .from('fixtures')
    .select('id, result_text, opponent, match_date, home_away')
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })
    .limit(5000)

  const out: Record<string, RecentFormEntry[]> = {}
  for (const f of (data ?? []) as RecentFormEntry[]) {
    if (!out[f.opponent]) out[f.opponent] = []
    if (out[f.opponent].length < perOpponent) out[f.opponent].push(f)
  }
  return out
}

/**
 * Reduce a result_text to its single-letter form code.
 * Handles Play-Cricket's "{Team} - Conceded" descriptions: if SLCC conceded,
 * we lost (L); if the OPPONENT conceded, we won (W).
 */
export function formLetter(result: string | null): 'W' | 'L' | 'T' | 'D' | 'A' | 'C' | '?' {
  if (!result) return '?'
  if (result === 'Won') return 'W'
  if (result === 'Lost') return 'L'
  if (result === 'Tied') return 'T'
  if (result === 'Drew') return 'D'
  if (result === 'Abandoned') return 'A'
  if (result === 'Cancelled') return 'C'
  if (result.includes('Conceded')) {
    return result.startsWith('St Lawrence CC') ? 'L' : 'W'
  }
  return '?'
}
