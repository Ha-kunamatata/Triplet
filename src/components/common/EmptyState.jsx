export default function EmptyState({ icon = 'map', title, description, action, onAction }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', gap: 12, textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-disabled)' }}>{icon}</span>
      <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</p>
      {description && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{description}</p>}
      {action && onAction && (
        <button onClick={onAction} style={{ marginTop: 8, padding: '10px 24px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontSize: 14, fontWeight: 600 }}>
          {action}
        </button>
      )}
    </div>
  )
}
