import { SCHEDULE_CATEGORIES } from '../../constants'

export default function ScheduleItem({ schedule, onEdit, onDelete }) {
  const cat = SCHEDULE_CATEGORIES.find(c => c.key === schedule.category) ?? SCHEDULE_CATEGORIES.at(-1)

  return (
    <div style={{
      display: 'flex', gap: 12, background: '#fff', borderRadius: 'var(--radius-md)',
      overflow: 'hidden', boxShadow: 'var(--shadow-sm)',
    }}>
      {/* 카테고리 컬러바 */}
      <div style={{ width: 4, background: cat.color, flexShrink: 0 }} />

      <div style={{ flex: 1, padding: '12px 0 12px' }}>
        {/* 제목 + 카테고리 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: cat.color }}>{cat.icon}</span>
          <span style={{ fontSize: 15, fontWeight: 600 }}>{schedule.title}</span>
        </div>

        {/* 시간 */}
        {(schedule.startTime || schedule.endTime) && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
            {schedule.startTime}{schedule.startTime && schedule.endTime ? ' - ' : ''}{schedule.endTime}
          </p>
        )}

        {/* 장소 */}
        {schedule.place && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>
            {schedule.place}
          </p>
        )}

        {/* 메모 */}
        {schedule.memo && (
          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 3, fontStyle: 'italic' }}>
            {schedule.memo}
          </p>
        )}

        {/* 비용 */}
        {schedule.cost > 0 && (
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginTop: 4 }}>
            {Number(schedule.cost).toLocaleString('ko-KR')}원
          </p>
        )}
      </div>

      {/* 액션 버튼 */}
      <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 12px 8px 0', gap: 4 }}>
        <button onClick={onEdit} style={{ padding: 4, color: 'var(--text-secondary)', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>edit</span>
        </button>
        <button onClick={onDelete} style={{ padding: 4, color: 'var(--text-disabled)', display: 'flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>
    </div>
  )
}
