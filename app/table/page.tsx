import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SEASONS = [2023, 2024, 2025, 2026]

export default async function TablePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const sp = await searchParams
  const season = parseInt(sp.season ?? String(new Date().getFullYear()), 10)

  // Fetch league_points for this season, with scorecard info for W/L/T/D
  const { data: pointsRows } = await supabase
    .from('league_points')
    .select('match_id, team_id, team_name, game_points, bonus_batting, bonus_bowling, bonus_together, penalty_points')
    .in(
      'match_id',
      (
        await supabase
          .from('match_scorecards')
          .select('match_id')
          .eq('season', season)
      ).data?.map(r => r.match_id) ?? []
    )

  // Also get scorecards to know W/L/T/D/A per match per team
  const { data: scorecards } = await supabase
    .from('match_scorecards')
    .select('match_id, result, result_applied_to, home_team_id, away_team_id, our_team_id')
    .eq('season', season)

  // Map: match_id -> result info
  const resultByMatch = new Map<number, { result: string; result_applied_to: string; home_team_id: string; away_team_id: string; our_team_id: string }>()
  for (const sc of scorecards ?? []) {
    resultByMatch.set(sc.match_id, {
      result: sc.result ?? '',
      result_applied_to: sc.result_applied_to ?? '',
      home_team_id: sc.home_team_id ?? '',
      away_team_id: sc.away_team_id ?? '',
      our_team_id: sc.our_team_id ?? '',
    })
  }

  type TeamRow = {
    team_id: string
    team_name: string
    isOurs: boolean
    p: number
    w: number
    l: number
    t: number
    pts: number
  }

  const teamMap = new Map<string, TeamRow>()

  for (const pt of pointsRows ?? []) {
    const tid = String(pt.team_id)
    if (!teamMap.has(tid)) {
      // Determine if this is our team by checking scorecards
      const sc = resultByMatch.get(pt.match_id)
      const isOurs = sc ? (sc.our_team_id === tid) : false
      // Also check if tid matches home/away for our club
      // Use the match_scorecards.our_team_id for current match
      teamMap.set(tid, {
        team_id: tid,
        team_name: pt.team_name ?? tid,
        isOurs,
        p: 0,
        w: 0,
        l: 0,
        t: 0,
        pts: 0,
      })
    }

    const row = teamMap.get(tid)!
    // Keep most recent team name
    if (pt.team_name) row.team_name = pt.team_name

    const sc = resultByMatch.get(pt.match_id)
    if (sc) {
      // Mark ours if any match shows it
      if (sc.our_team_id === tid) row.isOurs = true

      row.p++
      const res = sc.result ?? ''
      if (res === 'W') {
        if (sc.result_applied_to === tid) row.w++
        else row.l++
      } else if (res === 'T') {
        row.t++
      } else if (res === 'D') {
        // draw: not W or L for points purposes
      }
      // A (abandoned) also doesn't count
    }

    const gp = pt.game_points ?? 0
    const bb = pt.bonus_batting ?? 0
    const bw = pt.bonus_bowling ?? 0
    const bt = pt.bonus_together ?? 0
    const pen = pt.penalty_points ?? 0
    row.pts += gp + bb + bw + bt - pen
  }

  const teams = Array.from(teamMap.values()).sort((a, b) => b.pts - a.pts)
  const isEmpty = teams.length === 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header + season selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">League Table</h1>
          <p className="text-sm text-gray-400 mt-0.5">{season} Season</p>
        </div>
        <div className="flex gap-1.5">
          {SEASONS.map(s => (
            <Link
              key={s}
              href={`/table?season=${s}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors no-underline ${
                s === season
                  ? 'bg-emerald-700 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
      </div>

      {isEmpty ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No table data for {season} yet.</p>
          <p className="text-sm mt-1">Points populate automatically once matches are synced.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2 text-left w-6">#</th>
                  <th className="px-3 py-2 text-left">Team</th>
                  <th className="px-3 py-2 text-right">P</th>
                  <th className="px-3 py-2 text-right">W</th>
                  <th className="px-3 py-2 text-right">L</th>
                  <th className="px-3 py-2 text-right">T</th>
                  <th className="px-3 py-2 text-right font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teams.map((t, i) => (
                  <tr
                    key={t.team_id}
                    className={`transition-colors ${
                      t.isOurs
                        ? 'bg-emerald-50 border-l-4 border-emerald-500'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className={`px-3 py-2.5 font-semibold ${t.isOurs ? 'text-emerald-800' : 'text-gray-800'}`}>
                      {t.team_name}
                      {t.isOurs && <span className="ml-2 text-[10px] text-emerald-600 font-medium">(us)</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{t.p}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{t.w}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{t.l}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">{t.t}</td>
                    <td className={`px-3 py-2.5 text-right font-bold ${t.isOurs ? 'text-emerald-700' : 'text-gray-900'}`}>
                      {t.pts.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-center">
            Our division this season — based on matches played. Includes only teams St Lawrence CC has played against.
          </p>
        </>
      )}
    </div>
  )
}
