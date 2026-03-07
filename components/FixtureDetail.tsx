'use client'

import type { Fixture } from '@/lib/supabase'

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatTime(time: string | null) {
  if (!time) return ''
  return time.slice(0, 5)
}

export default function FixtureDetail({
  fixture,
  onClose,
}: {
  fixture: Fixture
  onClose: () => void
}) {
  const mapsUrl = fixture.lat && fixture.lng
    ? `https://www.google.com/maps?q=${fixture.lat},${fixture.lng}`
    : null

  const isPast = new Date(fixture.match_date + 'T23:59:59') < new Date()

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] overflow-auto border border-gray-200 shadow-2xl"
      >
        {/* Header */}
        <div className="p-5 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {formatFullDate(fixture.match_date)}
              </div>
              <div className="text-xl font-bold text-gray-900 mt-1">vs {fixture.opponent}</div>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none transition-colors p-1">
              &times;
            </button>
          </div>

          {/* Home/Away badge */}
          <div className="mt-3 flex items-center gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              fixture.home_away === 'H'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-sky-50 text-sky-700 border border-sky-200'
            }`}>
              {fixture.home_away === 'H' ? 'Home' : 'Away'}
            </span>
            {fixture.competition && (
              <span className="text-xs text-gray-400">{fixture.competition}</span>
            )}
          </div>
        </div>

        {/* Match info */}
        <div className="p-5 space-y-3">
          {/* Times */}
          <div className="flex gap-3">
            {fixture.meet_time && (
              <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Meet</div>
                <div className="text-lg font-bold text-gray-900 mt-0.5">{formatTime(fixture.meet_time)}</div>
              </div>
            )}
            {fixture.start_time && (
              <div className="flex-1 bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Start</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{formatTime(fixture.start_time)}</div>
              </div>
            )}
          </div>

          {/* Venue / Map */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">Ground</div>
            <div className="text-sm font-semibold text-gray-800">{fixture.venue}</div>
            {fixture.lat && fixture.lng && (
              <div className="mt-3 rounded-lg overflow-hidden border border-gray-200">
                <iframe
                  src={`https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${fixture.lng}!3d${fixture.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1`}
                  width="100%"
                  height="200"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map of ${fixture.venue}`}
                />
              </div>
            )}
            {mapsUrl && (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2.5 px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs font-medium text-sky-600 hover:text-sky-700 hover:border-sky-200 no-underline transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Get Directions
              </a>
            )}
          </div>

          {/* Result */}
          {fixture.result_text && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <div className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mb-1">Result</div>
              <div className="text-sm font-bold text-emerald-700">{fixture.result_text}</div>
            </div>
          )}

          {/* Key players placeholder (for when Play-Cricket API is connected) */}
          {isPast && (
            <div className="border border-dashed border-gray-200 rounded-xl p-4">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
                Key Players &middot; Last 5 Matches
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-1">vs {fixture.opponent}</div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-300 italic">Most runs &mdash; awaiting data</div>
                    <div className="text-xs text-gray-300 italic">Most wickets &mdash; awaiting data</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-1">St Lawrence CC</div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-300 italic">Most runs &mdash; awaiting data</div>
                    <div className="text-xs text-gray-300 italic">Most wickets &mdash; awaiting data</div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-300 mt-3 text-center">
                Stats populate automatically once Play-Cricket API is connected
              </div>
            </div>
          )}

          {/* Head to head placeholder for upcoming matches */}
          {!isPast && (
            <div className="border border-dashed border-gray-200 rounded-xl p-4">
              <div className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider mb-2">
                Head to Head &middot; Previous Meetings
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-1">{fixture.opponent}</div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-300 italic">Top scorer &mdash; awaiting data</div>
                    <div className="text-xs text-gray-300 italic">Top bowler &mdash; awaiting data</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-1">St Lawrence CC</div>
                  <div className="space-y-1">
                    <div className="text-xs text-gray-300 italic">Top scorer &mdash; awaiting data</div>
                    <div className="text-xs text-gray-300 italic">Top bowler &mdash; awaiting data</div>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-gray-300 mt-3 text-center">
                Historical stats appear once Play-Cricket API is connected
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
