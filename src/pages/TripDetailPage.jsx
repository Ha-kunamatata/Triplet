import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getTrip, getSchedules, deleteTrip, deleteSchedule, updateChecklist, getTripItems, deleteTripItem, updateTripBudgetData } from '../firebase/firestore'
import { generateDateRange, formatDisplayDate, formatShortDate, getDDay, calcTripStatus } from '../utils/dateUtils'
import { getItemSortTime } from '../utils/tripItemUtils'
import DayTab from '../components/schedule/DayTab'
import TripMap from '../components/maps/TripMap'
import { ScheduleSkeleton } from '../components/common/LoadingSpinner'
import EmptyState from '../components/common/EmptyState'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'
import { SCHEDULE_CATEGORIES, TRIP_STATUS, CHECKLIST_CATEGORIES, DEFAULT_CHECKLIST, ITEM_TYPES, ITEM_TYPE_META, TRANSPORT_MODES } from '../constants'
import { formatDuration, getFlightDuration } from '../utils/timezoneUtils'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export default function TripDetailPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [trip, setTrip] = useState(null)
  const [schedules, setSchedules] = useState([])
  const [tripItems, setTripItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(null)
  // viewMode는 URL ?view= 파라미터와 동기화 (하단 탭바에서 전환 가능)
  const viewMode = searchParams.get('view') || 'timeline'
  const setViewMode = useCallback(
    (mode) => setSearchParams({ view: mode }, { replace: true }),
    [setSearchParams],
  )
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [checklist, setChecklist] = useState([])
  const [newItem, setNewItem] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [budget, setBudget] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    Promise.allSettled([getTrip(tripId), getSchedules(tripId), getTripItems(tripId)])
      .then(([tRes, sRes, iRes]) => {
        const t = tRes.status === 'fulfilled' ? tRes.value : null
        const s = sRes.status === 'fulfilled' ? sRes.value : []
        const items = iRes.status === 'fulfilled' ? iRes.value : []
        setTrip(t)
        setSchedules(s)
        setTripItems(items)
        if (t) {
          setSelectedDate(t.startDate)
          setChecklist(t.checklist ?? DEFAULT_CHECKLIST)
          setBudget(t.budget ?? 0)
          setExpenses(t.expenses ?? [])
        }
      })
      .finally(() => setLoading(false))
  }, [tripId])

  const handleDragEnd = useCallback(async ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    setSchedules(prev => {
      const date = prev.find(s => s.id === active.id)?.date
      const dayItems = prev.filter(s => s.date === date)
      const rest = prev.filter(s => s.date !== date)
      const oldIdx = dayItems.findIndex(s => s.id === active.id)
      const newIdx = dayItems.findIndex(s => s.id === over.id)
      return [...rest, ...arrayMove(dayItems, oldIdx, newIdx)]
    })
  }, [])

  const toggleCheck = useCallback(async (id) => {
    const next = checklist.map(item => item.id === id ? { ...item, checked: !item.checked } : item)
    setChecklist(next)
    await updateChecklist(tripId, next)
  }, [checklist, tripId])

  const addCheckItem = useCallback(async () => {
    if (!newItem.trim()) return
    const item = { id: `custom_${Date.now()}`, label: newItem.trim(), category: 'custom', checked: false }
    const next = [...checklist, item]
    setChecklist(next)
    setNewItem('')
    await updateChecklist(tripId, next)
  }, [newItem, checklist, tripId])

  const removeCheckItem = useCallback(async (id) => {
    const next = checklist.filter(item => item.id !== id)
    setChecklist(next)
    await updateChecklist(tripId, next)
  }, [checklist, tripId])

  if (loading) return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <div style={{ height: 270, background: 'linear-gradient(135deg,#93C5FD,#3B82F6)' }} />
      <div style={{ padding: '16px' }}><ScheduleSkeleton /></div>
    </div>
  )

  if (!trip) return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 }}>
      <span style={{ fontSize: 56 }}>😕</span>
      <p style={{ fontSize: 'var(--text-base)', color: 'var(--c-text-2)', fontWeight: 600 }}>여행을 찾을 수 없습니다</p>
      <button onClick={() => navigate('/')} style={{ padding: '11px 24px', background: 'var(--c-primary)', color: '#fff', borderRadius: 'var(--r-full)', fontWeight: 700, boxShadow: 'var(--shadow-primary)' }}>
        홈으로 돌아가기
      </button>
    </div>
  )

  const dates = generateDateRange(trip.startDate, trip.endDate)
  // 검색 필터 적용
  const q = searchQuery.toLowerCase().trim()
  const daySchedules = schedules
    .filter(s => s.date === selectedDate)
    .filter(s => !q || (s.title ?? '').toLowerCase().includes(q))
  const dayTripItems = tripItems
    .filter(item => item.date === selectedDate)
    .filter(item => !q || [item.title, item.name, item.flightNumber, item.fromName].some(v => v?.toLowerCase().includes(q)))
    .sort((a, b) => getItemSortTime(a).localeCompare(getItemSortTime(b)))
  const totalCost = [
    ...schedules.map(s => Number(s.cost) || 0),
    ...tripItems.map(i => Number(i.cost) || 0),
  ].reduce((sum, c) => sum + c, 0)
  const totalItemCount = schedules.length + tripItems.length
  const status = calcTripStatus(trip.startDate, trip.endDate)
  const statusInfo = TRIP_STATUS[status]
  const [bg1, bg2] = getCoverGradient(trip.emoji)

  async function handleDeleteSchedule(id) {
    await deleteSchedule(id)
    setSchedules(prev => prev.filter(s => s.id !== id))
    setToast({ message: '일정이 삭제되었습니다.' })
  }

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)', paddingBottom: 100 }}>

      {/* ══ Hero ══ */}
      <div style={{ height: 270, background: `linear-gradient(160deg,${bg1},${bg2})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -50, right: -50, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', bottom: -30, left: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-55%)', fontSize: 120, opacity: 0.18, filter: 'blur(2px)', userSelect: 'none', pointerEvents: 'none' }}>
          {trip.emoji || '✈️'}
        </div>

        {/* Floating nav */}
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top,0px) + 14px)', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 16px', zIndex: 10 }}>
          <button onClick={() => navigate(-1)} style={floatBtn}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>arrow_back</span>
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate(`/trips/${tripId}/diary`)} style={{ ...floatBtn, width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600, gap: 5, display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>book</span>일기
            </button>
            <button onClick={() => setShowDeleteModal(true)} style={floatBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>more_vert</span>
            </button>
          </div>
        </div>

        {/* Trip info overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.62),transparent)', padding: '44px 20px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>{trip.destination}
              </p>
              <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 800, lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.title}</h1>
              <p style={{ color: 'rgba(255,255,255,0.80)', fontSize: 12, marginTop: 6, display: 'flex', gap: 10 }}>
                <span>📅 {formatShortDate(trip.startDate)} – {formatShortDate(trip.endDate)}</span>
                <span>· {dates.length}일</span>
              </p>
            </div>
            <span style={{ flexShrink: 0, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', padding: '5px 14px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 700 }}>
              {status === 'upcoming' ? getDDay(trip.startDate) : statusInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* ══ Stats ══ */}
      <div style={{ background: 'var(--c-surface)', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--c-border)' }}>
        <StatItem icon="calendar_today" label="기간" value={`${dates.length}일`} color="var(--c-primary)" />
        <StatItem icon="checklist" label="일정" value={`${totalItemCount}개`} color="#A78BFA" divider />
        <StatItem icon="payments" label="예산" value={totalCost > 0 ? fmtCost(totalCost) : '-'} color="#F97316" divider />
      </div>

      {/* ══ Day tabs (sticky) ══ */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ display: 'flex', overflowX: 'auto', padding: '8px 8px', gap: 2, scrollbarWidth: 'none' }}>
          {dates.map((date, i) => {
            const dayItemCount = schedules.filter(s => s.date === date).length
              + tripItems.filter(it => it.date === date).length
            const hasFlight = tripItems.some(it => it.type === ITEM_TYPES.FLIGHT && it.date === date)
            const hasStay   = tripItems.some(it => it.type === ITEM_TYPES.STAY   && (it.checkIn === date || it.checkOut === date))
            return (
              <DayTab key={date} date={date} dayNumber={i + 1}
                isSelected={selectedDate === date}
                count={dayItemCount}
                hasFlight={hasFlight}
                hasStay={hasStay}
                onClick={() => setSelectedDate(date)}
              />
            )
          })}
        </div>

        {/* View mode tabs + 검색 */}
        <div style={{ display: 'flex', borderTop: '1px solid var(--c-border)', padding: '0 12px 0 20px', alignItems: 'center' }}>
          <ViewTab label="일정" icon="view_timeline" active={viewMode === 'timeline'} onClick={() => { setViewMode('timeline'); setShowSearch(false) }} />
          <ViewTab label="지도" icon="map" active={viewMode === 'map'} onClick={() => { setViewMode('map'); setShowSearch(false) }} />
          <ViewTab label={`체크 ${checklist.filter(i=>i.checked).length}/${checklist.length}`} icon="checklist" active={viewMode === 'checklist'} onClick={() => { setViewMode('checklist'); setShowSearch(false) }} />
          <ViewTab label="예산" icon="payments" active={viewMode === 'budget'} onClick={() => { setViewMode('budget'); setShowSearch(false) }} />
          <div style={{ marginLeft: 'auto' }}>
            <button onClick={() => { setShowSearch(p => !p); setSearchQuery('') }}
              style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: showSearch ? 'var(--c-primary)' : 'var(--c-text-3)', background: showSearch ? 'var(--c-primary-light)' : 'transparent', transition: 'all 0.15s' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>search</span>
            </button>
          </div>
        </div>
        {showSearch && (
          <div style={{ padding: '8px 16px 10px', borderTop: '1px solid var(--c-border)' }}>
            <div style={{ position: 'relative' }}>
              <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 16, color: 'var(--c-text-3)' }}>search</span>
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="일정 이름, 장소 검색..."
                style={{ width: '100%', height: 38, paddingLeft: 36, paddingRight: 36, border: '1.5px solid var(--c-primary)', borderRadius: 10, fontSize: 14, background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--c-text-3)', display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ══ Content ══ */}
      {viewMode === 'timeline' ? (
        <>
          {selectedDate && (() => {
            const dayCost = [
              ...daySchedules.map(s => Number(s.cost) || 0),
              ...dayTripItems.map(i => Number(i.cost) || 0),
            ].reduce((a, b) => a + b, 0)
            const dayTotal = daySchedules.length + dayTripItems.length
            return (
              <div style={{ padding: '12px 18px 6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--c-border)' }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>{formatDisplayDate(selectedDate)}</p>
                  <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 2 }}>
                    {dayTotal > 0 ? `일정 ${dayTotal}개` : '일정 없음'}
                    {dayCost > 0 && <span style={{ color: 'var(--c-primary)', fontWeight: 700 }}> · {fmtCost(dayCost)}</span>}
                  </p>
                </div>
                {daySchedules.length > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 12 }}>drag_indicator</span>길게 눌러 순서 변경
                  </p>
                )}
              </div>
            )
          })()}

          {/* 새 tripItems (항공편, 숙소, 이동 등) */}
          {dayTripItems.length > 0 && (
            <div style={{ padding: '0 14px 4px' }}>
              {dayTripItems.map(item => (
                <TripItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => navigate(`/trips/${tripId}/item/${item.id}/edit`)}
                  onDelete={async () => {
                    await deleteTripItem(item.id)
                    setTripItems(prev => prev.filter(i => i.id !== item.id))
                    setToast({ message: '삭제되었습니다.' })
                  }}
                />
              ))}
            </div>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={daySchedules.map(s => s.id)} strategy={verticalListSortingStrategy}>
              <div style={{ padding: '4px 14px 16px' }}>
                {daySchedules.length === 0 && dayTripItems.length === 0 ? (
                  <EmptyState icon="event_note" title="이 날의 일정이 없어요" description="+ 버튼으로 일정을 추가해보세요" />
                ) : (
                  daySchedules.map((s, idx) => (
                    <SortableTimelineItem
                      key={s.id} schedule={s} isLast={idx === daySchedules.length - 1}
                      onEdit={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
                      onDelete={() => handleDeleteSchedule(s.id)}
                      isDragging={activeId === s.id}
                    />
                  ))
                )}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeId ? (() => {
                const s = daySchedules.find(x => x.id === activeId)
                return s ? <TimelineItem schedule={s} isLast isDragging /> : null
              })() : null}
            </DragOverlay>
          </DndContext>
        </>
      ) : viewMode === 'budget' ? (
        <BudgetView
          budget={budget}
          expenses={expenses}
          onSave={async (newBudget, newExpenses) => {
            setBudget(newBudget)
            setExpenses(newExpenses)
            await updateTripBudgetData(tripId, { budget: newBudget, expenses: newExpenses })
            setToast({ message: '저장되었습니다.' })
          }}
        />
      ) : viewMode === 'checklist' ? (
        <ChecklistView
          checklist={checklist}
          newItem={newItem}
          onNewItemChange={setNewItem}
          onAdd={addCheckItem}
          onToggle={toggleCheck}
          onRemove={removeCheckItem}
        />
      ) : (
        <>
          {/* Map view */}
          <TripMap
            schedules={[
              ...daySchedules,
              ...dayTripItems.filter(i => i.lat && i.lng).map(i => ({
                id: i.id, title: i.title || i.name || i.flightNumber,
                lat: i.lat, lng: i.lng,
                category: i.type === 'STAY' ? 'accommodation' : 'attraction',
              })),
            ]}
            height={380}
          />

          {/* Schedule chip list below map */}
          {daySchedules.length > 0 && (
            <div style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
              <p style={{ padding: '12px 16px 4px', fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-3)' }}>
                {formatDisplayDate(selectedDate)} · {daySchedules.length}개 일정
              </p>
              <div style={{ display: 'flex', gap: 8, padding: '6px 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {daySchedules.map((s, idx) => {
                  const cat = SCHEDULE_CATEGORIES.find(c => c.key === s.category) ?? SCHEDULE_CATEGORIES.at(-1)
                  return (
                    <div key={s.id} style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--c-surface2)', border: `1.5px solid ${cat.color}30`, borderRadius: 'var(--r-xl)', padding: '8px 14px', cursor: 'pointer', transition: 'all var(--t-fast)' }}
                      onClick={() => navigate(`/trips/${tripId}/schedule/${s.id}/edit`)}
                    >
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: cat.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', whiteSpace: 'nowrap' }}>{s.title}</p>
                        {s.startTime && <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{s.startTime}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {daySchedules.length === 0 && (
            <EmptyState icon="event_note" title="이 날의 일정이 없어요" description="+ 버튼으로 일정을 추가해보세요" />
          )}
        </>
      )}

      {/* ══ FAB ══ */}
      <button
        onClick={() => navigate(`/trips/${tripId}/item/add`, { state: { date: selectedDate } })}
        style={{ position: 'fixed', bottom: 'calc(env(safe-area-inset-bottom,0px) + 88px)', right: 20, width: 56, height: 56, borderRadius: '50%', background: 'var(--c-primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px rgba(59,130,246,0.45)', zIndex: 50, transition: 'transform var(--t-fast),box-shadow var(--t-fast)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 10px 28px rgba(59,130,246,0.55)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.45)' }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 28 }}>add</span>
      </button>

      {/* ══ Modals ══ */}
      {showDeleteModal && (
        <Modal title="여행을 삭제할까요?" onClose={() => setShowDeleteModal(false)} confirmLabel="삭제" onConfirm={async () => { await deleteTrip(tripId); navigate('/', { replace: true }) }} danger>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)', lineHeight: 1.7 }}>
            <strong>'{trip.title}'</strong> 여행과 모든 일정, 일기가 삭제됩니다.<br />이 작업은 되돌릴 수 없습니다.
          </p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} onClose={() => setToast(null)} />}
    </div>
  )
}

/* ── TripItemCard: 새 타입별 카드 ── */

function TripItemCard({ item, onEdit, onDelete }) {
  const meta = ITEM_TYPE_META[item.type] ?? ITEM_TYPE_META[ITEM_TYPES.PLACE]
  const accent = meta.color

  function renderContent() {
    switch (item.type) {
      case ITEM_TYPES.FLIGHT: {
        const dur = getFlightDuration(item.departureTime, item.arrivalTime, item.departureTZ, item.arrivalTZ)
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--c-text-1)', lineHeight: 1 }}>{item.departureAirport || '???'}</p>
                <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{item.departureTime?.slice(11, 16)}</p>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 4 }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--c-border2)' }} />
                  <span className="material-symbols-outlined" style={{ fontSize: 18, color: accent, fontVariationSettings: "'FILL' 1" }}>flight</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--c-border2)' }} />
                </div>
                {dur && <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{formatDuration(dur)}</p>}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--c-text-1)', lineHeight: 1 }}>{item.arrivalAirport || '???'}</p>
                <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{item.arrivalTime?.slice(11, 16)}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
              {item.flightNumber && <Chip icon="confirmation_number" text={item.flightNumber} color={accent} />}
              {item.seatNumber && <Chip icon="airline_seat_recline_normal" text={item.seatNumber} color={accent} />}
              {item.terminal && <Chip icon="terminal" text={`터미널 ${item.terminal}`} color={accent} />}
              {item.bookingRef && (
                <button onClick={() => navigator.clipboard?.writeText(item.bookingRef)}
                  style={{ fontSize: 11, color: accent, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>content_copy</span>
                  {item.bookingRef}
                </button>
              )}
            </div>
          </div>
        )
      }
      case ITEM_TYPES.STAY: {
        return (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>체크인</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>{item.checkIn} {item.checkInTime && <span style={{ color: accent }}>· {item.checkInTime}</span>}</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--c-border2)', alignSelf: 'center' }}>arrow_forward</span>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>체크아웃</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>{item.checkOut} {item.checkOutTime && <span style={{ color: accent }}>· {item.checkOutTime}</span>}</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
              {item.address && <Chip icon="location_on" text={item.address} color={accent} />}
              {item.bookingRef && (
                <button onClick={() => navigator.clipboard?.writeText(item.bookingRef)}
                  style={{ fontSize: 11, color: accent, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 12 }}>content_copy</span>
                  {item.bookingRef}
                </button>
              )}
            </div>
          </div>
        )
      }
      case ITEM_TYPES.TRANSPORT: {
        const mode = TRANSPORT_MODES.find(m => m.key === item.mode)
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: accent, fontVariationSettings: "'FILL' 1" }}>{mode?.icon || 'directions_car'}</span>
              <p style={{ fontSize: 13, color: 'var(--c-text-2)' }}>{mode?.label}</p>
              {item.departureTime && <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginLeft: 'auto' }}>{item.departureTime.slice(11, 16)}</p>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)' }}>{item.fromName}</p>
              <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--c-text-3)' }}>arrow_forward</span>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)' }}>{item.toName}</p>
            </div>
          </div>
        )
      }
      case ITEM_TYPES.MEMO: {
        return (
          <div>
            {item.content && (
              <p style={{ fontSize: 13, color: 'var(--c-text-2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {item.content}
              </p>
            )}
          </div>
        )
      }
      default: return null
    }
  }

  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ background: 'var(--c-surface)', borderRadius: 14, padding: '12px 14px', boxShadow: '0 2px 10px rgba(15,23,42,0.07)', border: `1.5px solid ${accent}22` }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: accent + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: accent, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 0.5 }}>{meta.label}</span>
              {item.type !== ITEM_TYPES.MEMO && (
                <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)', marginTop: 1 }}>
                  {item.title || item.name || item.flightNumber || item.fromName}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {[['edit', false], ['delete', true]].map(([icon, danger]) => (
              <button key={icon} onClick={icon === 'edit' ? onEdit : onDelete}
                style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--c-primary-light)'; e.currentTarget.style.color = danger ? 'var(--c-error)' : 'var(--c-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
              </button>
            ))}
          </div>
        </div>
        {renderContent()}
        {item.notes && (
          <div style={{ marginTop: 8, background: 'var(--c-surface2)', borderRadius: 8, padding: '7px 10px', borderLeft: `3px solid ${accent}60` }}>
            <p style={{ fontSize: 12, color: 'var(--c-text-2)', lineHeight: 1.6 }}>{item.notes}</p>
          </div>
        )}
        {item.cost > 0 && (
          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: accent, background: accent + '15', padding: '3px 12px', borderRadius: 20 }}>
              {Number(item.cost).toLocaleString('ko-KR')}원
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function Chip({ icon, text, color }) {
  if (!text) return null
  return (
    <span style={{ fontSize: 11, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
      <span className="material-symbols-outlined" style={{ fontSize: 12, color }}>{icon}</span>
      {text}
    </span>
  )
}

/* ── Sub-components ── */

function SortableTimelineItem({ schedule, isLast, onEdit, onDelete, isDragging }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: schedule.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }
  return (
    <div ref={setNodeRef} style={style}>
      <TimelineItem
        schedule={schedule} isLast={isLast}
        onEdit={onEdit} onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}

function ChecklistView({ checklist, newItem, onNewItemChange, onAdd, onToggle, onRemove }) {
  const categories = Object.entries(CHECKLIST_CATEGORIES)
  const done = checklist.filter(i => i.checked).length
  const total = checklist.length
  const pct = total ? Math.round((done / total) * 100) : 0

  return (
    <div style={{ padding: '16px' }}>
      {/* Progress */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '16px 18px', marginBottom: 12, boxShadow: 'var(--shadow-xs)', border: '1px solid var(--c-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>준비 현황</p>
          <span style={{ fontSize: 22, fontWeight: 900, color: pct === 100 ? '#10B981' : 'var(--c-primary)' }}>{pct}%</span>
        </div>
        <div style={{ height: 8, background: 'var(--c-border)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#10B981' : 'var(--c-primary)', borderRadius: 4, transition: 'width 0.5s ease' }} />
        </div>
        <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 6 }}>{done} / {total}개 완료</p>
      </div>

      {/* Items by category */}
      {categories.map(([catKey, catInfo]) => {
        const items = checklist.filter(i => i.category === catKey)
        if (items.length === 0) return null
        return (
          <div key={catKey} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '14px 16px', marginBottom: 10, boxShadow: 'var(--shadow-xs)', border: '1px solid var(--c-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 15, color: catInfo.color, fontVariationSettings: "'FILL' 1" }}>{catInfo.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 700, color: catInfo.color }}>{catInfo.label}</p>
            </div>
            {items.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--c-border)' }}>
                <button
                  onClick={() => onToggle(item.id)}
                  style={{
                    width: 24, height: 24, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${item.checked ? '#10B981' : 'var(--c-border2)'}`,
                    background: item.checked ? '#10B981' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all var(--t-fast)',
                  }}
                >
                  {item.checked && <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#fff', fontVariationSettings: "'FILL' 1" }}>check</span>}
                </button>
                <span style={{ flex: 1, fontSize: 14, color: item.checked ? 'var(--c-text-3)' : 'var(--c-text-1)', textDecoration: item.checked ? 'line-through' : 'none', transition: 'all var(--t-fast)' }}>
                  {item.label}
                </span>
                {catKey === 'custom' && (
                  <button onClick={() => onRemove(item.id)} style={{ color: 'var(--c-text-3)', padding: 4 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>close</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      })}

      {/* Add custom item */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', padding: '14px 16px', boxShadow: 'var(--shadow-xs)', border: '1px solid var(--c-border)' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-3)', marginBottom: 10 }}>항목 추가</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newItem}
            onChange={e => onNewItemChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onAdd()}
            placeholder="추가할 항목 입력"
            style={{ flex: 1, height: 44, padding: '0 14px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 14, background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }}
          />
          <button
            onClick={onAdd}
            disabled={!newItem.trim()}
            style={{ height: 44, padding: '0 16px', borderRadius: 'var(--r-lg)', background: newItem.trim() ? 'var(--c-primary)' : 'var(--c-border2)', color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0, transition: 'all var(--t-fast)' }}
          >추가</button>
        </div>
      </div>
    </div>
  )
}

