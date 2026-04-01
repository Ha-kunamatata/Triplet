export default function Modal({ title, children, onClose, confirmLabel, onConfirm, danger = false }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 'var(--app-width)', padding: '20px 20px 36px', animation: 'slideUp 0.25s ease' }}
      >
        {title && <p style={{ fontSize: 17, fontWeight: 700, marginBottom: 16 }}>{title}</p>}
        {children}
        {onConfirm && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', background: 'var(--border)', fontSize: 15, fontWeight: 600, color: 'var(--text-secondary)' }}>취소</button>
            <button onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: 'var(--radius-md)', background: danger ? 'var(--error)' : 'var(--primary)', color: '#fff', fontSize: 15, fontWeight: 600 }}>{confirmLabel ?? '확인'}</button>
          </div>
        )}
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    </div>
  )
}
