import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { formatOvers } from '@/lib/play-cricket'

export const dynamic = 'force-dynamic'

type Bat = {
  position: number | null
  batsman_name: string | null
  batsman_id: number | null
  how_out: string | null
  fielder_name: string | null
  bowler_name: string | null
  runs: number | null
  fours: number | null
  sixes: number | null
  balls: number | null
}

type Bowl = {
  bowler_name: string | null
  bowler_id: number | null
  overs: number | null
  maidens: number | null
  runs: number | null
  wickets: number | null
  wides: number | null
  no_balls: number | null
}

function fmtFullDate(d: string) {
  const dt = new Date(d + 'T00:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[dt.getDay()]} ${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

function fmtHowOut(b: Bat): string {
  const h = (b.how_out ?? '').toLowerCase()
  if (!h || h === 'not out') return 'not out'
  if (h.startsWith('ct')) return b.fielder_name ? `ct ${b.fielder_name}` : h
  if (h.startsWith('st')) return b.fielder_name ? `st ${b.fielder_name}` : h
  if (h.startsWith('run out')) return b.fielder_name ? `run out (${b.fielder_name})` : 'run out'
  if (h === 'b' || h === 'bowled') return 'b'
  if (h === 'lbw') return 'lbw'
  return b.how_out ?? ''
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

  const { data: battingRaw } = pcMatchId
    ? await supabase
        .from('batting_entries')
        .select('innings_number, team_batting_id, position, batsman_name, batsman_id, how_out, fielder_name, bowler_name, runs, fours, sixes, balls')
        .eq('match_id', pcMatchId)
        .order('innings_number', { ascending: true })
        .order('position', { ascending: true, nullsFirst: false })
    : { data: [] }

  const { data: bowlingRaw } = pcMatchId
    ? await supabase
        .from('bowling_entries')
        .select('innings_number, team_bowling_id, bowler_name, bowler_id, overs, maidens, runs, wickets, wides, no_balls')
        .eq('match_id', pcMatchId)
        .order('innings_number', { ascending: true })
    : { data: [] }

  const battingByInnings = new Map<number, (Bat & { team_batting_id: string | null })[]>()
  for (const b of battingRaw ?? []) {
    const arr = battingByInnings.get(b.innings_number) ?? []
    arr.push(b as Bat & { team_batting_id: string | null })
    battingByInnings.set(b.innings_number, arr)
  }

  const bowlingByInnings = new Map<number, (Bowl & { team_bowling_id: string | null })[]>()
  for (const b of bowlingRaw ?? []) {
    const arr = bowlingByInnings.get(b.innings_number) ?? []
    arr.push(b as Bowl & { team_bowling_id: string | null })
    bowlingByInnings.set(b.innings_number, arr)
  }

  const inningsNumbers = [...new Set([...battingByInnings.keys(), ...bowlingByInnings.keys()])].sort((a, b) => a - b)

  const teamNameByTeamId = new Map<string, string>()
  if (scorecard) {
    const homeFull =
      scorecard.home_club_name && scorecard.home_team_name
        ? `${scorecard.home_club_name} - ${scorecard.home_team_name}`
        : scorecard.home_team_name || scorecard.home_club_name || 'Home'
    const awayFull =
      scorecard.away_club_name && scorecard.away_team_name
        ? `${scorecard.away_club_name} - ${scorecard.away_team_name}`
        : scorecard.away_team_name || scorecard.away_club_name || 'Away'
    if (scorecard.home_team_id) teamNameByTeamId.set(scorecard.home_team_id, homeFull)
    if (scorecard.away_team_id) teamNameByTeamId.set(scorecard.away_team_id, awayFull)
  }

  const resultBadgeClass =
    fixture.result_text === 'Won'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : fixture.result_text === 'Lost'
        ? 'bg-rose-50 text-rose-700 border-rose-200'
        : 'bg-gray-50 text-gray-600 border-gray-200'

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
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

      {/* Toss */}
      {scorecard && (scorecard.toss_won_by_team_id || scorecard.batted_first_team_id) && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 mb-8 text-sm text-gray-600">
          {scorecard.toss_won_by_team_id && (
            <div>
              <span className="font-semibold text-gray-700">
                {teamNameByTeamId.get(scorecard.toss_won_by_team_id) ?? 'Unknown'}
              </span>{' '}
              won the toss.
            </div>
          )}
          {scorecard.batted_first_team_id && scorecard.batted_first_team_id !== scorecard.toss_won_by_team_id && (
            <div className="text-xs text-gray-400 mt-0.5">
              <span className="font-medium">{teamNameByTeamId.get(scorecard.batted_first_team_id) ?? 'Unknown'}</span>{' '}
              batted first.
            </div>
          )}
          {scorecard.no_of_overs && (
            <div className="text-xs text-gray-400 mt-0.5">{scorecard.no_of_overs} overs per side.</div>
          )}
        </div>
      )}

      {/* Innings */}
      {inningsNumbers.length === 0 ? (
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
        inningsNumbers.map((innNum) => {
          const bat = battingByInnings.get(innNum) ?? []
          const bowl = bowlingByInnings.get(innNum) ?? []
          const firstBat = bat[0]
          const battingTeamId = firstBat?.team_batting_id ?? null
          const battingTeamName = battingTeamId ? teamNameByTeamId.get(battingTeamId) ?? '?' : '?'

          // Total runs/wickets/overs derivation for the header
          const totalRuns = bat.reduce((s, b) => s + (b.runs ?? 0), 0)
          const wicketsTaken = bat.filter((b) => (b.how_out ?? '').toLowerCase() !== 'not out' && b.how_out).length

          return (
            <section key={innNum} className="mb-10">
              <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 border-b border-gray-100 pb-2">
                <div className="text-sm font-bold text-gray-800">
                  {battingTeamName} <span className="text-gray-400 font-normal">batting</span>
                </div>
                <div className="text-sm font-mono font-semibold text-gray-900">
                  {totalRuns}/{wicketsTaken}
                </div>
              </div>

              {/* Batting card */}
              {bat.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-100 mb-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2 text-left">Batsman</th>
                        <th className="px-3 py-2 text-left hidden sm:table-cell">How out</th>
                        <th className="px-3 py-2 text-left hidden md:table-cell">Bowler</th>
                        <th className="px-2 py-2 text-right">R</th>
                        <th className="px-2 py-2 text-right hidden sm:table-cell">B</th>
                        <th className="px-2 py-2 text-right hidden sm:table-cell">4s</th>
                        <th className="px-2 py-2 text-right hidden sm:table-cell">6s</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bat.map((b, i) => {
                        const isNotOut = !b.how_out || (b.how_out ?? '').toLowerCase() === 'not out'
                        const name =
                          b.batsman_id ? (
                            <Link href={`/stats/${b.batsman_id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">
                              {b.batsman_name ?? '?'}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-800">{b.batsman_name ?? '?'}</span>
                          )
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2.5">{name}</td>
                            <td className="px-3 py-2.5 text-gray-500 hidden sm:table-cell">{fmtHowOut(b)}</td>
                            <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">{b.bowler_name ?? '—'}</td>
                            <td className={`px-2 py-2.5 text-right font-semibold ${isNotOut ? 'text-emerald-700' : 'text-gray-900'}`}>
                              {b.runs ?? 0}
                              {isNotOut && <span className="ml-0.5 text-[10px] text-emerald-600">*</span>}
                            </td>
                            <td className="px-2 py-2.5 text-right text-gray-500 hidden sm:table-cell">{b.balls || '—'}</td>
                            <td className="px-2 py-2.5 text-right text-gray-500 hidden sm:table-cell">{b.fours || '—'}</td>
                            <td className="px-2 py-2.5 text-right text-gray-500 hidden sm:table-cell">{b.sixes || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bowling card */}
              {bowl.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="px-3 py-2 text-left">Bowler</th>
                        <th className="px-2 py-2 text-right">O</th>
                        <th className="px-2 py-2 text-right">M</th>
                        <th className="px-2 py-2 text-right">R</th>
                        <th className="px-2 py-2 text-right">W</th>
                        <th className="px-2 py-2 text-right hidden sm:table-cell">Econ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {bowl.map((b, i) => {
                        const oversDec = b.overs ?? 0
                        const econ = oversDec > 0 ? ((b.runs ?? 0) / oversDec).toFixed(2) : '—'
                        const name =
                          b.bowler_id ? (
                            <Link href={`/stats/${b.bowler_id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">
                              {b.bowler_name ?? '?'}
                            </Link>
                          ) : (
                            <span className="font-medium text-gray-800">{b.bowler_name ?? '?'}</span>
                          )
                        return (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2.5">{name}</td>
                            <td className="px-2 py-2.5 text-right font-mono text-gray-600">{formatOvers(b.overs)}</td>
                            <td className="px-2 py-2.5 text-right font-mono text-gray-600">{b.maidens ?? 0}</td>
                            <td className="px-2 py-2.5 text-right font-mono text-gray-600">{b.runs ?? 0}</td>
                            <td className="px-2 py-2.5 text-right font-mono font-semibold text-gray-900">{b.wickets ?? 0}</td>
                            <td className="px-2 py-2.5 text-right font-mono text-gray-500 hidden sm:table-cell">{econ}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )
        })
      )}

      {/* External link footer */}
      {pcMatchId && inningsNumbers.length > 0 && (
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
