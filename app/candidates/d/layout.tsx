import Nav from './_components/Nav'

export default function CandidateDLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div style={{ background: '#fff', color: '#1f2937' }}>
      <Nav />
      <main>{children}</main>
    </div>
  )
}
