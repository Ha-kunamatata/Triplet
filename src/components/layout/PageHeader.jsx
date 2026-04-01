import { useNavigate } from 'react-router-dom'

export default function PageHeader({ title, subtitle, onBack, actions }) {
  const navigate = useNavigate()

  return (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 16px', background: '#fff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      {(onBack !== false) && (
        <button onClick={onBack ?? (() => navigate(-1))} style={{ padding: 4, marginRight: 2, color: 'var(--text-primary)', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>arrow_back</span>
        </button>
      )}
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{title}</p>
        {subtitle && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 1 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 4 }}>{actions}</div>}
    </header>
  )
}