function ViewTab({ label, icon, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 5, padding: '10px 0', marginRight: 24,
      fontSize: 'var(--text-sm)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
      color: active ? 'var(--c-primary)' : 'var(--c-text-3)',
      borderBottom: active ? '2.5px solid var(--c-primary)' : '2.5px solid transparent',
      background: 'none', transition: 'all var(--t-fast)',
    }}>
      <span className="material-symbols-outlined" style={{ fontSize: 17, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{icon}</span>
      {label}
    </button>
  )
}

function TimelineItem({ schedule, isLast, onEdit, onDelete, dragHandleProps }) {
  const cat = SCHEDULE_CATEGORIES.find(c => c.key === schedule.category) ?? SCHEDULE_CATEGORIES.at(-1)
  return (
    <div style={{ display: 'flex' }}>
      {/* Time column */}
      <div style={{ width: 54, flexShrink: 0, textAlign: 'right', paddingRight: 12, paddingTop: 15 }}>
        {schedule.startTime
          ? <><p style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-2)', lineHeight: 1 }}>{schedule.startTime}</p>{schedule.endTime && <p style={{ fontSize: 10, color: 'var(--c-text-3)', marginTop: 3 }}>{schedule.endTime}</p>}</>
          : <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>-</p>
        }
      </div>

      {/* Connector */}
      <div style={{ width: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 13, height: 13, borderRadius: '50%', background: cat.color, marginTop: 14, flexShrink: 0, boxShadow: `0 0 0 3px ${cat.color}30,0 0 0 6px ${cat.color}10`, zIndex: 1 }} />
        {!isLast && <div style={{ flex: 1, width: 2, minHeight: 20, marginTop: 3, background: `linear-gradient(to bottom,${cat.color}50,var(--c-border))` }} />}
      </div>

      {/* Card */}
      <div style={{ flex: 1, paddingLeft: 10, paddingBottom: isLast ? 6 : 18 }}>
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', padding: '12px 14px', boxShadow: '0 2px 12px rgba(15,23,42,0.07)', border: `1px solid ${cat.color}20` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              {dragHandleProps && (
                <span {...dragHandleProps} className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--c-border2)', cursor: 'grab', flexShrink: 0, touchAction: 'none' }}>drag_indicator</span>
              )}
              <div style={{ width: 28, height: 28, borderRadius: 8, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 15, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
              </div>
              <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{schedule.title}</p>
            </div>
            <div style={{ display: 'flex', flexShrink: 0 }}>
              {[['edit','편집',false],['delete','삭제',true]].map(([icon, title, danger]) => (
                <button key={icon} title={title}
                  onClick={icon === 'edit' ? onEdit : onDelete}
                  style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', transition: 'all var(--t-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = danger ? '#FEF2F2' : 'var(--c-primary-light)'; e.currentTarget.style.color = danger ? 'var(--c-error)' : 'var(--c-primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{icon}</span>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: '3px 12px' }}>
            {schedule.place && (
              <span style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>{schedule.place}
              </span>
            )}
            {schedule.placeAddress && (
              <span style={{ fontSize: 11, color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                {schedule.placeAddress}
              </span>
            )}
          </div>

          {schedule.memo && (
            <div style={{ marginTop: 8, background: 'var(--c-surface2)', borderRadius: 8, padding: '7px 10px', borderLeft: `3px solid ${cat.color}60` }}>
              <p style={{ fontSize: 12, color: 'var(--c-text-2)', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{schedule.memo}</p>
            </div>
          )}

          {schedule.cost > 0 && (
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', background: 'var(--c-primary-light)', padding: '3px 12px', borderRadius: 'var(--r-full)' }}>
                {Number(schedule.cost).toLocaleString('ko-KR')}원
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatItem({ icon, label, value, color, divider }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 8px', gap: 3, borderLeft: divider ? '1px solid var(--c-border)' : 'none' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 18, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      <span style={{ fontSize: 18, fontWeight: 900, color: 'var(--c-text-1)', lineHeight: 1.1 }}>{value}</span>
      <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{label}</span>
    </div>
  )
}

const floatBtn = { width: 38, height: 38, borderRadius: '50%', background: 'rgba(0,0,0,0.32)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.20)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background var(--t-fast)' }

function getCoverGradient(emoji) {
  const m = { '✈️':['#60A5FA','#2563EB'],'🗺️':['#34D399','#059669'],'🏖️':['#FBBF24','#F97316'],'🏔️':['#6EE7B7','#10B981'],'🌆':['#A78BFA','#7C3AED'],'🌸':['#F9A8D4','#EC4899'],'🍜':['#FCD34D','#D97706'],'🎡':['#67E8F9','#0891B2'],'🏰':['#D4A574','#92400E'],'🌅':['#FCA5A5','#EF4444'],'🎭':['#C4B5FD','#8B5CF6'],'🚂':['#94A3B8','#475569'] }
  return m[emoji] ?? ['#93C5FD','#3B82F6']
}

/* ────────────────────────────────────────────────────────
   BudgetView (Phase 7)
──────────────────────────────────────────────────────── */

const BUDGET_CATS = [
  { key: 'flight',    label: '항공',  icon: 'flight',         color: '#D4537E' },
  { key: 'hotel',     label: '숙소',  icon: 'hotel',          color: '#378ADD' },
  { key: 'food',      label: '식비',  icon: 'restaurant',     color: '#EF9F27' },
  { key: 'tour',      label: '관광',  icon: 'photo_camera',   color: '#1D9E75' },
  { key: 'shopping',  label: '쇼핑',  icon: 'shopping_bag',   color: '#EC4899' },
  { key: 'transport', label: '교통',  icon: 'directions_car', color: '#7C3AED' },
  { key: 'other',     label: '기타',  icon: 'more_horiz',     color: '#94A3B8' },
]

function BudgetView({ budget: initBudget, expenses: initExpenses, onSave }) {
  const [budget,     setBudgetLocal] = useState(initBudget)
  const [expenses,   setExpenses]    = useState(initExpenses)
  const [editBudget, setEditBudget]  = useState(false)
  const [budgetInput, setBudgetInput] = useState(String(initBudget || ''))
  const [showForm,   setShowForm]    = useState(false)
  const [form, setForm] = useState({ category: 'food', label: '', amount: '', date: '', note: '' })

  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const pct        = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0
  const overBudget = totalSpent > budget && budget > 0
  const barColor   = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981'

  function saveBudget() {
    const n = Number(budgetInput.replace(/,/g, '')) || 0
    setBudgetLocal(n)
    setEditBudget(false)
    onSave(n, expenses)
  }

  function addExpense() {
    if (!form.label || !form.amount) return
    const newExp = { id: `exp_${Date.now()}`, ...form, amount: Number(form.amount) || 0 }
    const next = [...expenses, newExp]
    setExpenses(next)
    setShowForm(false)
    setForm({ category: 'food', label: '', amount: '', date: '', note: '' })
    onSave(budget, next)
  }

  function removeExpense(id) {
    const next = expenses.filter(e => e.id !== id)
    setExpenses(next)
    onSave(budget, next)
  }

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── 예산 설정 카드 ── */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 16, padding: '16px 18px', border: '1px solid var(--c-border)', boxShadow: '0 1px 8px rgba(15,23,42,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>총 예산</p>
          {editBudget ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                autoFocus
                value={budgetInput}
                onChange={e => setBudgetInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && saveBudget()}
                placeholder="예산 입력"
                type="number"
                style={{ width: 130, height: 36, padding: '0 12px', border: '1.5px solid var(--c-primary)', borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)' }}
              />
              <button onClick={saveBudget} style={{ padding: '7px 14px', background: 'var(--c-primary)', color: '#fff', borderRadius: 10, fontSize: 13, fontWeight: 700 }}>저장</button>
            </div>
          ) : (
            <button onClick={() => { setEditBudget(true); setBudgetInput(String(budget || '')) }}
              style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 14, color: budget ? 'var(--c-text-2)' : 'var(--c-primary)', background: 'var(--c-surface2)', padding: '6px 14px', borderRadius: 10, fontWeight: 600 }}>
              {budget > 0 ? `${budget.toLocaleString('ko-KR')}원` : '+ 예산 설정'}
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
            </button>
          )}
        </div>

        {/* 진행 바 */}
        {budget > 0 && (
          <>
            <div style={{ height: 10, background: 'var(--c-border)', borderRadius: 5, overflow: 'hidden', marginBottom: 8 }}>
              <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 5, transition: 'width 0.5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--c-text-3)' }}>
              <span>지출 <b style={{ color: barColor }}>{totalSpent.toLocaleString('ko-KR')}원</b></span>
              <span style={{ fontWeight: 700, color: barColor }}>{pct}%</span>
              <span>{overBudget ? <span style={{ color: '#EF4444' }}>초과 {(totalSpent - budget).toLocaleString('ko-KR')}원</span> : `남은 예산 ${(budget - totalSpent).toLocaleString('ko-KR')}원`}</span>
            </div>
          </>
        )}
        {budget === 0 && (
          <p style={{ fontSize: 13, color: 'var(--c-text-3)', textAlign: 'center', padding: '8px 0' }}>예산을 설정하면 지출 현황을 한눈에 볼 수 있어요</p>
        )}
      </div>

      {/* ── 카테고리별 지출 ── */}
      {expenses.length > 0 && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 16, padding: '16px 18px', border: '1px solid var(--c-border)', boxShadow: '0 1px 8px rgba(15,23,42,0.06)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)', marginBottom: 14 }}>카테고리별 지출</p>
          {BUDGET_CATS.map(cat => {
            const catTotal = expenses.filter(e => e.category === cat.key).reduce((s, e) => s + (Number(e.amount) || 0), 0)
            if (catTotal === 0) return null
            const catPct = totalSpent > 0 ? Math.round((catTotal / totalSpent) * 100) : 0
            return (
              <div key={cat.key} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-2)' }}>{cat.label}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)' }}>{catTotal.toLocaleString('ko-KR')}원</span>
                    <span style={{ fontSize: 11, color: 'var(--c-text-3)', marginLeft: 6 }}>{catPct}%</span>
                  </div>
                </div>
                <div style={{ height: 5, background: 'var(--c-border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${catPct}%`, background: cat.color, borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── 지출 추가 버튼 / 폼 ── */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px', background: 'var(--c-primary)', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 700, boxShadow: 'var(--shadow-primary)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add</span>
          지출 추가
        </button>
      ) : (
        <div style={{ background: 'var(--c-surface)', borderRadius: 16, padding: '16px 18px', border: '1.5px solid var(--c-primary)', boxShadow: '0 4px 16px rgba(59,130,246,0.12)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-primary)', marginBottom: 14 }}>지출 추가</p>

          {/* 카테고리 선택 */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {BUDGET_CATS.map(cat => (
              <button key={cat.key} type="button"
                onClick={() => setForm(p => ({ ...p, category: cat.key }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 20, fontSize: 12,
                  background: form.category === cat.key ? cat.color + '18' : 'var(--c-surface2)',
                  border: `1.5px solid ${form.category === cat.key ? cat.color : 'transparent'}`,
                  color: form.category === cat.key ? cat.color : 'var(--c-text-3)',
                  fontWeight: form.category === cat.key ? 700 : 500,
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'label',  label: '내용 *',   placeholder: '예) KE907 항공료', type: 'text' },
              { key: 'amount', label: '금액 *',   placeholder: '0', type: 'number' },
              { key: 'date',   label: '날짜',     placeholder: '', type: 'date' },
              { key: 'note',   label: '메모',     placeholder: '상세 메모', type: 'text' },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-3)', display: 'block', marginBottom: 5 }}>{label}</label>
                <input type={type} value={form[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  style={{ width: '100%', height: 42, padding: '0 12px', border: '1.5px solid var(--c-border)', borderRadius: 10, fontSize: 14, background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
            <button onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: 'var(--c-surface2)', color: 'var(--c-text-2)' }}>취소</button>
            <button onClick={addExpense} disabled={!form.label || !form.amount}
              style={{ flex: 2, padding: '12px', borderRadius: 12, fontSize: 14, fontWeight: 700, background: form.label && form.amount ? 'var(--c-primary)' : 'var(--c-border2)', color: '#fff' }}>
              추가
            </button>
          </div>
        </div>
      )}

      {/* ── 지출 목록 ── */}
      {expenses.length > 0 && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 16, border: '1px solid var(--c-border)', overflow: 'hidden', boxShadow: '0 1px 8px rgba(15,23,42,0.06)' }}>
          <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid var(--c-border)' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>지출 내역</p>
          </div>
          {[...expenses].reverse().map((exp, i) => {
            const cat = BUDGET_CATS.find(c => c.key === exp.category) ?? BUDGET_CATS.at(-1)
            return (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < expenses.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>
                    {cat.label}{exp.date && ` · ${exp.date}`}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-1)' }}>{Number(exp.amount).toLocaleString('ko-KR')}원</p>
                  <button onClick={() => removeExpense(exp.id)} style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 2 }}>삭제</button>
                </div>
              </div>
            )
          })}
          <div style={{ padding: '12px 18px', background: 'var(--c-surface2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>합계</span>
            <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--c-primary)' }}>{totalSpent.toLocaleString('ko-KR')}원</span>
          </div>
        </div>
      )}
    </div>
  )
}

function fmtCost(n) {
  if (n >= 100000) return `${Math.round(n / 10000)}만원`
  if (n >= 10000) return `${(n / 10000).toFixed(1)}만원`
  return `${n.toLocaleString('ko-KR')}원`
}
