import { useEffect } from 'react'

export default function Modal({ title, children, onClose, confirmLabel, onConfirm, danger = false }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, padding: '0',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-2xl) var(--r-2xl) 0 0',
          width: '100%', maxWidth: 'var(--content-max)',
          padding: '8px 20px calc(28px + env(safe-area-inset-bottom))',
          animation: 'sheetUp 0.28s var(--ease)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, background: 'var(--c-border2)', borderRadius: 'var(--r-full)', margin: '10px auto 20px', flexShrink: 0 }} />

        {title && (
          <p style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-4)', color: 'var(--c-text-1)' }}>
            {title}
          </p>
        )}

        <div>{children}</div>

        {onConfirm && (
          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--sp-5)' }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: '14px', borderRadius: 'var(--r-xl)',
                background: 'var(--c-surface2)', border: '1px solid var(--c-border)',
                fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)',
                color: 'var(--c-text-2)',
              }}
            >
              취소
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: '14px', borderRadius: 'var(--r-xl)',
                background: danger ? 'var(--c-error)' : 'var(--c-primary)',
                color: '#fff',
                fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)',
                boxShadow: danger ? '0 4px 14px rgba(239,68,68,0.35)' : 'var(--shadow-primary)',
              }}
            >
              {confirmLabel ?? '확인'}
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes sheetUp { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }`}</style>
    </div>
  )
}
