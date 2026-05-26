export default function EmptyState({ icon = 'map', title, description, action, onAction, compact = false }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: compact ? '32px 20px' : '56px 24px',
      gap: 12, textAlign: 'center',
      animation: 'pageEnter 0.35s var(--ease) both',
    }}>
      <div style={{
        width: compact ? 64 : 80, height: compact ? 64 : 80,
        borderRadius: compact ? 18 : 24,
        background: 'linear-gradient(145deg, var(--c-primary-dim), rgba(99,102,241,0.08))',
        border: '1.5px solid var(--c-primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4, flexShrink: 0,
        animation: 'popIn 0.5s var(--ease) 0.1s both',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: compact ? 30 : 38, color: 'var(--c-primary)',
          fontVariationSettings: "'FILL' 1",
        }}>{icon}</span>
      </div>
      <p style={{ fontSize: compact ? 15 : 17, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: -0.3 }}>{title}</p>
      {description && (
        <p style={{ fontSize: compact ? 13 : 14, color: 'var(--c-text-3)', lineHeight: 1.65, maxWidth: 280 }}>{description}</p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 8, padding: '11px 24px', borderRadius: 'var(--r-full)',
            background: 'var(--c-primary)', color: '#fff',
            fontSize: 14, fontWeight: 700, boxShadow: 'var(--shadow-primary)',
            transition: 'all var(--t-base)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'var(--shadow-primary)' }}
        >
          {action}
        </button>
      )}
    </div>
  )
}
