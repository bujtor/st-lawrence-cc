'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatOvers } from '@/lib/play-cricket'

// ----- Public types (must be JSON-serialisable to cross the server/client boundary)

export type BatterRow = {
  id: number | null
  name: string
  matches: number       // sent as a number (server-side aggregate already)
  inns: number
  notOut: number
  runs: number
  hs: number
  fifties: number
  hundreds: number
  totalBalls: number
}

export type BowlerRow = {
  id: number | null
  name: string
  matches: number
  overs: number          // decimal overs
  runs: number
  wickets: number
  bestWkts: number
  bestRuns: number       // 999 sentinel for "no innings"
  fiveWs: number
}

export type FielderRow = {
  name: string
  catches: number
  runOuts: number
  stumpings: number
  total: number
}

type Kind = 'batters' | 'bowlers' | 'fielders'
type SortDir = 'asc' | 'desc'

// ----- Formatters

function fmtAvg(runs: number, inns: number, notOut: number): string {
  const denom = inns - notOut
  if (denom <= 0) return '−'
  return (runs / denom).toFixed(1)
}
function fmtBowlAvg(runs: number, wkts: number): string {
  if (wkts === 0) return '−'
  return (runs / wkts).toFixed(1)
}
function fmtEcon(runs: number, overs: number): string {
  if (overs === 0) return '−'
  return (runs / overs).toFixed(2)
}
function fmtSR(runs: number, balls: number): string {
  if (balls === 0) return '−'
  return ((runs / balls) * 100).toFixed(1)
}

// ----- Column descriptors (per leaderboard kind)

type Column<T> = {
  key: string
  label: string
  align: 'left' | 'right'
  /** Numeric value used for sorting (NaN/undefined sorts last). */
  sortValue: (row: T) => number
  /** Display content. */
  render: (row: T) => React.ReactNode
  /** Sort direction when newly clicked. Default 'desc'. */
  defaultDir?: SortDir
}

