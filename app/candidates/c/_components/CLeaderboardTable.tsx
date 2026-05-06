'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { formatOvers } from '@/lib/play-cricket'
import {
  C_GREEN,
  C_RED,
  C_RULE,
  display,
  mono,
  sansTight,
} from '../_theme/tokens'

// Re-export the same types so the server page can import from one place
export type BatterRow = {
  id: number | null
  name: string
  matches: number
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
  overs: number
  runs: number
  wickets: number
  bestWkts: number
  bestRuns: number
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

// Formatters
function fmtAvg(runs: number, inns: number, notOut: number): string {
  const d = inns - notOut
  if (d <= 0) return '−'
  return (runs / d).toFixed(1)
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

type Column<T> = {
  key: string
  label: string
  align: 'left' | 'right'
  sortValue: (row: T) => number
  render: (row: T) => React.ReactNode
  defaultDir?: SortDir
}

function batterColumns(basePath: string): Column<BatterRow>[] {
  return [
    {
      key: 'name', label: 'Name', align: 'left',
      sortValue: () => 0, defaultDir: 'asc',
      render: (b) => b.id
        ? <Link href={`${basePath}/${b.id}`} style={{ fontFamily: display, fontSize: 15, fontWeight: 500, color: C_GREEN, textDecoration: 'none', letterSpacing: -0.2 }}>{b.name}</Link>
        : <span style={{ fontFamily: display, fontSize: 15, fontWeight: 500 }}>{b.name}</span>,
    },
    { key: 'matches', label: 'M', align: 'right', sortValue: (b) => b.matches, render: (b) => b.matches },
    { key: 'inns', label: 'Inn', align: 'right', sortValue: (b) => b.inns, render: (b) => b.inns },
    { key: 'notOut', label: 'NO', align: 'right', sortValue: (b) => b.notOut, render: (b) => b.notOut },
    {
      key: 'runs', label: 'Runs', align: 'right',
      sortValue: (b) => b.runs,
      render: (b) => <span style={{ fontFamily: mono, fontWeight: 700, color: C_GREEN }}>{b.runs}</span>,
    },
    { key: 'hs', label: 'HS', align: 'right', sortValue: (b) => b.hs, render: (b) => b.hs },
    {
      key: 'avg', label: 'Avg', align: 'right',
      sortValue: (b) => b.inns > b.notOut ? b.runs / (b.inns - b.notOut) : -1,
      defaultDir: 'asc',
      render: (b) => fmtAvg(b.runs, b.inns, b.notOut),
    },
    {
      key: 'sr', label: 'SR', align: 'right',
      sortValue: (b) => b.totalBalls > 0 ? (b.runs / b.totalBalls) * 100 : -1,
      defaultDir: 'asc',
      render: (b) => fmtSR(b.runs, b.totalBalls),
    },
    {
      key: 'milestones', label: '50/100', align: 'right',
      sortValue: (b) => b.hundreds * 1000 + b.fifties,
      render: (b) => `${b.fifties}/${b.hundreds}`,
    },
  ]
}

function bowlerColumns(basePath: string): Column<BowlerRow>[] {
  return [
    {
      key: 'name', label: 'Name', align: 'left',
      sortValue: () => 0, defaultDir: 'asc',
      render: (b) => b.id
        ? <Link href={`${basePath}/${b.id}`} style={{ fontFamily: display, fontSize: 15, fontWeight: 500, color: C_GREEN, textDecoration: 'none', letterSpacing: -0.2 }}>{b.name}</Link>
        : <span style={{ fontFamily: display, fontSize: 15, fontWeight: 500 }}>{b.name}</span>,
    },
    { key: 'matches', label: 'M', align: 'right', sortValue: (b) => b.matches, render: (b) => b.matches },
    { key: 'overs', label: 'O', align: 'right', sortValue: (b) => b.overs, render: (b) => formatOvers(b.overs) },
    { key: 'runs', label: 'R', align: 'right', sortValue: (b) => b.runs, render: (b) => b.runs },
    {
      key: 'wickets', label: 'W', align: 'right',
      sortValue: (b) => b.wickets,
      render: (b) => <span style={{ fontFamily: mono, fontWeight: 700, color: C_RED }}>{b.wickets}</span>,
    },
    {
      key: 'best', label: 'Best', align: 'right',
      sortValue: (b) => b.bestWkts * 1000 - (b.bestRuns === 999 ? 0 : b.bestRuns),
      render: (b) => `${b.bestWkts}/${b.bestRuns === 999 ? 0 : b.bestRuns}`,
    },
    {
      key: 'avg', label: 'Avg', align: 'right',
      sortValue: (b) => b.wickets > 0 ? b.runs / b.wickets : Number.MAX_SAFE_INTEGER,
      defaultDir: 'asc',
      render: (b) => fmtBowlAvg(b.runs, b.wickets),
    },
    {
      key: 'econ', label: 'Econ', align: 'right',
      sortValue: (b) => b.overs > 0 ? b.runs / b.overs : Number.MAX_SAFE_INTEGER,
      defaultDir: 'asc',
      render: (b) => fmtEcon(b.runs, b.overs),
    },
    { key: 'fiveW', label: '5W', align: 'right', sortValue: (b) => b.fiveWs, render: (b) => b.fiveWs },
  ]
}

function fielderColumns(): Column<FielderRow>[] {
  return [
    {
      key: 'name', label: 'Name', align: 'left',
      sortValue: () => 0, defaultDir: 'asc',
      render: (f) => <span style={{ fontFamily: display, fontSize: 15, fontWeight: 500 }}>{f.name}</span>,
    },
    { key: 'catches', label: 'Catches', align: 'right', sortValue: (f) => f.catches, render: (f) => f.catches },
    { key: 'runOuts', label: 'Run-outs', align: 'right', sortValue: (f) => f.runOuts, render: (f) => f.runOuts },
    { key: 'stumpings', label: 'Stumpings', align: 'right', sortValue: (f) => f.stumpings, render: (f) => f.stumpings },
    {
      key: 'total', label: 'Total', align: 'right',
      sortValue: (f) => f.total,
      render: (f) => <span style={{ fontFamily: mono, fontWeight: 700, color: C_GREEN }}>{f.total}</span>,
    },
  ]
}

type AnyRow = BatterRow | BowlerRow | FielderRow

export default function CLeaderboardTable({
  kind,
  rows,
  defaultSortKey,
  basePath = '/candidates/c/stats',
}: {
  kind: Kind
  rows: AnyRow[]
  defaultSortKey: string
  basePath?: string
}) {
  const [sortKey, setSortKey] = useState(defaultSortKey)
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [expanded, setExpanded] = useState(false)

  const columns = useMemo(() => {
    if (kind === 'batters') return batterColumns(basePath) as unknown as Column<AnyRow>[]
    if (kind === 'bowlers') return bowlerColumns(basePath) as unknown as Column<AnyRow>[]
    return fielderColumns() as unknown as Column<AnyRow>[]
  }, [kind, basePath])

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey)
    const arr = [...rows]
    if (!col || sortKey === 'name') {
      arr.sort((a, b) => {
        const na = (a as { name: string }).name ?? ''
        const nb = (b as { name: string }).name ?? ''
        return sortDir === 'asc' ? na.localeCompare(nb) : nb.localeCompare(na)
      })
      return arr
    }
    const getter = col.sortValue
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
    <div style={{ border: `1px solid ${C_RULE}`, background: '#fff', fontFamily: sansTight }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C_RULE}` }}>
              <th style={{
                padding: '8px 12px',
                textAlign: 'left',
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: '#999',
                fontWeight: 600,
                width: 28,
              }}>#</th>
              {columns.map((col) => {
                const isActive = col.key === sortKey
                return (
                  <th key={col.key} style={{
                    padding: '8px 12px',
                    textAlign: col.align,
                  }}>
                    <button
                      onClick={() => handleSort(col.key)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontFamily: mono,
                        fontSize: 10,
                        letterSpacing: 2,
                        textTransform: 'uppercase',
                        fontWeight: 600,
                        color: isActive ? C_GREEN : '#999',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexDirection: col.align === 'right' ? 'row-reverse' : 'row',
                        padding: 0,
                        whiteSpace: 'nowrap',
                      }}
                      title={`Sort by ${col.label}`}
                    >
                      {col.label}
                      <span style={{ fontSize: 8, width: 8, display: 'inline-block' }}>
                        {isActive ? (sortDir === 'desc' ? '▼' : '▲') : ''}
                      </span>
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.map((row, i) => {
              const key = (() => {
                if ('id' in row && row.id != null) return `id-${row.id}`
                return `name-${i}-${(row as { name: string }).name ?? ''}`
              })()
              return (
                <tr key={key} style={{
                  borderBottom: `1px dashed ${C_RULE}`,
                  transition: 'background 0.1s',
                }}>
                  <td style={{
                    padding: '10px 12px',
                    fontFamily: mono,
                    fontSize: 11,
                    color: '#bbb',
                    fontWeight: 500,
                  }}>{i + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} style={{
                      padding: '10px 12px',
                      textAlign: col.align,
                      fontFamily: mono,
                      fontSize: 13,
                      color: col.key === sortKey && col.key !== 'name' ? '#333' : '#666',
                    }}>
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
          style={{
            width: '100%',
            padding: '10px 12px',
            background: 'none',
            border: 'none',
            borderTop: `1px solid ${C_RULE}`,
            cursor: 'pointer',
            fontFamily: mono,
            fontSize: 11,
            letterSpacing: 1.5,
            textTransform: 'uppercase',
            color: C_GREEN,
            fontWeight: 700,
            textAlign: 'left',
          }}
        >
          {expanded
            ? `▲ Hide ${sorted.length - 10} ${sorted.length - 10 === 1 ? noun : noun + 's'}`
            : `▸ Show all ${sorted.length} ${sorted.length === 1 ? noun : noun + 's'}`}
        </button>
      )}
    </div>
  )
}
