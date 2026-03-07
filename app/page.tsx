import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

const sponsors = [
  { name: 'Mount Vineyard', file: 'mount-vineyard.png' },
  { name: 'Chapmans', file: 'chapmans.png' },
  { name: 'Barber Jack', file: 'barber-jack.png' },
  { name: 'JML', file: 'jml.jpeg' },
  { name: 'Regal Point', file: 'regal-point.jpg' },
  { name: 'Gulliver', file: 'gulliver.png' },
  { name: 'Savills', file: 'savills.png' },
]

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}`
}

export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch next fixture
  const today = new Date().toISOString().split('T')[0]
  const { data: nextFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(1)

  const nextFixture = nextFixtures?.[0]

  // Fetch last result
  const { data: lastResults } = await supabase
    .from('fixtures')
    .select('*')
    .lt('match_date', today)
    .not('result_text', 'is', null)
    .order('match_date', { ascending: false })
    .limit(1)

  const lastResult = lastResults?.[0]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-b from-emerald-800 to-emerald-700 text-white">
        <div className="max-w-5xl mx-auto px-4 py-20 text-center">
          <Image
            src="/images/badge.png"
            alt="St Lawrence Cricket Club"
            width={320}
            height={180}
            className="mx-auto mb-6 drop-shadow-lg invert w-auto max-h-36"
            priority
          />
          <p className="text-emerald-200 text-base md:text-lg font-light">Bitchet Green, Ivy Hatch, Sevenoaks, Kent</p>
          <p className="text-emerald-300/80 text-sm mt-1">Kent County Village League &middot; Est. 1879</p>
        </div>
      </div>

      {/* Next fixture / Last result cards */}
      <div className="max-w-5xl mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Next fixture */}
          {nextFixture ? (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">Next Fixture</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-bold text-gray-900">vs {nextFixture.opponent}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{formatDate(nextFixture.match_date)}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                      nextFixture.home_away === 'H' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
                    }`}>
                      {nextFixture.home_away === 'H' ? 'Home' : 'Away'}
                    </span>
                    <span className="text-xs text-gray-400">{nextFixture.venue}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-500">Start</div>
                  <div className="text-xl font-bold text-gray-900">{nextFixture.start_time?.slice(0, 5)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3">Season</div>
              <div className="text-lg font-bold text-gray-900">2026 Season</div>
              <div className="text-sm text-gray-500 mt-0.5">18 league fixtures, May &ndash; September</div>
            </div>
          )}

          {/* Last result or season stats */}
          {lastResult ? (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-widest mb-3">Latest Result</div>
              <div className="text-lg font-bold text-gray-900">vs {lastResult.opponent}</div>
              <div className="text-sm text-gray-500 mt-0.5">{formatDate(lastResult.match_date)}</div>
              <div className="mt-2 text-sm font-medium text-emerald-700">{lastResult.result_text}</div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest mb-3">2024 Highlights</div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Top run scorer</span>
                  <span className="text-sm font-semibold text-gray-900">Greg Shea &middot; 304</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Top wicket taker</span>
                  <span className="text-sm font-semibold text-gray-900">Paul Martin &middot; 22</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Highest score</span>
                  <span className="text-sm font-semibold text-gray-900">A Bujtor &middot; 117</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/fixtures" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">Fixtures</div>
            <div className="text-xs text-gray-400 mt-1">Schedule & results</div>
          </Link>
          <Link href="/table" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">League Table</div>
            <div className="text-xs text-gray-400 mt-1">KCVL standings</div>
          </Link>
          <Link href="/stats" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">Statistics</div>
            <div className="text-xs text-gray-400 mt-1">Batting & bowling</div>
          </Link>
          <Link href="/about" className="group bg-gray-50 hover:bg-emerald-50 rounded-xl p-5 border border-gray-100 hover:border-emerald-200 no-underline transition-all text-center">
            <div className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">About</div>
            <div className="text-xs text-gray-400 mt-1">Ground & contact</div>
          </Link>
        </div>
      </div>

      {/* Sponsors */}
      <div className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <h3 className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest text-center mb-6">Proudly Supported By</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
            {sponsors.map((s) => (
              <div key={s.name} className="grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all">
                <Image
                  src={`/images/sponsors/${s.file}`}
                  alt={s.name}
                  width={100}
                  height={50}
                  className="object-contain max-h-[40px] w-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image src="/images/badge.png" alt="St Lawrence CC" width={80} height={28} className="h-5 w-auto opacity-40" />
              <div className="text-xs text-gray-400">
                St Lawrence Cricket Club &middot; Bitchet Green, Ivy Hatch, TN15 0NB
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a href="https://stlawrence.play-cricket.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-600 no-underline transition-colors">
                Play-Cricket
              </a>
              <a href="https://www.serioussport.co.uk/teamstores/st-lawrence-cc" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-emerald-600 no-underline transition-colors">
                Club Shop
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
