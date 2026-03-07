import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export default async function FixturesPage() {
  const season = new Date().getFullYear()

  const { data: fixtures } = await supabase
    .from('fixtures')
    .select('*')
    .eq('season', season)
    .order('match_date', { ascending: true })

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Fixtures & Results</h1>
      <p className="text-sm text-gray-400 mb-6">{season} Season</p>

      <div className="space-y-2">
        {(fixtures || []).map((f) => (
          <div
            key={f.id}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="text-center min-w-[60px]">
              <div className="text-sm font-bold text-gray-700">{formatDate(f.match_date)}</div>
              <div className={`text-xs font-bold mt-0.5 ${f.home_away === 'H' ? 'text-emerald-600' : 'text-sky-600'}`}>
                {f.home_away === 'H' ? 'Home' : 'Away'}
              </div>
            </div>
            <div className="flex-1">
              <div className="font-semibold text-gray-800">vs {f.opponent}</div>
              <div className="text-xs text-gray-400">{f.venue}</div>
            </div>
            <div className="text-right text-xs text-gray-400">
              {f.start_time?.slice(0, 5)}
            </div>
            {f.result_text && (
              <div className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded">
                {f.result_text}
              </div>
            )}
          </div>
        ))}
      </div>

      {(!fixtures || fixtures.length === 0) && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-lg font-medium">No fixtures yet</p>
          <p className="text-sm mt-1">Fixtures will appear once synced from Play-Cricket</p>
        </div>
      )}
    </div>
  )
}
