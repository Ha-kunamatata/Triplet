import { useEffect, useRef, useState } from 'react'

export default function Modal({ title, children, onClose, confirmLabel, onConfirm, danger = false }) {
  const firstBtnRef = useRef(null)
  const [closing, setClosing] = useState(false)

  function handleClose() {
    setClosing(true)
    setTimeout(onClose, 240)
  }

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    firstBtnRef.current?.focus()

    function onKeyDown(e) {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeyDown)
    }
  }, []) // eslint-disable-line

  return (
    <div
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(15,23,42,0.55)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        zIndex: 1000, padding: '0',
        animation: closing ? 'fadeOut 0.24s var(--ease) both' : 'fadeIn 0.2s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--c-surface)',
          borderRadius: 'var(--r-2xl) var(--r-2xl) 0 0',
          width: '100%', maxWidth: 'var(--content-max)',
          padding: '8px 20px calc(28px + env(safe-area-inset-bottom))',
          animation: closing ? 'sheetDown 0.24s var(--ease) both' : 'sheetUp 0.28s var(--ease)',
          boxShadow: 'var(--shadow-xl)',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 36, height: 4, background: 'var(--c-border2)', borderRadius: 'var(--r-full)', margin: '10px auto 20px', flexShrink: 0 }} />

        {title && (
          <p id="modal-title" style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)', marginBottom: 'var(--sp-4)', color: 'var(--c-text-1)' }}>
            {title}
          </p>
        )}

        <div>{children}</div>

        {onConfirm && (
          <div style={{ display: 'flex', gap: 10, marginTop: 'var(--sp-5)' }}>
            <button
              ref={firstBtnRef}
              onClick={handleClose}
              style={{
                flex: 1, padding: '14px', borderRadius: 'var(--r-xl)',
                background: 'var(--c-surface2)', border: '1px solid var(--c-border)',
                fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)',
                color: 'var(--c-text-2)', transition: 'background var(--t-fast)',
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
                transition: 'all var(--t-fast)',
              }}
            >
              {confirmLabel ?? '확인'}
            </button>
          </div>
        )}
      </div>
      <style>{`
        @keyframes sheetUp   { from { transform: translateY(100%); opacity:0; } to { transform: translateY(0); opacity:1; } }
        @keyframes sheetDown { from { transform: translateY(0); } to { transform: translateY(105%); } }
        @media (min-width: 768px) {
          [role="dialog"] { align-items: center !important; padding: 20px !important; }
          [role="dialog"] > div { border-radius: var(--r-2xl) !important; max-width: 480px !important; }
        }
      `}</style>
    </div>
  )
}
