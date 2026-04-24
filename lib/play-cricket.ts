const BASE = 'https://play-cricket.com/api/v2'

export type PCPlayer = {
  member_id: number
  name: string
}

export type PCMatch = {
  id: number
  status: string
  published: string
  match_date: string // DD/MM/YYYY
  match_time: string // HH:MM
  league_name: string
  competition_name: string
  competition_type: string
  match_type: string
  season: string
  ground_name: string
  ground_id: string
  ground_latitude: string
  ground_longitude: string
  home_club_id: string
  home_club_name: string
  home_team_id: string
  home_team_name: string
  away_club_id: string
  away_club_name: string
  away_team_id: string
  away_team_name: string
}

export type PCResult = PCMatch & {
  result: string // 'W' | 'L' | 'D' | 'T'
  result_description: string
  result_applied_to: string // team_id
  toss: string
}

function requireEnv(): { token: string; siteId: string } {
  const token = process.env.PLAY_CRICKET_API_TOKEN
  const siteId = process.env.PLAY_CRICKET_SITE_ID
  if (!token) throw new Error('PLAY_CRICKET_API_TOKEN not set')
  if (!siteId) throw new Error('PLAY_CRICKET_SITE_ID not set')
  return { token, siteId }
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Play-Cricket ${res.status} ${res.statusText} for ${url.replace(/api_token=[^&]+/, 'api_token=***')}`)
  }
  return res.json() as Promise<T>
}

export async function fetchPlayers(): Promise<PCPlayer[]> {
  const { token, siteId } = requireEnv()
  const url = `${BASE}/sites/${siteId}/players.json?api_token=${token}`
  const json = await fetchJson<{ players: PCPlayer[] }>(url)
  return json.players ?? []
}

export async function fetchMatches(season: number): Promise<PCMatch[]> {
  const { token, siteId } = requireEnv()
  const url = `${BASE}/matches.json?site_id=${siteId}&season=${season}&api_token=${token}`
  const json = await fetchJson<{ matches: PCMatch[] }>(url)
  return json.matches ?? []
}

export async function fetchResults(season: number): Promise<PCResult[]> {
  const { token, siteId } = requireEnv()
  const url = `${BASE}/result_summary.json?site_id=${siteId}&season=${season}&api_token=${token}`
  const json = await fetchJson<{ result_summary: PCResult[] }>(url)
  return json.result_summary ?? []
}

// DD/MM/YYYY -> YYYY-MM-DD
export function parsePCDate(dmy: string): string {
  const [d, m, y] = dmy.split('/')
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}

// HH:MM -> HH:MM:00
export function parsePCTime(hm: string): string | null {
  if (!hm) return null
  const parts = hm.split(':')
  if (parts.length < 2) return null
  return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}:00`
}
