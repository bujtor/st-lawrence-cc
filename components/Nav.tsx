'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const links = [
  { href: '/', label: 'Home' },
  { href: '/availability', label: 'Availability' },
  { href: '/fixtures', label: 'Fixtures' },
  { href: '/table', label: 'Table' },
  { href: '/stats', label: 'Stats' },
  { href: '/about', label: 'About' },
]

export default function Nav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-sm font-extrabold text-white shadow-sm">
            SL
          </div>
          <div>
            <div className="text-sm font-extrabold text-gray-900 leading-tight">St Lawrence CC</div>
            <div className="text-[10px] text-gray-400 font-medium leading-tight">Bitchet Green, Sevenoaks</div>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                pathname === href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-500 hover:text-gray-800"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-3 pt-1">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2 rounded-lg text-sm font-medium no-underline transition-colors ${
                pathname === href
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
