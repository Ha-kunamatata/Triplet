import { useEffect, useState, useCallback } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 2800)
    return () => clearTimeout(t)
  }, [onClose])

  const icons  = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' }
  const colors = { success: '#10B981', error: '#EF4444', info: 'var(--c-primary)', warning: '#F59E0B' }

  return (
    <>
      <div className="toast-wrap" style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : '8px'})`,
        transition: 'all 0.3s var(--ease)',
        background: 'var(--c-text-1)', color: '#fff',
        padding: '13px 20px', borderRadius: 'var(--r-full)',
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: 'var(--shadow-lg)', zIndex: 9999,
        fontSize: 'var(--text-sm)', fontWeight: 600,
        maxWidth: 'min(380px, calc(100vw - 32px))',
        letterSpacing: -0.2,
        pointerEvents: 'none',
        position: 'fixed',
        left: '50%',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 18, color: colors[type], flexShrink: 0,
          fontVariationSettings: "'FILL' 1",
        }}>{icons[type] ?? icons.info}</span>
        {message}
      </div>
      <style>{`
        .toast-wrap {
          bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + 12px);
        }
        @media (min-width: 768px) {
          .toast-wrap {
            bottom: 28px;
          }
        }
      `}</style>
    </>
  )
}

export function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((message, type = 'info') => setToast({ message, type, key: Date.now() }), [])
  const hide = useCallback(() => setToast(null), [])
  const ToastEl = toast ? <Toast key={toast.key} message={toast.message} type={toast.type} onClose={hide} /> : null
  return { show, ToastEl }
}
