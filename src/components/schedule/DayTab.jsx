const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function fmtDayCost(n) {
  if (n >= 100000) return `${Math.round(n / 10000)}만`
  if (n >= 10000)  return `${(n / 10000).toFixed(1)}만`
  return `${Math.round(n / 1000)}k`
}

export default function DayTab({ date, dayNumber, isSelected, count, hasFlight, hasStay, dayCost = 0, onClick }) {
  const d = new Date(date)
  const dow = WEEKDAYS[d.getDay()]
  const isWeekend = d.getDay() === 0 || d.getDay() === 6

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: '8px 11px', borderRadius: 'var(--r-lg)', gap: 2,
        background: isSelected ? 'var(--c-primary)' : 'transparent',
        color: isSelected ? '#fff' : isWeekend ? '#EF4444' : 'var(--c-text-2)',
        transition: 'all var(--t-base) var(--ease)',
        minWidth: 52, flexShrink: 0,
        boxShadow: isSelected ? 'var(--shadow-primary)' : 'none',
        transform: isSelected ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <span style={{ fontSize: 10, fontWeight: 600, opacity: isSelected ? 0.85 : 0.65 }}>
        Day {dayNumber}
      </span>
      <span style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.1 }}>
        {d.getDate()}
      </span>
      <span style={{ fontSize: 10, fontWeight: isSelected ? 600 : 400 }}>
        {dow}
      </span>

      {/* 일비용 */}
      {dayCost > 0 && (
        <span style={{ fontSize: 9, fontWeight: 700, color: isSelected ? 'rgba(255,255,255,0.78)' : '#F97316', lineHeight: 1, marginTop: 1 }}>
          {fmtDayCost(dayCost)}
        </span>
      )}

      {/* 아이콘 배지 행 */}
      <div style={{ display: 'flex', gap: 2, marginTop: 1, minHeight: 14, alignItems: 'center' }}>
        {hasFlight && (
          <span style={{ fontSize: 11, lineHeight: 1 }} title="항공편">✈️</span>
        )}
        {hasStay && (
          <span style={{ fontSize: 11, lineHeight: 1 }} title="숙소">🏨</span>
        )}
        {count > 0 && !hasFlight && !hasStay && (
          <span style={{
            background: isSelected ? 'rgba(255,255,255,0.28)' : 'var(--c-primary-dim)',
            color: isSelected ? '#fff' : 'var(--c-primary)',
            borderRadius: 'var(--r-full)', minWidth: 17, height: 17,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, padding: '0 4px',
          }}>
            {count}
          </span>
        )}
        {count > 0 && (hasFlight || hasStay) && (
          <span style={{
            background: isSelected ? 'rgba(255,255,255,0.28)' : 'var(--c-primary-dim)',
            color: isSelected ? '#fff' : 'var(--c-primary)',
            borderRadius: 'var(--r-full)', minWidth: 15, height: 15,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 700, padding: '0 3px',
          }}>
            {count}
          </span>
        )}
      </div>
    </button>
  )
}
