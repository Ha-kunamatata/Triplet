import { SCHEDULE_CATEGORIES } from '../../constants'

export default function ScheduleItem({ schedule, onEdit, onDelete }) {
  if (!schedule) return null
  const cat = SCHEDULE_CATEGORIES.find(c => c.key === schedule.category)
    ?? SCHEDULE_CATEGORIES[SCHEDULE_CATEGORIES.length - 1]

  return (
    <div style={{
      display: 'flex', gap: 0,
      background: 'var(--c-surface)',
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-sm)',
      transition: 'box-shadow var(--t-fast)',
    }}>
      {/* Left accent bar */}
      <div style={{ width: 4, background: cat.color, flexShrink: 0 }} />

      {/* Category icon */}
      <div style={{
        width: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, paddingLeft: 4,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 'var(--r-sm)',
          background: cat.color + '18',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '12px 8px 12px 6px', minWidth: 0 }}>
        <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {schedule.title}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px', marginTop: 5 }}>
          {(schedule.startTime || schedule.endTime) && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>schedule</span>
              {schedule.startTime}{schedule.startTime && schedule.endTime ? ' – ' : ''}{schedule.endTime}
            </span>
          )}
          {schedule.place && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12, flexShrink: 0 }}>location_on</span>
              {schedule.place}
            </span>
          )}
        </div>

        {schedule.memo && (
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {schedule.memo}
          </p>
        )}

        {schedule.cost > 0 && (
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-primary)', marginTop: 6 }}>
            {Number(schedule.cost).toLocaleString('ko-KR')}원
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '8px 12px 8px 0', gap: 4 }}>
        <button
          onClick={onEdit}
          style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'background var(--t-fast), color var(--t-fast)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--c-primary-light)'; e.currentTarget.style.color = 'var(--c-primary)' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>edit</span>
        </button>
        <button
          onClick={onDelete}
          style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'background var(--t-fast), color var(--t-fast)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = 'var(--c-error)' }}
          onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
        </button>
      </div>
    </div>
  )
}
