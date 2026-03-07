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

const heroImages = [
  '/images/gallery/hero-ground.jpg',
  '/images/gallery/hero-batting-hedge.jpg',
  '/images/gallery/hero-big-hit.jpg',
  '/images/gallery/hero-batting-cottage.jpg',
]

export const dynamic = 'force-dynamic'

export default async function Home() {
  const heroImage = heroImages[Math.floor(Math.random() * heroImages.length)]
  const today = new Date().toISOString().split('T')[0]
  const { data: nextFixtures } = await supabase
    .from('fixtures')
    .select('*')
    .gte('match_date', today)
    .order('match_date', { ascending: true })
    .limit(1)

  const nextFixture = nextFixtures?.[0]

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
      {/* Hero with real ground photo */}
      <div className="relative h-[420px] md:h-[480px] overflow-hidden">
        <Image
          src={heroImage}
          alt="Cricket at Bitchet Green"
          fill
          className="object-cover object-top"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/10" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-4 w-full flex flex-col md:flex-row items-center md:items-end md:justify-between gap-6">
            {/* Logo + subtitle - left/center */}
            <div className="text-center md:text-left">
              <Image
                src="/images/badge.png"
                alt="St Lawrence Cricket Club"
                width={320}
                height={180}
                className="invert w-auto max-h-24 md:max-h-32 mb-3 drop-shadow-2xl mx-auto md:mx-0"
                priority
              />
              <p className="text-white/70 text-sm font-light tracking-wide">Bitchet Green, Ivy Hatch, Sevenoaks, Kent</p>
              <p className="text-white/40 text-xs mt-0.5">Kent County Village League &middot; Est. 1877</p>
            </div>

            {/* Next match + last result - right side overlay */}
            <div className="flex flex-col gap-2.5 w-full md:w-auto md:max-w-xs">
              {nextFixture && (
                <Link href="/fixtures" className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 no-underline hover:bg-white/15 transition-colors">
                  <div className="text-[10px] text-emerald-400 font-semibold uppercase tracking-widest mb-1.5">Next Match</div>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-base font-bold text-white">vs {nextFixture.opponent}</div>
                      <div className="text-xs text-white/60 mt-0.5">{formatDate(nextFixture.match_date)} &middot; {nextFixture.venue}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        nextFixture.home_away === 'H' ? 'bg-emerald-500/30 text-emerald-300' : 'bg-sky-500/30 text-sky-300'
                      }`}>
                        {nextFixture.home_away === 'H' ? 'Home' : 'Away'}
                      </span>
                      <div className="text-lg font-bold text-white mt-1">{nextFixture.start_time?.slice(0, 5)}</div>
                    </div>
                  </div>
                </Link>
              )}
              {lastResult && (
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-3 border border-white/20">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-[10px] text-white/40 font-semibold uppercase tracking-widest">Last Result</div>
                      <div className="text-sm font-semibold text-white mt-0.5">vs {lastResult.opponent}</div>
                    </div>
                    <div className="text-xs font-medium text-emerald-400 text-right">{lastResult.result_text}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sponsors - just below hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {sponsors.map((s) => (
              <div key={s.name} className="grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all">
                <Image
                  src={`/images/sponsors/${s.file}`}
                  alt={s.name}
                  width={100}
                  height={50}
                  className="object-contain max-h-[32px] w-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* The Saints Want You - recruitment banner */}
      <div className="relative overflow-hidden bg-gray-900">
        <Image
          src="/images/gallery/team-pavilion.jpg"
          alt="St Lawrence CC team"
          fill
          className="object-cover opacity-30"
        />
        <div className="relative max-w-5xl mx-auto px-4 py-8 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              The Saints Want You!
            </h2>
            <p className="text-white/70 text-sm md:text-base mt-2 max-w-xl">
              Interested in village cricket? We&apos;re a friendly social club founded in 1877. Cricket should be fun and enjoyed by all &mdash; new players welcome regardless of age or ability.
            </p>
          </div>
          <div className="flex flex-col items-center md:items-end gap-2 flex-shrink-0">
            <a
              href="mailto:pmsmith31@icloud.com"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3 rounded-lg no-underline transition-colors shadow-lg"
            >
              Get in Touch
            </a>
            <a href="tel:07783596582" className="text-white/50 hover:text-white/80 text-xs no-underline transition-colors">
              or call 07783 596582
            </a>
          </div>
        </div>
      </div>

      {/* Photo strip */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image src="/images/gallery/batting-shot.jpg" alt="Batting at St Lawrence" fill className="object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image src="/images/gallery/bowling-action.jpg" alt="Bowling action" fill className="object-cover hover:scale-105 transition-transform duration-500" />
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden">
            <Image src="/images/gallery/pavilion-social.jpg" alt="Tea break at the pavilion" fill className="object-cover hover:scale-105 transition-transform duration-500" />
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
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
