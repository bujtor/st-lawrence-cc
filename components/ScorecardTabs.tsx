'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatOvers } from '@/lib/play-cricket'

export type ScBat = {
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

export type ScBowl = {
  bowler_name: string | null
  bowler_id: number | null
  overs: number | null
  maidens: number | null
  runs: number | null
  wickets: number | null
}

export type InningsView = {
  key: string
  battingTeam: string
  bowlingTeam: string
  shortTab: string
  totalRuns: number
  totalWickets: number
  totalOvers: number | null
  batting: ScBat[]
  bowling: ScBowl[]
}

function fmtHowOut(b: ScBat): string {
  const h = (b.how_out ?? '').toLowerCase()
  if (!h || h === 'not out') return 'not out'
  if (h === 'did not bat') return 'did not bat'
  if (h.startsWith('ct')) return b.fielder_name ? `ct ${b.fielder_name}` : 'ct'
  if (h.startsWith('st')) return b.fielder_name ? `st ${b.fielder_name}` : 'st'
  if (h.startsWith('run out')) return b.fielder_name ? `run out (${b.fielder_name})` : 'run out'
  if (h === 'b' || h === 'bowled') return 'b'
  if (h === 'lbw') return 'lbw'
  return b.how_out ?? ''
}

export default function ScorecardTabs({
  views,
  defaultIndex = 0,
}: {
  views: InningsView[]
  defaultIndex?: number
}) {
  const [active, setActive] = useState(
    Math.min(Math.max(defaultIndex, 0), Math.max(views.length - 1, 0))
  )
  if (views.length === 0) return null
  const view = views[active]

  return (
    <div>
      {/* Tab switcher */}
      {views.length > 1 && (
        <div className="inline-flex bg-gray-100 rounded-xl p-1 mb-5 gap-1">
          {views.map((v, idx) => (
            <button
              key={v.key}
              onClick={() => setActive(idx)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                idx === active ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {v.shortTab}
            </button>
          ))}
        </div>
      )}

      {/* Innings heading */}
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3 border-b-2 border-gray-800 pb-2">
        <div className="text-base font-bold text-gray-900">
          {view.battingTeam}
        </div>
        <div className="text-xl font-mono font-bold text-gray-900">
          {view.totalRuns}
          {view.totalWickets < 10 ? '' : ''}
          <span className="text-gray-400">/{view.totalWickets}</span>
          {view.totalOvers != null && view.totalOvers > 0 && (
            <span className="text-gray-500 ml-2 text-sm font-normal">({formatOvers(view.totalOvers)} ov)</span>
          )}
        </div>
      </div>

      {/* Batting card — DNBs are filtered out and shown as footer */}
      {(() => {
        const actualBatters = view.batting.filter((b) => (b.how_out ?? '').toLowerCase() !== 'did not bat')
        const dnbNames = view.batting
          .filter((b) => (b.how_out ?? '').toLowerCase() === 'did not bat')
          .map((b) => b.batsman_name)
          .filter((n): n is string => !!n)

        const runsSum = actualBatters.reduce((s, b) => s + (b.runs ?? 0), 0)
        const extras = Math.max(0, view.totalRuns - runsSum)
        const rr =
          view.totalOvers && view.totalOvers > 0
            ? (view.totalRuns / view.totalOvers).toFixed(2)
            : null

        return (
          <>
            {actualBatters.length > 0 && (
              <div className="overflow-x-auto rounded-xl border border-gray-100 mb-3">
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
                    {actualBatters.map((b, i) => {
                      const ho = (b.how_out ?? '').toLowerCase()
                      const isNotOut = !ho || ho === 'not out'
                      const name = b.batsman_id ? (
                        <Link
                          href={`/stats/${b.batsman_id}`}
                          className="font-medium text-gray-800 hover:text-emerald-700 no-underline"
                        >
                          {b.batsman_name ?? '?'}
                        </Link>
                      ) : (
                        <span className="font-medium text-gray-800">{b.batsman_name ?? '?'}</span>
                      )
                      return (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5">{name}</td>
                          <td className="px-3 py-2.5 hidden sm:table-cell text-gray-500">{fmtHowOut(b)}</td>
                          <td className="px-3 py-2.5 text-gray-500 hidden md:table-cell">{b.bowler_name ?? '—'}</td>
                          <td className={`px-2 py-2.5 text-right font-mono font-semibold ${isNotOut ? 'text-emerald-700' : 'text-gray-900'}`}>
                            {b.runs ?? 0}
                            {isNotOut && <span className="ml-0.5 text-[10px] text-emerald-600">*</span>}
                          </td>
                          <td className="px-2 py-2.5 text-right text-gray-500 font-mono hidden sm:table-cell">{b.balls || '—'}</td>
                          <td className="px-2 py-2.5 text-right text-gray-500 font-mono hidden sm:table-cell">{b.fours || '—'}</td>
                          <td className="px-2 py-2.5 text-right text-gray-500 font-mono hidden sm:table-cell">{b.sixes || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Footer: extras + total */}
                  <tfoot>
                    {extras > 0 && (
                      <tr className="bg-gray-50/50 border-t border-gray-200">
                        <td className="px-3 py-2 text-sm text-gray-600 italic" colSpan={3}>
                          Extras
                        </td>
                        <td className="px-2 py-2 text-right font-mono text-gray-700 font-semibold">{extras}</td>
                        <td className="px-2 py-2 hidden sm:table-cell" colSpan={3}></td>
                      </tr>
                    )}
                    <tr className="bg-gray-100 border-t-2 border-gray-800">
                      <td className="px-3 py-2.5 text-sm font-bold text-gray-900" colSpan={3}>
                        Total
                        {view.totalOvers != null && view.totalOvers > 0 && (
                          <span className="text-gray-500 font-normal text-xs ml-2">
                            ({formatOvers(view.totalOvers)} ov{rr ? `, RR ${rr}` : ''})
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2.5 text-right font-mono font-bold text-gray-900">
                        {view.totalRuns}/{view.totalWickets}
                      </td>
                      <td className="px-2 py-2.5 hidden sm:table-cell" colSpan={3}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {dnbNames.length > 0 && (
              <div className="text-xs text-gray-500 mb-4 px-1">
                <span className="font-semibold text-gray-600">Did not bat:</span> {dnbNames.join(', ')}.
              </div>
            )}
          </>
        )
      })()}

      {/* Bowling card header */}
      {view.bowling.length > 0 && (
        <>
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 mt-6">
            {view.bowlingTeam} <span className="font-normal normal-case tracking-normal">bowling</span>
          </div>
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
                {view.bowling.map((b, i) => {
                  const oversDec = b.overs ?? 0
                  const econ = oversDec > 0 ? ((b.runs ?? 0) / oversDec).toFixed(2) : '—'
                  const name = b.bowler_id ? (
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
        </>
      )}
    </div>
  )
}
