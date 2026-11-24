import type { MetadataRoute } from 'next'
import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'

const BASE = 'https://stlawrencecc.co.uk'

// Cached like the archive pages: purged after each sync and captain edit
// (revalidatePath('/', 'layout')), with a daily refresh as a safety net.
export const revalidate = 86400

/** Supabase returns at most 1000 rows per request; page through the table. */
async function all<T>(table: string, columns: string): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + 999)
    if (error) throw new Error(`sitemap: ${table}: ${error.message}`)
    rows.push(...((data ?? []) as T[]))
    if (!data || data.length < 1000) return rows
  }
}

/**
 * Every public page, so crawlers can find the archive from one file instead of
 * following every season and fixture link. /availability (captains only) and
 * /api are excluded, matching robots.txt.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [fixtures, players, scorecards] = await Promise.all([
    all<{ id: number; opponent: string | null; play_cricket_match_id: number | null }>(
      'fixtures', 'id, opponent, play_cricket_match_id'),
    all<{ play_cricket_member_id: number | null }>('players', 'play_cricket_member_id'),
    all<{ match_id: number; synced_at: string | null }>('match_scorecards', 'match_id, synced_at'),
  ])

  const scorecardSynced = new Map(scorecards.map(s => [s.match_id, s.synced_at]))

  const staticPages: MetadataRoute.Sitemap = ['', '/fixtures', '/table', '/stats', '/clubs', '/about', '/contact']
    .map(p => ({ url: `${BASE}${p}` }))

  const fixturePages: MetadataRoute.Sitemap = fixtures.map(f => {
    const synced = f.play_cricket_match_id ? scorecardSynced.get(f.play_cricket_match_id) : null
    return { url: `${BASE}/fixtures/${f.id}`, ...(synced ? { lastModified: synced } : {}) }
  })

  const playerPages: MetadataRoute.Sitemap = [...new Set(
    players.map(p => p.play_cricket_member_id).filter((id): id is number => id != null),
  )].map(id => ({ url: `${BASE}/stats/${id}` }))

  const clubPages: MetadataRoute.Sitemap = [...new Set(
    fixtures.map(f => f.opponent?.trim()).filter((n): n is string => !!n).map(clubSlug).filter(Boolean),
  )].map(slug => ({ url: `${BASE}/clubs/${slug}` }))

  return [...staticPages, ...fixturePages, ...playerPages, ...clubPages]
}
