import type { Metadata } from 'next'
import {
  Libre_Caslon_Text,
  JetBrains_Mono,
  UnifrakturCook,
  Source_Serif_4,
  IBM_Plex_Mono,
  Fraunces,
  Inter_Tight,
} from 'next/font/google'
import PreviewSwitcher from './_components/PreviewSwitcher'

export const metadata: Metadata = {
  title: 'Design Candidates — St Lawrence CC',
  description: 'Internal design review. Three candidate directions for the club website refresh.',
  robots: { index: false, follow: false },
}

const libreCaslon = Libre_Caslon_Text({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-libre-caslon',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

const unifrakturCook = UnifrakturCook({
  weight: '700',
  subsets: ['latin'],
  variable: '--font-unifrakturcook',
  display: 'swap',
})

const sourceSerif = Source_Serif_4({
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
  display: 'swap',
})

const fraunces = Fraunces({
  weight: 'variable',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-fraunces',
  axes: ['opsz'],
  display: 'swap',
})

const interTight = Inter_Tight({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

export default function CandidatesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const fontVars = [
    libreCaslon.variable,
    jetbrainsMono.variable,
    unifrakturCook.variable,
    sourceSerif.variable,
    ibmPlexMono.variable,
    fraunces.variable,
    interTight.variable,
  ].join(' ')

  return (
    <div className={fontVars} style={{ isolation: 'isolate' }}>
      <PreviewSwitcher />
      {children}
    </div>
  )
}
