'use client'

import { useState, useEffect, useRef } from 'react'
import type { Fixture } from '@/lib/supabase'

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(time: string | null) {
  if (!time) return ''
  return time.slice(0, 5)
}

function formatDate(d: string) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

type FixtureStats = {
  isLive?: boolean
  keyPlayers?: {
    us: {
      topScorer?: { name: string; runs: number }
      topBowler?: { name: string; wkts: number; overs: number; runs: number }
    }
    them: {
      topScorer?: { name: string; runs: number }
      topBowler?: { name: string; wkts: number; overs: number; runs: number }
    }
  }
  h2h?: {
    played: number
    won: number
    lost: number
    topScorerEver?: { name: string; runs: number; matchDate: string }
    topBowlerEver?: { name: string; wkts: number; runs: number; matchDate: string }
  }
}

export default function FixtureDetail({
  fixture,
  onClose,
}: {
  fixture: Fixture
  onClose: () => void
}) {
  const mapsUrl = fixture.lat && fixture.lng
    ? `https://www.google.com/maps?q=${fixture.lat},${fixture.lng}`
    : null

  const isPast = new Date(fixture.match_date + 'T23:59:59') < new Date()

  // fixtureId that the current stats correspond to (null = loading)
  const [statsResult, setStatsResult] = useState<{ id: number; data: FixtureStats } | null>(null)
  const [liveModalOpen, setLiveModalOpen] = useState(false)
  const fetchIdRef = useRef(0)

  useEffect(() => {
    const myId = ++fetchIdRef.current
    fetch(`/api/fixture-stats?fixture_id=${fixture.id}`)
      .then(r => r.json())
      .then((data: FixtureStats) => {
        if (fetchIdRef.current === myId) setStatsResult({ id: fixture.id, data })
      })
      .catch(() => {
        if (fetchIdRef.current === myId) setStatsResult({ id: fixture.id, data: {} })
      })
  }, [fixture.id])

  const stats = statsResult?.id === fixture.id ? statsResult.data : null
  const statsLoading = statsResult?.id !== fixture.id

  const isLive = stats?.isLive ?? false

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto border border-gray-200 shadow-2xl"
        >
          {/* Header */}
          <div className="p-5 pb-0">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  {formatFullDate(fixture.match_date)}
                </div>
                <div className="text-xl font-bold text-gray-900 mt-1">vs {fixture.opponent}</div>
              </div>
              <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none transition-colors p-1">
                &times;
              </button>
            </div>

            {/* Home/Away badge */}
            <div className="mt-3 flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                fixture.home_away === 'H'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-sky-50 text-sky-700 border border-sky-200'
              }`}>
                {fixture.home_away === 'H' ? 'Home' : 'Away'}
              </span>
              {fixture.competition && (
                <span className="text-xs text-gray-400">{fixture.competition}</span>
              )}
              {isLive && (
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 animate-pulse">
                  LIVE
                </span>
              )}
            </div>
          </div>

          {/* Match info */}
          <div className="p-5 space-y-3">
            {/* Live Banner */}
            {isLive && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                <div className="text-lg font-bold text-red-600 mb-2">🔴 LIVE NOW</div>
                <button
                  onClick={() => setLiveModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
                >
                  Watch live scoring on Play-Cricket
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            )}

            {/* Times */}
            <div className="flex gap-3">
              {fixture.meet_time && (
                <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                  <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Meet</div>
                  <div className="text-lg font-bold text-gray-900 mt-0.5">{formatTime(fixture.meet_time)}</div>
                </div>
              )}
              {fixture.start_time && (
                <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                  <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Start</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">{formatTime(fixture.start_time)}</div>
                </div>
              )}
            </div>

            {/* Venue / Map */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Ground</div>
              <div className="text-sm font-semibold text-gray-800">{fixture.venue}</div>
              {fixture.lat && fixture.lng && (
                <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                  <iframe
                    src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${fixture.lng}!3d${fixture.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1`}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title={`Map of ${fixture.venue}`}
                  />
                </div>
              )}
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-medium text-sky-600 hover:text-sky-700 hover:border-sky-200 no-underline transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Get Directions
                </a>
              )}
            </div>

            {/* Result */}
            {fixture.result_text && !isLive && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Result</div>
                <div className="text-sm font-bold text-emerald-700">{fixture.result_text}</div>
              </div>
            )}

            {/* Key Players (past matches) */}
            {isPast && (
              <div className="border border-dashed border-gray-200 rounded-xl p-4">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-3">
                  Key Players &middot; This Match
                </div>
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                ) : stats?.keyPlayers ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium mb-2">St Lawrence CC</div>
                      <div className="space-y-1.5">
                        {stats.keyPlayers.us.topScorer ? (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-400">Bat</span>{' '}
                            <span className="font-medium">{stats.keyPlayers.us.topScorer.name}</span>
                            {' '}<span className="text-emerald-700 font-semibold">{stats.keyPlayers.us.topScorer.runs}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 italic">No batting data</div>
                        )}
                        {stats.keyPlayers.us.topBowler ? (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-400">Bowl</span>{' '}
                            <span className="font-medium">{stats.keyPlayers.us.topBowler.name}</span>
                            {' '}<span className="text-emerald-700 font-semibold">{stats.keyPlayers.us.topBowler.wkts}/{stats.keyPlayers.us.topBowler.runs}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 italic">No bowling data</div>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 font-medium mb-2">vs {fixture.opponent}</div>
                      <div className="space-y-1.5">
                        {stats.keyPlayers.them.topScorer ? (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-400">Bat</span>{' '}
                            <span className="font-medium">{stats.keyPlayers.them.topScorer.name}</span>
                            {' '}<span className="text-gray-600 font-semibold">{stats.keyPlayers.them.topScorer.runs}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 italic">No batting data</div>
                        )}
                        {stats.keyPlayers.them.topBowler ? (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-400">Bowl</span>{' '}
                            <span className="font-medium">{stats.keyPlayers.them.topBowler.name}</span>
                            {' '}<span className="text-gray-600 font-semibold">{stats.keyPlayers.them.topBowler.wkts}/{stats.keyPlayers.them.topBowler.runs}</span>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-300 italic">No bowling data</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No scorecard available yet</div>
                )}
              </div>
            )}

            {/* Head to Head (upcoming matches) */}
            {!isPast && (
              <div className="border border-dashed border-gray-200 rounded-xl p-4">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-3">
                  Head to Head &middot; Previous Meetings
                </div>
                {statsLoading ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
                  </div>
                ) : stats?.h2h ? (
                  <div className="space-y-3">
                    {stats.h2h.played === 0 ? (
                      <div className="text-xs text-gray-400 italic">No previous meetings found in our records.</div>
                    ) : (
                      <>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Played</div>
                            <div className="text-lg font-bold text-gray-800">{stats.h2h.played}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-emerald-600 font-medium uppercase tracking-wider">Won</div>
                            <div className="text-lg font-bold text-emerald-700">{stats.h2h.won}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Lost</div>
                            <div className="text-lg font-bold text-gray-600">{stats.h2h.lost}</div>
                          </div>
                        </div>
                        {stats.h2h.topScorerEver && (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-400">Top bat vs them</span>{' '}
                            <span className="font-medium">{stats.h2h.topScorerEver.name}</span>
                            {' '}<span className="text-emerald-700 font-semibold">{stats.h2h.topScorerEver.runs}</span>
                            {stats.h2h.topScorerEver.matchDate && (
                              <span className="text-gray-400"> ({formatDate(stats.h2h.topScorerEver.matchDate)})</span>
                            )}
                          </div>
                        )}
                        {stats.h2h.topBowlerEver && (
                          <div className="text-xs text-gray-700">
                            <span className="text-gray-400">Top bowl vs them</span>{' '}
                            <span className="font-medium">{stats.h2h.topBowlerEver.name}</span>
                            {' '}<span className="text-emerald-700 font-semibold">{stats.h2h.topBowlerEver.wkts}/{stats.h2h.topBowlerEver.runs}</span>
                            {stats.h2h.topBowlerEver.matchDate && (
                              <span className="text-gray-400"> ({formatDate(stats.h2h.topBowlerEver.matchDate)})</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 italic">No historical data available</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live scoring iframe modal */}
      {liveModalOpen && fixture.play_cricket_match_id && (
        <div
          className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
          onClick={() => setLiveModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col"
            style={{ height: '85vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-semibold text-gray-800">Live Scoring — Play-Cricket</div>
              <button
                onClick={() => setLiveModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>
            <iframe
              src={`https://stlawrence.play-cricket.com/website/results/${fixture.play_cricket_match_id}`}
              className="flex-1 w-full"
              style={{ border: 0 }}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              loading="lazy"
              title="Live match scoring"
            />
          </div>
        </div>
      )}
    </>
  )
}
