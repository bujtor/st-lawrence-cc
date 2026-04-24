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
  last_updated: string // DD/MM/YYYY from result_summary
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

// Coerce Play-Cricket string numbers to int or null
export function toIntOrNull(s: string | null | undefined): number | null {
  if (s == null || s === '') return null
  const n = parseInt(s, 10)
  return Number.isFinite(n) ? n : null
}

// Coerce Play-Cricket string numbers to float or null
export function toNumOrNull(s: string | null | undefined): number | null {
  if (s == null || s === '') return null
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : null
}

// Cricket overs are base-6. "4.3" means 4 overs + 3 balls = 4.5 true overs.
// Parse as (overs, balls) then convert to decimal overs.
// "4" → 4.0; "4.3" → 4.5; "10.5" → 10.833...
export function parsePCOvers(s: string | null | undefined): number | null {
  if (s == null || s === '') return null
  const parts = s.split('.')
  const overs = parseInt(parts[0], 10)
  if (!Number.isFinite(overs)) return null
  const balls = parts[1] ? parseInt(parts[1], 10) : 0
  if (!Number.isFinite(balls) || balls < 0 || balls > 5) return overs
  return overs + balls / 6
}

// Format decimal overs back to cricket notation. 4.5 → "4.3"; 4.0 → "4.0"; 10.833... → "10.5"
export function formatOvers(decimalOvers: number | null | undefined): string {
  if (decimalOvers == null || !Number.isFinite(decimalOvers)) return '−'
  const wholeOvers = Math.floor(decimalOvers)
  const ballsPart = Math.round((decimalOvers - wholeOvers) * 6)
  if (ballsPart === 6) return `${wholeOvers + 1}.0`
  return `${wholeOvers}.${ballsPart}`
}

export type PCBat = {
  position: string
  batsman_name: string
  batsman_id: string
  how_out: string
  fielder_name: string
  fielder_id: string
  bowler_name: string
  bowler_id: string
  runs: string
  fours: string
  sixes: string
  balls: string
}

export type PCBowl = {
  bowler_name: string
  bowler_id: string
  overs: string
  maidens: string
  runs: string
  wides: string
  wickets: string
  no_balls: string
}

export type PCInnings = {
  team_batting_name: string
  team_batting_id: string
  innings_number: number
  extra_byes: string
  extra_leg_byes: string
  extra_wides: string
  extra_no_balls: string
  total_extras: string
  runs: string
  wickets: string
  overs: string
  bat: PCBat[]
  bowl: PCBowl[]
}

export type PCMatchPlayer = {
  position: number
  player_name: string
  player_id: number
  captain: boolean
  wicket_keeper: boolean
}

export type PCPoints = {
  team_id: number | string
  game_points: string
  penalty_points: string
  bonus_points_together: string
  bonus_points_batting: string
  bonus_points_bowling: string
}

export type PCMatchDetail = PCMatch & {
  result: string
  result_description: string
  result_applied_to: string
  toss: string
  toss_won_by_team_id: string
  batted_first: string
  no_of_overs: string
  no_of_innings: string
  last_updated: string
  points: PCPoints[]
  players: [{ home_team: PCMatchPlayer[] }, { away_team: PCMatchPlayer[] }]
  innings: PCInnings[]
}

export async function fetchMatchDetail(matchId: number): Promise<PCMatchDetail | null> {
  const { token } = requireEnv()
  const url = `${BASE}/match_detail.json?match_id=${matchId}&api_token=${token}`
  const json = await fetchJson<{ match_details: PCMatchDetail[] }>(url)
  if (!json.match_details || json.match_details.length === 0) return null
  return json.match_details[0]
}
