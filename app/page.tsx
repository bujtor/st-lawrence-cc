import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-emerald-700 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-extrabold mx-auto mb-6">
            SL
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">St Lawrence Cricket Club</h1>
          <p className="text-emerald-100 text-lg">Bitchet Green, Ivy Hatch, Sevenoaks, Kent</p>
          <p className="text-emerald-200 text-sm mt-1">Kent County Village League</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/availability"
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow no-underline group"
          >
            <div className="text-2xl mb-2">{'\uD83D\uDCCB'}</div>
            <div className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
              Availability
            </div>
            <p className="text-sm text-gray-500 mt-1">Set your availability for the 2026 season</p>
          </Link>

          <Link
            href="/fixtures"
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow no-underline group"
          >
            <div className="text-2xl mb-2">{'\uD83C\uDFCF'}</div>
            <div className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
              Fixtures & Results
            </div>
            <p className="text-sm text-gray-500 mt-1">View the season schedule and scorecards</p>
          </Link>

          <Link
            href="/about"
            className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow no-underline group"
          >
            <div className="text-2xl mb-2">{'\uD83C\uDFDF\uFE0F'}</div>
            <div className="text-lg font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
              About the Club
            </div>
            <p className="text-sm text-gray-500 mt-1">History, ground info, and how to join</p>
          </Link>
        </div>
      </div>

      {/* Season info */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">2026 Season</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-extrabold text-emerald-700">18</div>
              <div className="text-xs text-gray-500 font-medium">Fixtures</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-700">May 9</div>
              <div className="text-xs text-gray-500 font-medium">Season starts</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-700">Sep 5</div>
              <div className="text-xs text-gray-500 font-medium">Season ends</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-emerald-700">KCVL</div>
              <div className="text-xs text-gray-500 font-medium">League</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h3 className="text-xs text-gray-400 font-semibold uppercase tracking-widest text-center mb-4">Our Sponsors</h3>
        <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400 font-medium">
          {['Mount Vineyard', 'Chapmans', 'Barber Jack', 'JML', 'Regal Point', 'Gulliver', 'Harding Motors', 'Savills'].map((s) => (
            <span key={s} className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        <p>St Lawrence Cricket Club &middot; Bitchet Green, Ivy Hatch, TN15 0NB</p>
        <p className="mt-1">
          <a href="https://www.serioussport.co.uk/teamstores/st-lawrence-cc" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 no-underline">
            Club Shop
          </a>
        </p>
      </footer>
    </div>
  )
}
