export default function EmptyState({ icon = 'map', title, description, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '56px 24px', gap: 14, textAlign: 'center',
      animation: 'pageEnter 0.35s var(--ease) both',
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 24,
        background: 'linear-gradient(135deg, var(--c-primary-dim), rgba(59,130,246,0.06))',
        border: '1.5px solid var(--c-primary-dim)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 4,
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 40, color: 'var(--c-primary)', fontVariationSettings: "'FILL' 1",
        }}>{icon}</span>
      </div>
      <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--c-text-1)', letterSpacing: -0.3 }}>{title}</p>
      {description && (
        <p style={{ fontSize: 14, color: 'var(--c-text-3)', lineHeight: 1.65, maxWidth: 260 }}>{description}</p>
      )}
      {action && onAction && (
        <button
          onClick={onAction}
          className="btn btn-primary"
          style={{ marginTop: 8 }}
        >
          {action}
        </button>
      )}
    </div>
  )
}
