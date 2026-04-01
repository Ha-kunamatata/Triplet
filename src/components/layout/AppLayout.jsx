import BottomNav from './BottomNav'

export default function AppLayout({ children, noPadding = false }) {
  return (
    <div style={{ minHeight: '100dvh', paddingBottom: 'var(--bottom-nav-height)' }}>
      <main style={noPadding ? {} : { padding: '0 0 16px' }}>
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
