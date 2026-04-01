import { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2800)
    return () => clearTimeout(t)
  }, [onClose])

  const bg = type === 'error' ? '#EF4444' : type === 'success' ? '#22C55E' : '#1F2937'

  return (
    <div style={{
      position: 'fixed', bottom: 80, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff', padding: '12px 20px', borderRadius: 'var(--radius-full)',
      fontSize: 14, fontWeight: 500, zIndex: 9999, whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-lg)', animation: 'fadeUp 0.2s ease',
    }}>
      {message}
      <style>{`@keyframes fadeUp { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }`}</style>
    </div>
  )
}
