import CNav from './_components/CNav'
import CFooter from './_components/CFooter'
import { C_CREAM, C_INK, sansTight } from './_theme/tokens'

export default function CCandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: C_CREAM,
        color: C_INK,
        fontFamily: sansTight,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CNav />
      <main style={{ flex: 1 }}>{children}</main>
      <CFooter />
    </div>
  )
}