function batterColumns(): Column<BatterRow>[] {
  return [
    { key: 'name', label: 'Name', align: 'left', sortValue: (b) => 0, defaultDir: 'asc',
      render: (b) => b.id
        ? <Link href={`/stats/${b.id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">{b.name}</Link>
        : <span className="font-medium text-gray-800">{b.name}</span> },
    { key: 'matches', label: 'M', align: 'right', sortValue: (b) => b.matches, render: (b) => b.matches },
    { key: 'inns', label: 'Inn', align: 'right', sortValue: (b) => b.inns, render: (b) => b.inns },
    { key: 'notOut', label: 'NO', align: 'right', sortValue: (b) => b.notOut, render: (b) => b.notOut },
    { key: 'runs', label: 'Runs', align: 'right', sortValue: (b) => b.runs,
      render: (b) => <span className="font-semibold text-gray-900">{b.runs}</span> },
    { key: 'hs', label: 'HS', align: 'right', sortValue: (b) => b.hs, render: (b) => b.hs },
    { key: 'avg', label: 'Avg', align: 'right',
      sortValue: (b) => (b.inns > b.notOut ? b.runs / (b.inns - b.notOut) : -1),
      render: (b) => fmtAvg(b.runs, b.inns, b.notOut) },
    { key: 'milestones', label: '50/100', align: 'right',
      sortValue: (b) => b.hundreds * 1000 + b.fifties,
      render: (b) => `${b.fifties}/${b.hundreds}` },
    { key: 'sr', label: 'SR', align: 'right',
      sortValue: (b) => (b.totalBalls > 0 ? (b.runs / b.totalBalls) * 100 : -1),
      render: (b) => fmtSR(b.runs, b.totalBalls) },
  ]
}

function bowlerColumns(): Column<BowlerRow>[] {
  return [
    { key: 'name', label: 'Name', align: 'left', sortValue: () => 0, defaultDir: 'asc',
      render: (b) => b.id
        ? <Link href={`/stats/${b.id}`} className="font-medium text-gray-800 hover:text-emerald-700 no-underline">{b.name}</Link>
        : <span className="font-medium text-gray-800">{b.name}</span> },
    { key: 'matches', label: 'M', align: 'right', sortValue: (b) => b.matches, render: (b) => b.matches },
    { key: 'overs', label: 'O', align: 'right', sortValue: (b) => b.overs, render: (b) => formatOvers(b.overs) },
    { key: 'runs', label: 'R', align: 'right', sortValue: (b) => b.runs, render: (b) => b.runs },
    { key: 'wickets', label: 'W', align: 'right', sortValue: (b) => b.wickets,
      render: (b) => <span className="font-semibold text-gray-900">{b.wickets}</span> },
    { key: 'best', label: 'Best', align: 'right',
      sortValue: (b) => b.bestWkts * 1000 - (b.bestRuns === 999 ? 0 : b.bestRuns),
      render: (b) => `${b.bestWkts}/${b.bestRuns === 999 ? 0 : b.bestRuns}` },
    { key: 'avg', label: 'Avg', align: 'right',
      sortValue: (b) => (b.wickets > 0 ? b.runs / b.wickets : Number.MAX_SAFE_INTEGER),
      defaultDir: 'asc',
      render: (b) => fmtBowlAvg(b.runs, b.wickets) },
    { key: 'econ', label: 'Econ', align: 'right',
      sortValue: (b) => (b.overs > 0 ? b.runs / b.overs : Number.MAX_SAFE_INTEGER),
      defaultDir: 'asc',
      render: (b) => fmtEcon(b.runs, b.overs) },
    { key: 'fiveW', label: '5W', align: 'right', sortValue: (b) => b.fiveWs, render: (b) => b.fiveWs },
  ]
}

function fielderColumns(): Column<FielderRow>[] {
  return [
    { key: 'name', label: 'Name', align: 'left', sortValue: () => 0, defaultDir: 'asc',
      render: (f) => <span className="font-medium text-gray-800">{f.name}</span> },
    { key: 'catches', label: 'Catches', align: 'right', sortValue: (f) => f.catches, render: (f) => f.catches },
    { key: 'runOuts', label: 'Run-outs', align: 'right', sortValue: (f) => f.runOuts, render: (f) => f.runOuts },
    { key: 'stumpings', label: 'Stumpings', align: 'right', sortValue: (f) => f.stumpings, render: (f) => f.stumpings },
    { key: 'total', label: 'Total', align: 'right', sortValue: (f) => f.total,
      render: (f) => <span className="font-semibold text-gray-900">{f.total}</span> },
  ]
}

// ----- Component

type AnyRow = BatterRow | BowlerRow | FielderRow

export default function LeaderboardTable({
  kind,
  rows,
  defaultSortKey,
}: {
  kind: Kind
  rows: AnyRow[]
  defaultSortKey: string
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState(false)

  const columns: Column<AnyRow>[] = useMemo(() => {
    if (kind === 'batters') return batterColumns() as unknown as Column<AnyRow>[]
    if (kind === 'bowlers') return bowlerColumns() as unknown as Column<AnyRow>[]
    return fielderColumns() as unknown as Column<AnyRow>[]
  }, [kind])

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey)
    if (!col || sortKey === 'name') {
      // Name sort: alphabetical
      const arr = [...rows]
      arr.sort((a, b) => {
        const na = (a as { name: string }).name ?? ''
        const nb = (b as { name: string }).name ?? ''
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      })
      return arr
    }
    const getter = col.sortValue
    const arr = [...rows]
    arr.sort((a, b) => {
      const av = getter(a)
      const bv = getter(b)
      if (av === bv) return 0
      return sortDir === 'desc' ? bv - av : av - bv
    })
    return arr
  }, [rows, columns, sortKey, sortDir])

  const visible = expanded ? sorted : sorted.slice(0, 10)

  function handleSort(key: string) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      const col = columns.find((c) => c.key === key)
      setSortDir(col?.defaultDir ?? 'desc')
    }
  }

  const noun = kind === 'batters' ? 'batter' : kind === 'bowlers' ? 'bowler' : 'fielder'

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
              <th className="px-3 py-2 text-left w-6">#</th>
              {columns.map((col) => {
                const isActive = col.key === sortKey
                return (
                  <th key={col.key} className={`px-3 py-2 ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                    <button
                      onClick={() => handleSort(col.key)}
                      className={`inline-flex items-center gap-1 transition-colors min-h-[24px] ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      } ${isActive ? 'text-emerald-700' : 'text-gray-400 hover:text-gray-700'}`}
                      title={`Sort by ${col.label}`}
                    >
                      <span>{col.label}</span>
                      <span className="text-[8px] w-2 inline-block">
                        {isActive ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {visible.map((row, i) => {
              const key = (() => {
                if ('id' in row && row.id != null) return `id-${row.id}`
                return `name-${i}-${(row as { name: string }).name ?? ''}`
              })()
              return (
                <tr key={key} className="hover:bg-gray-50 transition-colors">
                  <td className="px-3 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key}
                        className={`px-3 py-2.5 ${
                          col.align === 'right' ? 'text-right' : ''
                        } ${col.key === sortKey && col.key !== 'name' ? 'text-gray-700' : 'text-gray-600'}`}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {sorted.length > 10 && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full px-3 py-2.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50/30 transition-colors text-left border-t border-gray-100 cursor-pointer"
        >
          {expanded
            ? `▲ Hide ${sorted.length - 10} ${sorted.length - 10 === 1 ? noun : noun + 's'}`
            : `▸ Show all ${sorted.length} ${sorted.length === 1 ? noun : noun + 's'}`}
        </button>
      )}
    </div>
  )
}
