import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ScorecardTabs, { type InningsView, type ScBat, type ScBowl } from '@/components/ScorecardTabs'

export const dynamic = 'force-dynamic'

const OUR_CLUB_ID = '9754'

function fmtFullDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

export default async function ScorecardPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const fixtureId = parseInt(id, 10)
  if (isNaN(fixtureId)) notFound()

  const { data: fixture } = await supabase
    .from('fixtures')
    .select('*')
    .eq('id', fixtureId)
    .single()
  if (!fixture) notFound()

  const pcMatchId = fixture.play_cricket_match_id
  const { data: scorecard } = pcMatchId
    ? await supabase
        .from('match_scorecards')
        .select('*')
        .eq('match_id', pcMatchId)
        .single()
    : { data: null }

  // Pull batting + bowling entries for the match. Sort within each team by batting position.
  const { data: battingRaw } = pcMatchId
    ? await supabase
        .from('batting_entries')
        .select('team_batting_id, innings_number, position, batsman_name, batsman_id, how_out, fielder_name, bowler_name, runs, fours, sixes, balls')
        .eq('match_id', pcMatchId)
        .order('team_batting_id', { ascending: true })
        .order('innings_number', { ascending: true })
        .order('position', { ascending: true, nullsFirst: false })
    : { data: [] }

  const { data: bowlingRaw } = pcMatchId
    ? await supabase
        .from('bowling_entries')
        .select('team_bowling_id, innings_number, bowler_name, bowler_id, overs, maidens, runs, wickets')
        .eq('match_id', pcMatchId)
        .order('team_bowling_id', { ascending: true })
        .order('innings_number', { ascending: true })
    : { data: [] }

  // Group batting by team_batting_id (each team = one innings in a normal 40-over match)
  const batByTeam = new Map<string, ScBat[]>()
  for (const b of battingRaw ?? []) {
    const key = b.team_batting_id ?? ''
    if (!key) continue
    const arr = batByTeam.get(key) ?? []
    arr.push({
      position: b.position,
      batsman_name: b.batsman_name,
      batsman_id: b.batsman_id,
      how_out: b.how_out,
      fielder_name: b.fielder_name,
      bowler_name: b.bowler_name,
      runs: b.runs,
      fours: b.fours,
      sixes: b.sixes,
      balls: b.balls,
    })
    batByTeam.set(key, arr)
  }

  // Group bowling by team_bowling_id (the team bowling TO the batting side)
  const bowlByTeam = new Map<string, ScBowl[]>()
  for (const b of bowlingRaw ?? []) {
    const key = b.team_bowling_id ?? ''
    if (!key) continue
    const arr = bowlByTeam.get(key) ?? []
    arr.push({
      bowler_name: b.bowler_name,
      bowler_id: b.bowler_id,
      overs: b.overs,
      maidens: b.maidens,
      runs: b.runs,
      wickets: b.wickets,
    })
    bowlByTeam.set(key, arr)
  }

  // Build ordered list of innings views. Prefer whoever batted first.
  type TeamMeta = { id: string; clubName: string; teamName: string; fullName: string }
  const teams: TeamMeta[] = []
  if (scorecard?.home_team_id) {
    teams.push({
      id: scorecard.home_team_id,
      clubName: scorecard.home_club_name ?? 'Home',
      teamName: scorecard.home_team_name ?? '',
      fullName: fullName(scorecard.home_club_name, scorecard.home_team_name, 'Home'),
    })
  }
  if (scorecard?.away_team_id) {
    teams.push({
      id: scorecard.away_team_id,
      clubName: scorecard.away_club_name ?? 'Away',
      teamName: scorecard.away_team_name ?? '',
      fullName: fullName(scorecard.away_club_name, scorecard.away_team_name, 'Away'),
    })
  }

  // Which team batted first → that innings shown first
  const battedFirstId = scorecard?.batted_first_team_id ?? null
  const orderedTeams = [...teams].sort((a, b) => {
    if (battedFirstId && a.id === battedFirstId) return -1
    if (battedFirstId && b.id === battedFirstId) return 1
    return 0
  })

  const views: InningsView[] = orderedTeams.map((battingTeam) => {
    const other = teams.find((t) => t.id !== battingTeam.id)
    const batRows = batByTeam.get(battingTeam.id) ?? []
    const bowlRows = other ? bowlByTeam.get(other.id) ?? [] : []

    // Use authoritative totals from scorecard when the team is ours/opp, else derive
    const isOurs = scorecard?.our_team_id === battingTeam.id
    const totalRuns = isOurs
      ? scorecard?.our_runs ?? sumRuns(batRows)
      : scorecard?.opp_runs ?? sumRuns(batRows)
    const totalWickets = isOurs
      ? scorecard?.our_wickets ?? countDismissals(batRows)
      : scorecard?.opp_wickets ?? countDismissals(batRows)
    const totalOvers = isOurs
      ? (scorecard?.our_overs ?? null)
      : (scorecard?.opp_overs ?? null)

    // "SLCC batting" / "Chiddingstone batting" — keep short for the tab
    const tabLabel = `${battingTeam.clubName} batting`

    return {
      key: battingTeam.id,
      battingTeam: battingTeam.fullName,
      bowlingTeam: other?.fullName ?? 'Bowling',
      shortTab: tabLabel,
      totalRuns,
      totalWickets,
      totalOvers,
      batting: batRows,
      bowling: bowlRows,
    }
  })

  const weWon = fixture.result_text === 'Won'
  const weLost = fixture.result_text === 'Lost'

  const resultBadgeClass = weWon
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : weLost
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : 'bg-gray-50 text-gray-600 border-gray-200'

  // Tab-default: show OUR batting first on past matches (most relevant to visitors of this site)
  const ourBatIdx = views.findIndex((v) => v.key === scorecard?.our_team_id)
  const defaultIdx = ourBatIdx >= 0 ? ourBatIdx : 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-4">
        <Link href={`/fixtures?season=${fixture.season}`} className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold no-underline">
          ← Back to {fixture.season} fixtures
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
            {fmtFullDate(fixture.match_date)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">vs {fixture.opponent}</h1>
          <div className="text-sm text-gray-500 mt-0.5">{fixture.venue}</div>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                fixture.home_away === 'H'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}
            >
              {fixture.home_away === 'H' ? 'Home' : 'Away'}
            </span>
            {fixture.competition && <span className="text-xs text-gray-400">{fixture.competition}</span>}
          </div>
        </div>
        {fixture.result_text && (
          <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${resultBadgeClass}`}>
            {fixture.result_text}
          </div>
        )}
      </div>

      {/* Toss / format */}
      {scorecard && (scorecard.toss_won_by_team_id || scorecard.batted_first_team_id) && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-6 text-sm text-gray-600">
          {scorecard.toss_won_by_team_id && (
            <div>
              <span className="font-semibold text-gray-700">
                {teams.find((t) => t.id === scorecard.toss_won_by_team_id)?.fullName ?? 'Unknown'}
              </span>{' '}
              won the toss.
            </div>
          )}
          {scorecard.batted_first_team_id && (
            <div className="text-xs text-gray-400 mt-0.5">
              <span className="font-medium">
                {teams.find((t) => t.id === scorecard.batted_first_team_id)?.fullName ?? 'Unknown'}
              </span>{' '}
              batted first.
            </div>
          )}
          {scorecard.no_of_overs && (
            <div className="text-xs text-gray-400 mt-0.5">{scorecard.no_of_overs} overs per side.</div>
          )}
        </div>
      )}

      {/* Innings tabs + cards */}
      {views.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No scorecard data available yet.</p>
          <p className="text-sm mt-1">Scorecards sync within a day or two of the match.</p>
          {pcMatchId && (
            <a
              href={`https://stlawrence.play-cricket.com/website/results/${pcMatchId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-4 text-xs text-emerald-700 hover:text-emerald-800 font-semibold no-underline"
            >
              View on Play-Cricket →
            </a>
          )}
        </div>
      ) : (
        <ScorecardTabs views={views} defaultIndex={defaultIdx} />
      )}

      {pcMatchId && views.length > 0 && (
        <div className="text-center mt-8 pt-6 border-t border-gray-100">
          <a
            href={`https://stlawrence.play-cricket.com/website/results/${pcMatchId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-emerald-700 font-semibold no-underline"
          >
            View on Play-Cricket →
          </a>
        </div>
      )}
    </div>
  )
}

function fullName(club: string | null | undefined, team: string | null | undefined, fallback: string) {
  if (club && team) return `${club} - ${team}`
  return team || club || fallback
}

function sumRuns(rows: ScBat[]): number {
  return rows.reduce((s, r) => s + (r.runs ?? 0), 0)
}

function countDismissals(rows: ScBat[]): number {
  return rows.filter((r) => {
    const h = (r.how_out ?? '').toLowerCase()
    return h && h !== 'not out' && h !== 'did not bat'
  }).length
}
