import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact — St Lawrence CC',
  description: 'Get in touch with St Lawrence Cricket Club — new players, sponsors, fixtures.',
}

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">Get in touch</h1>
        <p className="text-sm text-gray-500 mt-2 max-w-prose">
          Want to play, sponsor a fixture, or ask about the club? Drop us a note and we&rsquo;ll
          come back to you. Captain Paul Smith picks these up directly.
        </p>
      </div>

      <ContactForm />

      <div className="mt-10 pt-6 border-t border-gray-100 text-sm text-gray-500 space-y-1">
        <div>
          Or call <a href="tel:07783596582" className="text-emerald-700 font-semibold no-underline hover:text-emerald-800">07783 596 582</a>
        </div>
        <div>
          Find us at Bitchet Green, Sevenoaks, Kent, TN15 0NB
        </div>
      </div>
    </div>
  )
}
