export default function LoadingSpinner({ fullScreen = false, size = 36 }) {
  const wrap = fullScreen
    ? { position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--c-bg)', zIndex: 9999 }
    : { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 0' }

  return (
    <div style={wrap}>
      <div style={{
        width: size, height: size,
        border: `3px solid var(--c-border)`,
        borderTopColor: 'var(--c-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export function TripCardSkeleton() {
  return (
    <div style={{ borderRadius: 'var(--r-2xl)', overflow: 'hidden', background: 'var(--c-surface)', border: '1px solid var(--c-border)', boxShadow: '0 1px 3px rgba(15,23,42,0.06), 0 4px 16px rgba(15,23,42,0.07)' }}>
      <div className="skeleton" style={{ height: 195 }} />
      <div style={{ padding: '10px 14px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'center' }}>
          <div className="skeleton" style={{ height: 12, width: 12, borderRadius: '50%', flexShrink: 0 }} />
          <div className="skeleton" style={{ height: 12, width: '52%', borderRadius: 6 }} />
          <div className="skeleton" style={{ height: 12, width: '14%', borderRadius: 6 }} />
        </div>
        <div className="skeleton" style={{ height: 22, width: 42, borderRadius: 999, flexShrink: 0 }} />
      </div>
    </div>
  )
}

export function ScheduleSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {[1,2,3].map(i => (
        <div key={i} className="card" style={{ padding: 16, display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ width: 4, borderRadius: 2, flexShrink: 0 }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="skeleton" style={{ height: 16, width: '60%', borderRadius: 6 }} />
            <div className="skeleton" style={{ height: 12, width: '40%', borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  )
}
