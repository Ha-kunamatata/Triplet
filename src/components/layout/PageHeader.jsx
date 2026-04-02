import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, subtitle, onBack, actions, noBorder = false }) {
  const navigate = useNavigate()

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
      padding: 'var(--sp-3) var(--sp-4)',
      minHeight: 'var(--header-h)',
      background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: noBorder ? 'none' : '1px solid var(--c-border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {onBack !== false && (
        <button
          onClick={onBack ?? (() => navigate(-1))}
          className="btn btn-ghost btn-icon"
          style={{ flexShrink: 0, marginLeft: -4 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 1 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 'var(--sp-2)', flexShrink: 0 }}>{actions}</div>}
    </header>
  )
}
