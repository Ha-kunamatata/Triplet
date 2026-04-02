const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export default function DayTab({ date, dayNumber, isSelected, count, onClick }) {
  const d = new Date(date)
  const dow = WEEKDAYS[d.getDay()]
  const isWeekend = d.getDay() === 0 || d.getDay() === 6

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '10px 12px', borderRadius: 'var(--r-lg)', gap: 2,
        background: isSelected ? 'var(--c-primary)' : 'transparent',
        color: isSelected ? '#fff' : isWeekend ? '#EF4444' : 'var(--c-text-2)',
        transition: 'all var(--t-base) var(--ease)',
        minWidth: 54, flexShrink: 0,
        boxShadow: isSelected ? 'var(--shadow-primary)' : 'none',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-medium)', opacity: isSelected ? 0.8 : 0.7 }}>
        Day {dayNumber}
      </span>
      <span style={{ fontSize: 20, fontWeight: 'var(--fw-extrabold)', lineHeight: 1.1 }}>
        {d.getDate()}
      </span>
      <span style={{ fontSize: 'var(--text-xs)', fontWeight: isSelected ? 'var(--fw-medium)' : 'var(--fw-normal)' }}>
        {dow}
      </span>
      {count > 0 && (
        <span style={{
          marginTop: 2,
          background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--c-primary-dim)',
          color: isSelected ? '#fff' : 'var(--c-primary)',
          borderRadius: 'var(--r-full)', minWidth: 18, height: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-bold)', padding: '0 5px',
        }}>
          {count}
        </span>
      )}
    </button>
  )
}
