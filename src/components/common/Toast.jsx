import { useEffect, useState, useCallback } from 'react'

export default function Toast({ message, type = 'info', action, onAction, duration = 3200, onClose }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
    const t = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300)
    }, duration)
    return () => clearTimeout(t)
  }, [duration, onClose])

  function handleAction() {
    setVisible(false)
    setTimeout(() => { onAction?.(); onClose() }, 150)
  }

  const icons  = { success: 'check_circle', error: 'error', info: 'info', warning: 'warning' }
  const colors = { success: '#10B981', error: '#EF4444', info: 'var(--c-primary)', warning: '#F59E0B' }

  return (
    <>
      <div className="toast-wrap" style={{
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : '12px'})`,
        transition: 'opacity 0.25s var(--ease), transform 0.25s var(--ease)',
        background: 'var(--c-text-1)', color: '#fff',
        padding: action ? '10px 14px 10px 18px' : '13px 20px',
        borderRadius: 'var(--r-full)',
        display: 'flex', alignItems: 'center', gap: 9,
        boxShadow: '0 8px 32px rgba(15,23,42,0.24)', zIndex: 9999,
        fontSize: 'var(--text-sm)', fontWeight: 600,
        maxWidth: 'min(400px, calc(100vw - 32px))',
        letterSpacing: -0.2,
        position: 'fixed', left: '50%',
      }}>
        <span className="material-symbols-outlined" style={{
          fontSize: 18, color: colors[type], flexShrink: 0,
          fontVariationSettings: "'FILL' 1",
        }}>{icons[type] ?? icons.info}</span>
        <span style={{ flex: 1 }}>{message}</span>
        {action && (
          <button onClick={handleAction} style={{
            marginLeft: 6, padding: '5px 12px', borderRadius: 'var(--r-full)',
            background: 'rgba(255,255,255,0.2)', color: '#fff',
            fontSize: 12, fontWeight: 800, flexShrink: 0,
            border: '1px solid rgba(255,255,255,0.25)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.32)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            {action}
          </button>
        )}
      </div>
      <style>{`
        .toast-wrap {
          bottom: calc(var(--bottom-nav-h) + var(--safe-bottom) + 12px);
        }
        @media (min-width: 768px) {
          .toast-wrap { bottom: 28px; }
        }
      `}</style>
    </>
  )
}

export function useToast() {
  const [toasts, setToasts] = useState([])

  const show = useCallback((message, opts = {}) => {
    const key = Date.now()
    setToasts(prev => [...prev.slice(-1), { key, message, ...opts }])
  }, [])

  const hide = useCallback((key) => setToasts(prev => prev.filter(t => t.key !== key)), [])

  const ToastEl = toasts.map(t => (
    <Toast
      key={t.key}
      message={t.message}
      type={t.type ?? 'info'}
      action={t.action}
      onAction={t.onAction}
      duration={t.duration}
      onClose={() => hide(t.key)}
    />
  ))

  return { show, ToastEl }
}
