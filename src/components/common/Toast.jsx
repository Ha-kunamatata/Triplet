import { useEffect, useState, useCallback } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 300) }, 2800)
    return () => clearTimeout(t)
  }, [onClose])

  const icons = { success: 'check_circle', error: 'error', info: 'info' }
  const colors = { success: '#10B981', error: '#EF4444', info: 'var(--c-primary)' }

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(var(--bottom-nav-h) + 12px)', left: '50%',
      transform: `translateX(-50%) translateY(${visible ? 0 : '12px'})`,
      opacity: visible ? 1 : 0,
      transition: 'all 0.3s var(--ease)',
      background: 'var(--c-text-1)', color: '#fff',
      padding: '12px 18px', borderRadius: 'var(--r-full)',
      display: 'flex', alignItems: 'center', gap: 8,
      boxShadow: 'var(--shadow-lg)', zIndex: 9999,
      fontSize: 'var(--text-sm)', fontWeight: 500,
      maxWidth: 'min(360px, calc(100vw - 32px))',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color: colors[type], flexShrink: 0, fontVariationSettings: "'FILL' 1" }}>{icons[type]}</span>
      {message}
    </div>
  )
}

/* ── useToast hook ── */
export function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((message, type = 'info') => setToast({ message, type, key: Date.now() }), [])
  const hide = useCallback(() => setToast(null), [])
  const ToastEl = toast ? <Toast key={toast.key} message={toast.message} type={toast.type} onClose={hide} /> : null
  return { show, ToastEl }
}
