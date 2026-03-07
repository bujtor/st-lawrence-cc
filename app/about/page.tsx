import Image from 'next/image'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero with ground photo */}
      <div className="relative h-56 md:h-72 overflow-hidden">
        <Image
          src="/images/gallery/pitch-wicket.jpg"
          alt="The pitch at Bitchet Green"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-white">About St Lawrence CC</h1>
          <p className="text-white/70 text-sm mt-1">Founded 1877 &middot; Bitchet Green, Sevenoaks</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Our Ground */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Our Ground</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            St Lawrence Cricket Club plays at Bitchet Green, a picturesque ground nestled in the village of
            Ivy Hatch, near Sevenoaks in Kent. The ground sits in the heart of the Kent countryside,
            surrounded by woodland and orchards.
          </p>

          {/* Ground photos */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image src="/images/gallery/roller.jpg" alt="Rolling the wicket" fill className="object-cover" />
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image src="/images/gallery/outfield-stripes.jpg" alt="Freshly cut outfield" fill className="object-cover" />
            </div>
          </div>

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

        {/* Club Life */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Club Life</h2>
          <p className="text-sm text-gray-600 leading-relaxed mb-4">
            More than just cricket &mdash; St Lawrence is about the friendships, the teas, and the post-match
            conversations that make village cricket special.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image src="/images/gallery/pavilion-social.jpg" alt="Players enjoying tea" fill className="object-cover" />
            </div>
            <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
              <Image src="/images/gallery/team-pavilion.jpg" alt="Team photo at the pavilion" fill className="object-cover" />
            </div>
          </div>
        </div>

        {/* The League */}
        <div className="bg-white rounded-xl p-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-3">The League</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            We compete in the Kent County Village League (KCVL), playing Saturday afternoon
            cricket throughout the summer from May to September. The league features clubs from
            across Kent, with 18 league fixtures per season.
          </p>
        </div>

        {/* Action photo strip */}
        <div className="grid grid-cols-3 gap-3">
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
            <Image src="/images/gallery/batting-trees.jpg" alt="Batting" fill className="object-cover" />
          </div>
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
            <Image src="/images/gallery/bowling-action.jpg" alt="Bowling" fill className="object-cover" />
          </div>
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden">
            <Image src="/images/gallery/batting-shot.jpg" alt="Cover drive" fill className="object-cover" />
          </div>
        </div>

        {/* 2024 Season */}
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

        {/* Team photo */}
        <div className="relative aspect-[16/9] rounded-xl overflow-hidden">
          <Image src="/images/gallery/team-away.jpg" alt="St Lawrence CC team" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4">
            <p className="text-white text-sm font-semibold drop-shadow-lg">The lads on tour</p>
          </div>
        </div>

        {/* Join Us */}
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
