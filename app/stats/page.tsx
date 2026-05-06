import { supabase } from '@/lib/supabase'
import { aggregateBatting, aggregateBowling, type BatRow, type BowlRow } from '@/lib/aggregations'
import Link from 'next/link'
import CLeaderboardTable from '@/components/c/CLeaderboardTable'
import type { BatterRow, BowlerRow, FielderRow } from '@/components/c/CLeaderboardTable'
import {
  CKicker,
  CPageHeader,
  CCard,
  CContainer,
  C_GREEN,
  C_GREEN_LT,
  C_RED,
  C_CREAM,
  C_INK,
  C_RULE,
  display,
  mono,
  sansTight,
} from '@/components/c/primitives'

export const dynamic = 'force-dynamic'

const ALL_SEASONS = Array.from({ length: 2026 - 2008 + 1 }, (_, i) => 2008 + i)
const ALL_TIME = 'all' as const
type SeasonParam = number | typeof ALL_TIME

export default async function CStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>
}) {
  const sp = await searchParams
  const seasonRaw = sp.season ?? String(new Date().getFullYear())
  const isAllTime = seasonRaw === ALL_TIME
  const season: SeasonParam = isAllTime ? ALL_TIME : parseInt(seasonRaw, 10)

  // Team summary
  let scorecardsQ = supabase
    .from('match_scorecards')
    .select('result_text, our_team_id, home_team_id, away_team_id, our_runs, opp_runs, toss_won_by_team_id, result, result_applied_to')
  if (!isAllTime) scorecardsQ = scorecardsQ.eq('season', season as number)
  const { data: scorecards } = await scorecardsQ

  const isEmpty = !scorecards || scorecards.length === 0

  let played = 0, won = 0, lost = 0, tied = 0, drew = 0, abandoned = 0
  let runsFor = 0, runsAgainst = 0
  let homeW = 0, homeL = 0, awayW = 0, awayL = 0
  let tossWon = 0, wonAfterToss = 0

  if (scorecards) {
    for (const s of scorecards) {
      played++
      const rt = s.result_text ?? ''
      if (rt === 'Won') won++
      else if (rt === 'Lost') lost++
      else if (rt === 'Tied') tied++
      else if (rt === 'Drew') drew++
      else if (rt === 'Abandoned') abandoned++

      runsFor += s.our_runs ?? 0
      runsAgainst += s.opp_runs ?? 0

      const isHome = s.our_team_id === s.home_team_id
      if (rt === 'Won') { if (isHome) homeW++; else awayW++ }
      else if (rt === 'Lost') { if (isHome) homeL++; else awayL++ }

      if (s.toss_won_by_team_id && String(s.toss_won_by_team_id) === String(s.our_team_id)) {
        tossWon++
        if (rt === 'Won') wonAfterToss++
      }
    }
  }

  const tossWinPct = played > 0 ? ((tossWon / played) * 100).toFixed(0) + '%' : '−'
  const winAfterTossPct = tossWon > 0 ? ((wonAfterToss / tossWon) * 100).toFixed(0) + '%' : '−'
  const avgScore = played > 0 ? Math.round(runsFor / played) : 0

  // Batting
  let battingQ = supabase
    .from('batting_entries')
    .select('batsman_name, batsman_id, runs, balls, how_out, match_id')
    .eq('is_our_batsman', true)
    .limit(20000)
  if (!isAllTime) battingQ = battingQ.eq('season', season as number)
  const { data: battingRaw } = await battingQ

  const batterMap = aggregateBatting((battingRaw ?? []) as BatRow[])
  const batters: BatterRow[] = Array.from(batterMap.values()).map((b) => ({
    id: b.id,
    name: b.name,
    matches: b.matches.size,
    inns: b.inns,
    notOut: b.notOut,
    runs: b.runs,
    hs: b.hs,
    fifties: b.fifties,
    hundreds: b.hundreds,
    totalBalls: b.totalBalls,
  }))

  // Bowling
  let bowlingQ = supabase
    .from('bowling_entries')
    .select('bowler_name, bowler_id, overs, runs, wickets, maidens, match_id, innings_number')
    .eq('is_our_bowler', true)
    .limit(20000)
  if (!isAllTime) bowlingQ = bowlingQ.eq('season', season as number)
  const { data: bowlingRaw } = await bowlingQ

  const bowlerMap = aggregateBowling((bowlingRaw ?? []) as BowlRow[])
  const bowlers: BowlerRow[] = Array.from(bowlerMap.values())
    .filter((b) => b.wickets > 0)
    .map((b) => ({
      id: b.id,
      name: b.name,
      matches: b.matches.size,
      overs: b.overs,
      runs: b.runs,
      wickets: b.wickets,
      bestWkts: b.bestWkts,
      bestRuns: b.bestRuns,
      fiveWs: b.fiveWs,
    }))

  // Fielding
  let fieldingQ = supabase
    .from('batting_entries')
    .select('fielder_name, fielder_id, how_out')
    .eq('is_our_fielder', true)
    .not('fielder_id', 'is', null)
    .limit(20000)
  if (!isAllTime) fieldingQ = fieldingQ.eq('season', season as number)
  const { data: fieldingRaw } = await fieldingQ

  type FielderAgg = { name: string; catches: number; runOuts: number; stumpings: number }
  const fielderMap = new Map<string, FielderAgg>()
  for (const row of fieldingRaw ?? []) {
    const key = String(row.fielder_id ?? row.fielder_name)
    if (!fielderMap.has(key)) {
      fielderMap.set(key, { name: row.fielder_name ?? '?', catches: 0, runOuts: 0, stumpings: 0 })
    }
    const agg = fielderMap.get(key)!
    const ho = (row.how_out ?? '').toLowerCase()
    if (ho.startsWith('ct')) agg.catches++
    else if (ho.startsWith('run out')) agg.runOuts++
    else if (ho.startsWith('st')) agg.stumpings++
  }
  const fielders: FielderRow[] = Array.from(fielderMap.values())
    .map((f) => ({ ...f, total: f.catches + f.runOuts + f.stumpings }))
    .filter((f) => f.total > 0)

  const recentSeasons = ALL_SEASONS.slice(-5)
  const olderSeasons = ALL_SEASONS.slice(0, -5).slice().reverse()
  const headingSubtitle = isAllTime
    ? 'All-time totals · 2008–2026'
    : `${season} Season`

  // Season selector
  const seasonSelector = (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {recentSeasons.map((s) => {
        const active = !isAllTime && s === season
        return (
          <Link
            key={s}
            href={`/stats?season=${s}`}
            style={{
              padding: '6px 14px',
              fontFamily: mono,
              fontSize: 11,
              letterSpacing: 2,
              textTransform: 'uppercase',
              fontWeight: 700,
              textDecoration: 'none',
              background: active ? C_GREEN : '#fff',
              color: active ? '#fff' : '#888',
              border: `1px solid ${active ? C_GREEN : C_RULE}`,
              minHeight: 36,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {s}
          </Link>
        )
      })}
      <Link
        href={`/stats?season=${ALL_TIME}`}
        style={{
          padding: '6px 14px',
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 700,
          textDecoration: 'none',
          background: isAllTime ? C_GREEN : '#fff',
          color: isAllTime ? '#fff' : C_GREEN_LT,
          border: `1.5px solid ${isAllTime ? C_GREEN : C_GREEN_LT}`,
          minHeight: 36,
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        All time
      </Link>
      <details style={{ position: 'relative' }}>
        <summary style={{
          padding: '6px 14px',
          fontFamily: mono,
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          fontWeight: 700,
          background: '#fff',
          color: '#888',
          border: `1px solid ${C_RULE}`,
          minHeight: 36,
          display: 'inline-flex',
          alignItems: 'center',
          cursor: 'pointer',
          listStyle: 'none',
        }}>
          Older ▾
        </summary>
        <div style={{
          position: 'absolute',
          right: 0,
          marginTop: 4,
          background: '#fff',
          border: `1px solid ${C_RULE}`,
          boxShadow: '0 4px 16px rgba(0,0,0,.1)',
          padding: 8,
          zIndex: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 4,
          minWidth: 200,
        }}>
          {olderSeasons.map((s) => {
            const active = !isAllTime && s === season
            return (
              <Link
                key={s}
                href={`/stats?season=${s}`}
                style={{
                  padding: '6px 10px',
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 1.5,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  textDecoration: 'none',
                  textAlign: 'center',
                  color: active ? '#fff' : '#666',
                  background: active ? C_GREEN : 'transparent',
                }}
              >
                {s}
              </Link>
            )
          })}
        </div>
      </details>
    </div>
  )

  return (
    <div style={{ fontFamily: sansTight, color: C_INK }}>
      <CContainer>
        <CPageHeader
          kicker="Statistics"
          title={isAllTime ? 'All-time records.' : `${season} season.`}
          subtitle={headingSubtitle}
          right={seasonSelector}
        />

        {isEmpty ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: '#888' }}>
            <div style={{ fontFamily: display, fontSize: 32, fontStyle: 'italic', marginBottom: 12 }}>
              {isAllTime ? 'No stats yet.' : `Stats for ${season} will arrive as matches are played.`}
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }}>
              Scorecards sync automatically after each match.
            </div>
          </div>
        ) : (
          <>
            {/* Team summary — dark green panel */}
            <section style={{ marginBottom: 56 }}>
              <CKicker>Team Summary</CKicker>
              <div
                style={{
                  background: C_GREEN,
                  marginTop: 16,
                  padding: '32px 40px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 32,
                }}
              >
                {/* Played */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Played</div>
                  <div style={{ fontFamily: display, fontSize: 48, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{played}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>
                    {won}W · {lost}L{tied > 0 ? ` · ${tied}T` : ''}{drew > 0 ? ` · ${drew}D` : ''}{abandoned > 0 ? ` · ${abandoned}A` : ''}
                  </div>
                </div>
                {/* Runs */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Runs For</div>
                  <div style={{ fontFamily: display, fontSize: 48, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{runsFor.toLocaleString()}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>
                    Conceded {runsAgainst.toLocaleString()}
                  </div>
                </div>
                {/* Avg Score */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Avg Score</div>
                  <div style={{ fontFamily: display, fontSize: 48, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{avgScore}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>runs per match</div>
                </div>
                {/* Home */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Home</div>
                  <div style={{ fontFamily: display, fontSize: 48, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{homeW}–{homeL}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>W-L at Bitchet Green</div>
                </div>
                {/* Away */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Away</div>
                  <div style={{ fontFamily: display, fontSize: 48, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{awayW}–{awayL}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>W-L on the road</div>
                </div>
                {/* Toss */}
                <div>
                  <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,.5)', textTransform: 'uppercase' }}>Toss won</div>
                  <div style={{ fontFamily: display, fontSize: 48, fontWeight: 500, color: '#fff', lineHeight: 1, marginTop: 4 }}>{tossWinPct}</div>
                  <div style={{ fontFamily: mono, fontSize: 11, color: 'rgba(255,255,255,.55)', marginTop: 6 }}>Win after toss {winAfterTossPct}</div>
                </div>
              </div>
            </section>

            {/* Leaderboards — three column grid */}
            <div className="leaderboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 32, marginBottom: 56 }}>
              {/* Batting */}
              {batters.length > 0 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>— Batting</div>
                    <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, marginTop: 4 }}>Top batters.</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#aaa', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
                      {batters.length} players
                    </div>
                  </div>
                  <CLeaderboardTable kind="batters" rows={batters} defaultSortKey="runs" basePath="/stats" />
                </div>
              )}

              {/* Bowling */}
              {bowlers.length > 0 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>— Bowling</div>
                    <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, marginTop: 4 }}>Top bowlers.</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#aaa', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
                      {bowlers.length} players
                    </div>
                  </div>
                  <CLeaderboardTable kind="bowlers" rows={bowlers} defaultSortKey="wickets" basePath="/stats" />
                </div>
              )}

              {/* Fielding */}
              {fielders.length > 0 && (
                <div>
                  <div style={{ textAlign: 'center', marginBottom: 14 }}>
                    <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, color: C_RED, textTransform: 'uppercase', fontWeight: 700 }}>— Fielding</div>
                    <div style={{ fontFamily: display, fontSize: 28, fontWeight: 500, letterSpacing: -0.5, marginTop: 4 }}>Top fielders.</div>
                    <div style={{ fontFamily: mono, fontSize: 10, color: '#aaa', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 4 }}>
                      {fielders.length} players
                    </div>
                  </div>
                  <CLeaderboardTable kind="fielders" rows={fielders} defaultSortKey="total" basePath="/stats" />
                </div>
              )}
            </div>
          </>
        )}
      </CContainer>

      <style>{`
        @media (max-width: 900px) {
          .leaderboard-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
