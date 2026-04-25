import { supabase } from '@/lib/supabase'
import { clubSlug } from '@/lib/slug'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type ClubRecord = {
  opponent: string
  played: number
  won: number
  lost: number
  drew: number
  tied: number
  abandoned: number
}

function fmtDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`
}

export default async function ClubsIndexPage() {
  // Pull all fixtures with a result to build H2H records
  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('opponent, result_text, match_date')
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })

  // Aggregate by opponent
  const clubMap = new Map<string, ClubRecord>()

  for (const f of fixtures ?? []) {
    const name = f.opponent ?? ''
    if (!name) continue
    if (!clubMap.has(name)) {
      clubMap.set(name, { opponent: name, played: 0, won: 0, lost: 0, drew: 0, tied: 0, abandoned: 0 })
    }
    const rec = clubMap.get(name)!
    rec.played++
    const r = f.result_text ?? ''
    if (r === 'Won') rec.won++
    else if (r === 'Lost') rec.lost++
    else if (r === 'Drew') rec.drew++
    else if (r === 'Tied') rec.tied++
    else if (r === 'Abandoned') rec.abandoned++
  }

  const clubs = Array.from(clubMap.values())
    .sort((a, b) => b.played - a.played || a.opponent.localeCompare(b.opponent))

  // Get last match date per opponent for display
  const lastMatchByOpponent = new Map<string, string>()
  for (const f of fixtures ?? []) {
    if (!f.opponent) continue
    if (!lastMatchByOpponent.has(f.opponent)) {
      lastMatchByOpponent.set(f.opponent, f.match_date)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-gray-900">Opponents</h1>
        <p className="text-sm text-gray-400 mt-1">All-time head-to-head records</p>
      </div>

      {clubs.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg font-medium">No completed matches yet.</p>
          <p className="text-sm mt-1">H2H records appear once scorecards are synced.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clubs.map((club) => {
            const slug = clubSlug(club.opponent)
            const lastDate = lastMatchByOpponent.get(club.opponent)
            const winRate = club.played > 0 ? Math.round((club.won / club.played) * 100) : 0

            return (
              <Link
                key={club.opponent}
                href={`/clubs/${slug}`}
                className="group flex items-center justify-between bg-white rounded-xl border border-gray-100 px-5 py-4 no-underline hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
              >
                <div>
                  <div className="font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors">
                    {club.opponent}
                  </div>
                  {lastDate && (
                    <div className="text-xs text-gray-400 mt-0.5">Last played {fmtDate(lastDate)}</div>
                  )}
                </div>

                <div className="flex items-center gap-6 flex-shrink-0">
                  {/* W/L summary chips */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                      {club.won}W
                    </span>
                    <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                      {club.lost}L
                    </span>
                    {club.drew > 0 && (
                      <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                        {club.drew}D
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-gray-800">
                      P{club.played}
                    </div>
                    <div className="text-xs text-gray-400">{winRate}% wins</div>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
