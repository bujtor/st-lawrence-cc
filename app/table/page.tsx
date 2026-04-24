import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SEASONS = [2023, 2024, 2025, 2026]
const OUR_CLUB_ID = '9754'

type Standing = {
  team_id: string
  team_name: string
  club_id: string | null
  club_name: string | null
  played: number
  won: number
  lost: number
  tied: number
  drew: number
  abandoned: number
  cancelled: number
  bonus_batting: number
  bonus_bowling: number
  penalty_points: number
  points: number
}

function fmtPts(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '0'
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

export default async function TablePage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const sp = await searchParams
  const season = parseInt(sp.season ?? String(new Date().getFullYear()), 10)

  const { data: standingsRaw } = await supabase
    .from('league_standings')
    .select(
      'team_id, team_name, club_id, club_name, played, won, lost, tied, drew, abandoned, cancelled, bonus_batting, bonus_bowling, penalty_points, points'
    )
    .eq('season', season)
    .order('points', { ascending: false })
    .order('won', { ascending: false })

  const standings: Standing[] = (standingsRaw ?? []) as Standing[]
  const isEmpty = standings.length === 0

  const { data: oneMatch } = await supabase
    .from('match_scorecards')
    .select('competition_name')
    .eq('season', season)
    .not('competition_name', 'is', null)
    .limit(1)
  const divisionName = oneMatch?.[0]?.competition_name ?? null

  const anyPenalties = standings.some((t) => t.penalty_points > 0)
  const anyCancelled = standings.some((t) => t.cancelled > 0)

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header + season selector */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">League Table</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {divisionName ?? 'Kent County Village League'} &middot; {season} Season
          </p>
        </div>
        <div className="flex gap-1.5">
          {SEASONS.map((s) => (
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
          <p className="text-lg font-medium">No standings yet for {season}.</p>
          <p className="text-sm mt-1">The table populates as matches are played and synced.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2 text-left w-6">#</th>
                  <th className="px-3 py-2 text-left">Team</th>
                  <th className="px-2 py-2 text-right" title="Played">P</th>
                  <th className="px-2 py-2 text-right" title="Won">W</th>
                  <th className="px-2 py-2 text-right" title="Lost">L</th>
                  <th className="px-2 py-2 text-right hidden sm:table-cell" title="Tied">T</th>
                  <th className="px-2 py-2 text-right hidden md:table-cell" title="Abandoned (weather etc)">A</th>
                  {anyCancelled && (
                    <th className="px-2 py-2 text-right hidden md:table-cell" title="Cancelled">C</th>
                  )}
                  <th className="px-2 py-2 text-right hidden lg:table-cell" title="Game points: Win (20), Tied (16), Abandoned/Cancelled (8)">Game</th>
                  <th className="px-2 py-2 text-right hidden md:table-cell" title="Batting bonus points">Bat</th>
                  <th className="px-2 py-2 text-right hidden md:table-cell" title="Bowling bonus points">Bowl</th>
                  {anyPenalties && (
                    <th className="px-2 py-2 text-right hidden md:table-cell" title="Penalty points">Pen</th>
                  )}
                  <th className="px-3 py-2 text-right font-bold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {standings.map((t, i) => {
                  const pos = i + 1
                  const total = standings.length
                  const isPromotion = pos <= 2
                  const isRelegation = pos >= total - 1
                  const isOurs = t.club_id === OUR_CLUB_ID
                  const fullName =
                    t.club_name && t.team_name ? `${t.club_name} - ${t.team_name}` : (t.team_name || t.club_name || '?')
                  const gamePts = t.points - t.bonus_batting - t.bonus_bowling + t.penalty_points

                  // Zone colouring applies when not our row. Our row keeps the emerald identity;
                  // we still mark the zone via the position cell.
                  const rowClass = isOurs
                    ? 'bg-emerald-50 border-l-4 border-emerald-500'
                    : isPromotion
                      ? 'bg-emerald-50/40 border-l-4 border-emerald-300 hover:bg-emerald-50'
                      : isRelegation
                        ? 'bg-rose-50/40 border-l-4 border-rose-300 hover:bg-rose-50'
                        : 'hover:bg-gray-50'

                  return (
                    <tr key={t.team_id} className={`transition-colors ${rowClass}`}>
                      <td className="px-3 py-2.5 text-xs">
                        <span className={`inline-flex items-center gap-1 ${
                          isPromotion ? 'text-emerald-700 font-semibold' : isRelegation ? 'text-rose-700 font-semibold' : 'text-gray-400'
                        }`}>
                          {isPromotion && <span aria-hidden>▲</span>}
                          {isRelegation && <span aria-hidden>▼</span>}
                          {pos}
                        </span>
                      </td>
                      <td className={`px-3 py-2.5 font-semibold ${isOurs ? 'text-emerald-800' : 'text-gray-800'}`}>
                        {fullName}
                      </td>
                      <td className="px-2 py-2.5 text-right text-gray-600">{t.played}</td>
                      <td className="px-2 py-2.5 text-right text-gray-700 font-medium">{t.won}</td>
                      <td className="px-2 py-2.5 text-right text-gray-600">{t.lost}</td>
                      <td className="px-2 py-2.5 text-right text-gray-600 hidden sm:table-cell">{t.tied}</td>
                      <td className="px-2 py-2.5 text-right text-gray-500 hidden md:table-cell">{t.abandoned}</td>
                      {anyCancelled && (
                        <td className="px-2 py-2.5 text-right text-gray-500 hidden md:table-cell">{t.cancelled}</td>
                      )}
                      <td className="px-2 py-2.5 text-right text-gray-700 font-mono hidden lg:table-cell">
                        {fmtPts(gamePts)}
                      </td>
                      <td className="px-2 py-2.5 text-right text-gray-600 font-mono hidden md:table-cell">
                        {fmtPts(t.bonus_batting)}
                      </td>
                      <td className="px-2 py-2.5 text-right text-gray-600 font-mono hidden md:table-cell">
                        {fmtPts(t.bonus_bowling)}
                      </td>
                      {anyPenalties && (
                        <td className="px-2 py-2.5 text-right text-rose-600 font-mono hidden md:table-cell">
                          {t.penalty_points > 0 ? `-${fmtPts(t.penalty_points)}` : '—'}
                        </td>
                      )}
                      <td className={`px-3 py-2.5 text-right font-bold ${isOurs ? 'text-emerald-700' : 'text-gray-900'}`}>
                        {fmtPts(t.points)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Zone legend */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 mb-4 px-1">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-emerald-300/50 border border-emerald-400" />
              <span className="text-emerald-700 font-semibold">▲</span>
              Top 2 &mdash; Promotion
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-rose-300/50 border border-rose-400" />
              <span className="text-rose-700 font-semibold">▼</span>
              Bottom 2 &mdash; Relegation
            </span>
          </div>

          {/* Scoring key */}
          <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-xs text-gray-500 leading-relaxed">
            <div className="font-semibold text-gray-600 uppercase tracking-wider text-[10px] mb-2">How points work</div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-1">
              <div>Win <span className="font-mono text-gray-700 font-semibold">20</span></div>
              <div>Lost <span className="font-mono text-gray-700 font-semibold">0</span></div>
              <div>Tied <span className="font-mono text-gray-700 font-semibold">16</span></div>
              <div>Abandoned <span className="font-mono text-gray-700 font-semibold">8</span></div>
              <div>Cancelled <span className="font-mono text-gray-700 font-semibold">8</span></div>
              <div>Opp. conceded <span className="font-mono text-gray-700 font-semibold">20</span></div>
              <div>Team conceded <span className="font-mono text-gray-700 font-semibold">0</span></div>
              <div>+ Batting bonus</div>
              <div>+ Bowling bonus</div>
              <div>− Penalties</div>
            </div>
            <div className="mt-2 text-gray-400">
              <span className="font-semibold">Game</span> column = Win/Tied/Abandoned/Cancelled points combined.
              Resize or rotate on a wider screen to see all columns.
            </div>
          </div>
        </>
      )}
    </div>
  )
}
