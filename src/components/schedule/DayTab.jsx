import { formatShortDate } from '../../utils/dateUtils'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function DayTab({ date, dayNumber, isSelected, count, onClick }) {
  const d = new Date(date)
  const dow = WEEKDAYS[d.getDay()]

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 14px', borderRadius: 'var(--radius-md)', gap: 2,
        background: isSelected ? 'var(--primary)' : 'transparent',
        color: isSelected ? '#fff' : 'var(--text-secondary)',
        transition: 'all 0.15s', minWidth: 58, flexShrink: 0,
      }}
    >
      <span style={{ fontSize: 11, fontWeight: 500, opacity: isSelected ? 0.85 : 1 }}>Day {dayNumber}</span>
      <span style={{ fontSize: 18, fontWeight: 700 }}>{d.getDate()}</span>
      <span style={{ fontSize: 11 }}>{dow}</span>
      {count > 0 && (
        <span style={{
          marginTop: 2, background: isSelected ? 'rgba(255,255,255,0.3)' : 'var(--border)',
          color: isSelected ? '#fff' : 'var(--text-secondary)',
          borderRadius: 'var(--radius-full)', minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 600, padding: '0 5px',
        }}>{count}</span>
      )}
    </button>
  )
}
