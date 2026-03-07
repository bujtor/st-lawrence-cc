export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">About St Lawrence CC</h1>

      <div className="space-y-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Our Ground</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            St Lawrence Cricket Club plays at Bitchet Green, a picturesque ground nestled in the village of
            Ivy Hatch, near Sevenoaks in Kent. The ground sits in the heart of the Kent countryside,
            surrounded by woodland and orchards.
          </p>
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Address</div>
            <p className="text-sm text-gray-700 font-medium">Bitchet Green, Ivy Hatch, Sevenoaks, Kent, TN15 0NB</p>
            <a
              href="https://www.google.com/maps?q=51.2748,0.2305"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-sky-600 font-medium hover:text-sky-700 no-underline"
            >
              View on Google Maps &rarr;
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">The League</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We compete in the Kent County Village League (KCVL), playing Saturday afternoon
            cricket throughout the summer from May to September. The league features clubs from
            across Kent, with 18 league fixtures per season.
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">2024 Season Highlights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="text-lg font-extrabold text-emerald-700">Greg Shea</div>
              <div className="text-xs text-emerald-600 font-medium">Top run scorer &middot; 304 runs</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="text-lg font-extrabold text-emerald-700">Paul Martin</div>
              <div className="text-xs text-emerald-600 font-medium">Top wicket taker &middot; 22 wickets</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
              <div className="text-lg font-extrabold text-emerald-700">Andrew Bujtor</div>
              <div className="text-xs text-emerald-600 font-medium">Highest score &middot; 117 vs Chiddingstone</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Join Us</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We&apos;re always looking for new players of all abilities. Whether you&apos;re an experienced cricketer
            or picking up a bat for the first time, you&apos;ll be welcome at St Lawrence.
          </p>
          <div className="mt-3">
            <a
              href="https://www.serioussport.co.uk/teamstores/st-lawrence-cc"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-emerald-600 font-semibold hover:text-emerald-700 no-underline"
            >
              Club Shop &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
