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
  const [categoryBudgets, setCategoryBudgets] = useState({})
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
          setCategoryBudgets(t.categoryBudgets ?? {})
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

  // Day cost lookup
  const dayCosts = {}
  dates.forEach(d => {
    const c = [
      ...schedules.filter(s => s.date === d).map(s => Number(s.cost) || 0),
      ...tripItems.filter(i => i.date === d || i.checkIn === d).map(i => Number(i.cost) || 0),
    ].reduce((a, b) => a + b, 0)
    if (c > 0) dayCosts[d] = c
  })

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
                dayCost={dayCosts[date] ?? 0}
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
          categoryBudgets={categoryBudgets}
          schedules={schedules}
          tripItems={tripItems}
          dates={dates}
          onSave={async (newBudget, newExpenses, newCatBudgets) => {
            setBudget(newBudget)
            setExpenses(newExpenses)
            setCategoryBudgets(newCatBudgets)
            await updateTripBudgetData(tripId, {
              budget:          newBudget,
              expenses:        newExpenses,
              categoryBudgets: newCatBudgets,
            })
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
        /* ── Map view (upgraded) ── */
        <div>
          <TripMap
            schedules={schedules}
            tripItems={tripItems}
            dates={dates}
            selectedDate={selectedDate}
            height="clamp(300px, 55vh, 520px)"
          />

          {/* Day schedule strip below map */}
          {(daySchedules.length > 0 || dayTripItems.length > 0) ? (
            <div style={{ background: 'var(--c-surface)', borderTop: '1px solid var(--c-border)' }}>
              <div style={{ padding: '12px 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)' }}>
                  {formatDisplayDate(selectedDate)} 일정
                </p>
                <span style={{ fontSize: 12, color: 'var(--c-text-3)', fontWeight: 600 }}>
                  {daySchedules.length + dayTripItems.length}개
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {[...dayTripItems, ...daySchedules].map(item => {
                  const isItem = !!item.type
                  const meta = isItem
                    ? ITEM_TYPE_META[item.type]
                    : SCHEDULE_CATEGORIES.find(c => c.key === item.category) ?? SCHEDULE_CATEGORIES.at(-1)
                  const color = meta?.color ?? '#94A3B8'
                  const icon  = meta?.icon  ?? 'place'
                  const title = item.title || item.name || item.flightNumber || item.fromName || '일정'
                  const time  = item.startTime || item.departureTime?.slice(11, 16) || ''
                  return (
                    <div
                      key={item.id}
                      onClick={() => navigate(isItem
                        ? `/trips/${tripId}/item/${item.id}/edit`
                        : `/trips/${tripId}/schedule/${item.id}/edit`
                      )}
                      style={{
                        flexShrink: 0, display: 'flex', alignItems: 'center', gap: 9,
                        background: 'var(--c-surface2)', borderRadius: 'var(--r-xl)',
                        border: `1.5px solid ${color}30`, padding: '9px 14px', cursor: 'pointer',
                        transition: 'all var(--t-fast)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = color + '12'; e.currentTarget.style.borderColor = color + '60' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--c-surface2)'; e.currentTarget.style.borderColor = color + '30' }}
                    >
                      <div style={{ width: 30, height: 30, borderRadius: 9, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 15, color, fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', whiteSpace: 'nowrap', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
                        {time && <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginTop: 1 }}>{time}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <EmptyState icon="event_note" title="이 날의 일정이 없어요" description="+ 버튼으로 일정을 추가해보세요" />
          )}
        </div>
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

const SCHED_TO_BUDGET = {
  accommodation: 'hotel', restaurant: 'food', cafe: 'food',
  attraction: 'tour', transport: 'transport', shopping: 'shopping', etc: 'other',
}
const ITEM_TYPE_TO_BUDGET = {
  FLIGHT: 'flight', STAY: 'hotel', TRANSPORT: 'transport', PLACE: 'tour', MEMO: 'other',
}

const BUDGET_CATS = [
  { key: 'flight',    label: '항공',  icon: 'flight',         color: '#D4537E' },
  { key: 'hotel',     label: '숙소',  icon: 'hotel',          color: '#378ADD' },
  { key: 'food',      label: '식비',  icon: 'restaurant',     color: '#EF9F27' },
  { key: 'tour',      label: '관광',  icon: 'photo_camera',   color: '#1D9E75' },
  { key: 'shopping',  label: '쇼핑',  icon: 'shopping_bag',   color: '#EC4899' },
  { key: 'transport', label: '교통',  icon: 'directions_car', color: '#7C3AED' },
  { key: 'other',     label: '기타',  icon: 'more_horiz',     color: '#94A3B8' },
]

function BudgetView({ budget: initBudget, expenses: initExpenses, categoryBudgets: initCategoryBudgets, schedules, tripItems, dates, onSave }) {
  const [budget,        setBudgetLocal]    = useState(initBudget)
  const [expenses,      setExpenses]       = useState(initExpenses)
  const [editBudget,    setEditBudget]     = useState(false)
  const [budgetInput,   setBudgetInput]    = useState(String(initBudget || ''))
  const [showForm,      setShowForm]       = useState(false)
  const [form,          setForm]           = useState({ category: 'food', label: '', amount: '', date: '', note: '' })
  const [catBudgets,      setCatBudgets]      = useState(initCategoryBudgets ?? {})
  const [editingCatLimit, setEditingCatLimit] = useState(null)
  const [catLimitInput,   setCatLimitInput]   = useState('')
  const [activeTab,       setActiveTab]       = useState('overview')
  const [showWizard,      setShowWizard]      = useState(false)
  const [wizardInput,     setWizardInput]     = useState('')
  const [showCurrency,    setShowCurrency]    = useState(false)
  const [currency,        setCurrencyType]    = useState('JPY')
  const [rate,            setRate]            = useState('')
  const [calcAmt,         setCalcAmt]         = useState('')

  const totalSpent = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
  const pct        = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0
  const overBudget = totalSpent > budget && budget > 0
  const barColor   = pct >= 100 ? '#EF4444' : pct >= 80 ? '#F59E0B' : '#10B981'

  const integratedCostByCategory = {}
  schedules.forEach(s => {
    const k = SCHED_TO_BUDGET[s.category] ?? 'other'
    integratedCostByCategory[k] = (integratedCostByCategory[k] ?? 0) + (Number(s.cost) || 0)
  })
  tripItems.forEach(item => {
    const k = ITEM_TYPE_TO_BUDGET[item.type] ?? 'other'
    integratedCostByCategory[k] = (integratedCostByCategory[k] ?? 0) + (Number(item.cost) || 0)
  })
  const expenseCostByCategory = {}
  expenses.forEach(e => {
    expenseCostByCategory[e.category] = (expenseCostByCategory[e.category] ?? 0) + (Number(e.amount) || 0)
  })
  const combinedCostByCategory = {}
  BUDGET_CATS.forEach(cat => {
    combinedCostByCategory[cat.key] = (expenseCostByCategory[cat.key] ?? 0) + (integratedCostByCategory[cat.key] ?? 0)
  })
  const totalIntegrated = Object.values(integratedCostByCategory).reduce((s, v) => s + v, 0)
  const totalCombined   = totalSpent + totalIntegrated

  function saveBudget() {
    const n = Number(budgetInput.replace(/,/g, '')) || 0
    setBudgetLocal(n)
    setEditBudget(false)
    onSave(n, expenses, catBudgets)
  }

  function addExpense() {
    if (!form.label || !form.amount) return
    const newExp = { id: `exp_${Date.now()}`, ...form, amount: Number(form.amount) || 0 }
    const next = [...expenses, newExp]
    setExpenses(next)
    setShowForm(false)
    setForm({ category: 'food', label: '', amount: '', date: '', note: '' })
    onSave(budget, next, catBudgets)
  }

  function removeExpense(id) {
    const next = expenses.filter(e => e.id !== id)
    setExpenses(next)
    onSave(budget, next, catBudgets)
  }

  function saveCatLimit(catKey) {
    const val = Number(catLimitInput) || 0
    const next = { ...catBudgets }
    if (val) next[catKey] = val; else delete next[catKey]
    setCatBudgets(next)
    setEditingCatLimit(null)
    onSave(budget, expenses, next)
  }

  const combinedPct = budget > 0 ? Math.min(100, Math.round((totalCombined / budget) * 100)) : 0

  // ── 도넛 차트 conic-gradient 계산 ──
  const donutSegments = BUDGET_CATS
    .map(cat => ({ ...cat, val: combinedCostByCategory[cat.key] ?? 0 }))
    .filter(s => s.val > 0)
  let cumPct = 0
  const donutGrad = totalCombined > 0
    ? 'conic-gradient(' + donutSegments.map(s => {
        const pctSlice = s.val / totalCombined * 100
        const part = `${s.color} ${cumPct.toFixed(1)}% ${(cumPct + pctSlice).toFixed(1)}%`
        cumPct += pctSlice
        return part
      }).join(', ') + `, var(--c-border) ${cumPct.toFixed(1)}% 100%)`
    : 'conic-gradient(var(--c-border) 0% 100%)'

  // ── 스마트 인사이트 ──
  const today = new Date().toISOString().slice(0, 10)
  const elapsedDays = Math.max(1, dates.filter(d => d <= today).length)
  const dailyRate = totalCombined / elapsedDays
  const forecastTotal = dailyRate * dates.length
  const insights = []
  if (totalCombined > 0) {
    const topCat = BUDGET_CATS.reduce((mx, cat) => {
      const v = combinedCostByCategory[cat.key] ?? 0
      return v > (combinedCostByCategory[mx.key] ?? 0) ? cat : mx
    }, BUDGET_CATS[0])
    const topPct = Math.round((combinedCostByCategory[topCat.key] ?? 0) / totalCombined * 100)
    insights.push({ type: 'info', text: `${topCat.label}에 전체 지출의 ${topPct}%를 쓰고 있어요`, icon: topCat.icon })
  }
  if (budget > 0 && dates.length > 0 && totalCombined > 0) {
    if (forecastTotal > budget) {
      insights.push({ type: 'error', text: `이 속도라면 여행 후 예산보다 ${Math.round(forecastTotal - budget).toLocaleString('ko-KR')}원 초과될 것 같아요`, icon: 'trending_up' })
    } else {
      insights.push({ type: 'success', text: `이 속도라면 ${Math.round(budget - forecastTotal).toLocaleString('ko-KR')}원이 남을 것 같아요`, icon: 'savings' })
    }
  }
  BUDGET_CATS.forEach(cat => {
    const limit = catBudgets[cat.key]; const combined = combinedCostByCategory[cat.key] ?? 0
    if (limit > 0 && combined > limit)
      insights.push({ type: 'error', text: `${cat.label} 예산이 ${(combined - limit).toLocaleString('ko-KR')}원 초과됐어요`, icon: 'warning' })
  })
  if (budget > 0 && totalCombined === 0)
    insights.push({ type: 'info', text: '지출을 추가하거나 일정에 비용을 입력해보세요', icon: 'add_circle' })

  // ── 예산 마법사 추천 배분 ──
  const WIZARD_ALLOC = [
    { key: 'flight', pct: 30 }, { key: 'hotel', pct: 35 }, { key: 'food', pct: 15 },
    { key: 'tour', pct: 10 }, { key: 'shopping', pct: 7 }, { key: 'transport', pct: 2 }, { key: 'other', pct: 1 },
  ]

  function applyWizard() {
    const total = Number(wizardInput.replace(/,/g, '')) || 0
    if (!total) return
    const next = {}
    WIZARD_ALLOC.forEach(({ key, pct }) => { next[key] = Math.round(total * pct / 100) })
    setBudgetLocal(total)
    setCatBudgets(next)
    setShowWizard(false)
    onSave(total, expenses, next)
  }

  // ── 환율 계산기 ──
  const CURRENCIES = [
    { code: 'JPY', label: '일본 엔', flag: '🇯🇵', hint: '약 9원' },
    { code: 'USD', label: '미국 달러', flag: '🇺🇸', hint: '약 1,320원' },
    { code: 'EUR', label: '유로', flag: '🇪🇺', hint: '약 1,420원' },
    { code: 'THB', label: '태국 밧', flag: '🇹🇭', hint: '약 37원' },
    { code: 'VND', label: '베트남 동', flag: '🇻🇳', hint: '약 0.052원' },
    { code: 'SGD', label: '싱가포르달러', flag: '🇸🇬', hint: '약 984원' },
  ]
  const rateNum = Number(rate.replace(/,/g, '')) || 0
  const calcResult = rateNum > 0 && calcAmt ? Math.round(Number(calcAmt.replace(/,/g, '')) * rateNum) : null
  const heroGrad = totalCombined > budget
    ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
    : combinedPct >= 80
    ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
    : 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)'

  return (
    <div style={{ padding: '16px 16px 88px', display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* ── 탭 바 ── */}
      <div style={{ display: 'flex', background: 'var(--c-surface2)', borderRadius: 'var(--r-md)', padding: 4, gap: 4 }}>
        {[{ key: 'overview', label: '전체 현황', icon: 'pie_chart' }, { key: 'daily', label: '일별 지출', icon: 'calendar_month' }].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, background: activeTab === tab.key ? 'var(--c-surface)' : 'transparent', color: activeTab === tab.key ? 'var(--c-primary)' : 'var(--c-text-3)', boxShadow: activeTab === tab.key ? 'var(--shadow-sm)' : 'none', transition: 'all 0.2s' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: activeTab === tab.key ? "'FILL' 1" : "'FILL' 0" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (<>

      {/* ── 예산 히어로 카드 ── */}
      <div style={{ background: heroGrad, borderRadius: 20, padding: '20px 20px 0', boxShadow: '0 8px 24px rgba(59,130,246,0.25)', overflow: 'hidden', position: 'relative' }}>
        {/* 배경 장식 원 */}
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', top: -40, right: -40, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: 20, left: -20, pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 4 }}>신혼여행 예산</p>
            {budget > 0 ? (
              <>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1.1 }}>{budget.toLocaleString('ko-KR')}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 3 }}>원</span></p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 3 }}>
                  {totalCombined > budget ? `${(totalCombined - budget).toLocaleString('ko-KR')}원 초과` : `${(budget - totalCombined).toLocaleString('ko-KR')}원 남음`}
                </p>
              </>
            ) : (
              <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>예산을 설정해보세요</p>
            )}
          </div>
          <button onClick={() => { setEditBudget(true); setBudgetInput(String(budget || '')) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit</span>
            {budget > 0 ? '수정' : '설정'}
          </button>
        </div>

        {editBudget && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
            <input autoFocus value={budgetInput} onChange={e => setBudgetInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && saveBudget()} placeholder="총 예산 입력" type="number"
              style={{ flex: 1, height: 42, padding: '0 14px', border: '2px solid rgba(255,255,255,0.5)', borderRadius: 12, fontSize: 15, outline: 'none', background: 'rgba(255,255,255,0.15)', color: '#fff', fontFamily: 'var(--font)', backdropFilter: 'blur(8px)' }} />
            <button onClick={saveBudget} style={{ padding: '10px 18px', background: '#fff', color: 'var(--c-primary)', borderRadius: 12, fontSize: 13, fontWeight: 800 }}>저장</button>
            <button onClick={() => setEditBudget(false)} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700 }}>취소</button>
          </div>
        )}

        {/* 진행 바 + 통계 + 도넛 */}
        {budget > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.15)', borderRadius: '0 0 20px 20px', margin: '0 -20px', padding: '14px 20px' }}>
            {/* 도넛 차트 + 통계 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
              {/* CSS 도넛 차트 */}
              <div className="donut-chart" style={{ width: 72, height: 72, background: donutGrad, flexShrink: 0 }}>
                <div className="donut-inner" style={{ width: 46, height: 46 }}>
                  <p style={{ fontSize: 8, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>사용률</p>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{combinedPct}%</p>
                </div>
              </div>
              {/* 3열 통계 */}
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 0 }}>
                {[{ label: '총 예산', value: budget }, { label: '직접 지출', value: totalSpent }, { label: '일정 비용', value: totalIntegrated }].map(({ label, value }, idx) => (
                  <div key={label} style={{ textAlign: 'center', borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.15)' : 'none', padding: '0 4px' }}>
                    <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>{label}</p>
                    <p style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{value >= 10000 ? `${Math.round(value/10000)}만` : value.toLocaleString('ko-KR')}원</p>
                  </div>
                ))}
              </div>
            </div>
            {/* 진행 바 */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${combinedPct}%`, background: '#fff', borderRadius: 2, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)', opacity: 0.85 }} />
            </div>
          </div>
        )}

        {/* 마법사 버튼 (예산 미설정 시) */}
        {!budget && !editBudget && (
          <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <button onClick={() => setShowWizard(true)}
              style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 12, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              자동 배분 마법사
            </button>
          </div>
        )}
      </div>

      {/* ── 예산 배분 마법사 ── */}
      {showWizard && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '18px', boxShadow: 'var(--shadow-md)', animation: 'slideInUp 0.25s var(--ease)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-text-1)', letterSpacing: -0.3 }}>예산 자동 배분</p>
              <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: 2 }}>총 예산을 입력하면 카테고리별 추천 한도를 설정해드려요</p>
            </div>
            <button onClick={() => setShowWizard(false)} style={{ color: 'var(--c-text-3)', padding: 4 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
          </div>
          <input type="number" value={wizardInput} onChange={e => setWizardInput(e.target.value)}
            placeholder="총 예산 입력 (원)"
            style={{ width: '100%', height: 48, padding: '0 14px', border: '1.5px solid var(--c-primary)', borderRadius: 12, fontSize: 16, background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box', marginBottom: 12 }} />
          {wizardInput > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {WIZARD_ALLOC.map(({ key, pct }) => {
                const cat = BUDGET_CATS.find(c => c.key === key)
                const amt = Math.round(Number(wizardInput) * pct / 100)
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: cat.color + '12', borderRadius: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{cat.label} {pct}%</p>
                      <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-text-1)' }}>{amt.toLocaleString('ko-KR')}원</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <button onClick={applyWizard} disabled={!wizardInput}
            style={{ width: '100%', padding: '13px', background: wizardInput ? 'linear-gradient(135deg, var(--c-primary), #6366F1)' : 'var(--c-border)', color: '#fff', borderRadius: 12, fontSize: 15, fontWeight: 800, boxShadow: wizardInput ? '0 4px 14px rgba(99,102,241,0.35)' : 'none' }}>
            이 배분으로 설정하기
          </button>
        </div>
      )}

      {/* ── 카테고리별 예산 ── */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>카테고리별 예산</p>
          <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>항목 탭 → 한도 설정</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--c-border)' }}>
          {BUDGET_CATS.map(cat => {
            const combined  = combinedCostByCategory[cat.key] ?? 0
            const manual    = expenseCostByCategory[cat.key] ?? 0
            const fromItems = integratedCostByCategory[cat.key] ?? 0
            const limit     = catBudgets[cat.key]
            const isEditing = editingCatLimit === cat.key
            const barPct    = limit > 0 ? Math.min(100, Math.round((combined / limit) * 100)) : (totalCombined > 0 ? Math.round((combined / totalCombined) * 100) : 0)
            const barOver   = limit > 0 && combined > limit
            const barCol    = barOver ? '#EF4444' : barPct >= 80 ? '#F59E0B' : cat.color
            return (
              <div key={cat.key} onClick={() => { if (!isEditing) { setEditingCatLimit(cat.key); setCatLimitInput(limit ? String(limit) : '') } }}
                style={{ background: 'var(--c-surface)', padding: '12px 14px', cursor: 'pointer', position: 'relative', borderLeft: `3px solid ${combined > 0 ? cat.color : 'var(--c-border2)'}`, transition: 'background 0.15s' }}>
                {barOver && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: '50%', background: '#EF4444' }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: combined > 0 ? cat.color + '18' : 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: combined > 0 ? cat.color : 'var(--c-text-3)', fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--c-text-3)' }}>{cat.label}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: barOver ? '#EF4444' : combined > 0 ? 'var(--c-text-1)' : 'var(--c-text-3)' }}>
                      {combined > 0 ? `${combined.toLocaleString('ko-KR')}원` : '0원'}
                    </p>
                  </div>
                </div>
                {!isEditing && (
                  <>
                    <div style={{ height: 4, background: 'var(--c-border)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: barCol, borderRadius: 2, transition: 'width 0.5s' }} />
                    </div>
                    <p style={{ fontSize: 10, color: limit ? (barOver ? '#EF4444' : 'var(--c-text-3)') : 'var(--c-primary)', fontWeight: 600 }}>
                      {limit ? `한도 ${limit.toLocaleString('ko-KR')}원 (${barPct}%)` : '+ 한도 설정'}
                    </p>
                    {fromItems > 0 && <p style={{ fontSize: 10, color: 'var(--c-primary)', marginTop: 2 }}>일정 포함 {fromItems.toLocaleString('ko-KR')}원</p>}
                  </>
                )}
                {isEditing && (
                  <div onClick={e => e.stopPropagation()} style={{ marginTop: 4 }}>
                    <input autoFocus type="number" value={catLimitInput} onChange={e => setCatLimitInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveCatLimit(cat.key); if (e.key === 'Escape') setEditingCatLimit(null) }}
                      placeholder="한도 (0=해제)"
                      style={{ width: '100%', height: 32, padding: '0 8px', border: `1.5px solid ${cat.color}`, borderRadius: 8, fontSize: 12, background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box', marginBottom: 6 }} />
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => saveCatLimit(cat.key)} style={{ flex: 1, padding: '5px 0', background: cat.color, color: '#fff', borderRadius: 7, fontSize: 11, fontWeight: 700 }}>저장</button>
                      <button onClick={() => setEditingCatLimit(null)} style={{ flex: 1, padding: '5px 0', background: 'var(--c-surface2)', color: 'var(--c-text-3)', borderRadius: 7, fontSize: 11 }}>취소</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 스마트 인사이트 ── */}
      {insights.length > 0 && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '14px 16px', boxShadow: 'var(--shadow-xs)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#6366F1', fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>스마트 인사이트</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {insights.map((ins, i) => (
              <div key={i} className={`insight-card ${ins.type}`} style={{ animation: `slideInUp 0.2s ${i * 0.05}s both` }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: ins.type === 'error' ? 'var(--c-error)' : ins.type === 'success' ? 'var(--c-success)' : '#6366F1', fontVariationSettings: "'FILL' 1", flexShrink: 0 }}>{ins.icon}</span>
                <p style={{ fontSize: 12, color: 'var(--c-text-2)', lineHeight: 1.5 }}>{ins.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 환율 계산기 ── */}
      <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden', boxShadow: 'var(--shadow-xs)' }}>
        <button onClick={() => setShowCurrency(v => !v)}
          style={{ width: '100%', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: '#F97316', fontVariationSettings: "'FILL' 1" }}>currency_exchange</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>환율 계산기</span>
            {rateNum > 0 && <span style={{ fontSize: 11, color: '#F97316', background: '#FFF7ED', padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>1{currency} = {rateNum.toLocaleString('ko-KR')}원</span>}
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--c-text-3)', transition: 'transform 0.2s', transform: showCurrency ? 'rotate(180deg)' : 'none' }}>expand_more</span>
        </button>
        {showCurrency && (
          <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--c-border)' }}>
            {/* 통화 선택 */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '12px 0 10px', scrollbarWidth: 'none' }}>
              {CURRENCIES.map(c => (
                <button key={c.code} onClick={() => setCurrencyType(c.code)}
                  className={`currency-chip${currency === c.code ? ' selected' : ''}`}>
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                </button>
              ))}
            </div>
            {/* 환율 입력 */}
            <p style={{ fontSize: 11, color: 'var(--c-text-3)', marginBottom: 6 }}>
              현재 환율: 1{CURRENCIES.find(c => c.code === currency)?.label} = {CURRENCIES.find(c => c.code === currency)?.hint}
            </p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>1{currency} =</span>
                <input type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="환율 직접 입력"
                  style={{ width: '100%', height: 40, paddingLeft: 60, paddingRight: 12, border: '1.5px solid var(--c-border)', borderRadius: 10, fontSize: 14, background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <span style={{ fontSize: 12, color: 'var(--c-text-3)', whiteSpace: 'nowrap' }}>원</span>
            </div>
            {/* 금액 변환 */}
            {rateNum > 0 && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input type="number" value={calcAmt} onChange={e => setCalcAmt(e.target.value)} placeholder={`금액 (${currency})`}
                  style={{ flex: 1, height: 44, padding: '0 12px', border: '1.5px solid #F97316', borderRadius: 10, fontSize: 15, background: '#FFF7ED', color: 'var(--c-text-1)', fontFamily: 'var(--font)', outline: 'none' }} />
                <span className="material-symbols-outlined" style={{ color: 'var(--c-text-3)', fontSize: 18 }}>arrow_forward</span>
                <div style={{ flex: 1, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: calcResult ? '#ECFDF5' : 'var(--c-surface2)', borderRadius: 10, border: `1.5px solid ${calcResult ? '#10B981' : 'var(--c-border)'}` }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: calcResult ? '#10B981' : 'var(--c-text-3)' }}>
                    {calcResult ? `${calcResult.toLocaleString('ko-KR')}원` : '?원'}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 지출 추가 버튼 / 폼 ── */}
      {!showForm ? (
        <button onClick={() => setShowForm(true)}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px', background: 'linear-gradient(135deg, var(--c-primary) 0%, #6366F1 100%)', color: '#fff', borderRadius: 'var(--r-lg)', fontSize: 15, fontWeight: 800, boxShadow: '0 4px 16px rgba(99,102,241,0.35)', letterSpacing: '0.3px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 20, fontVariationSettings: "'FILL' 1" }}>add_circle</span>
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

      {/* ── 지출 내역 ── */}
      {expenses.length > 0 && (
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-2)' }}>지출 내역</p>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--c-primary)' }}>{totalSpent.toLocaleString('ko-KR')}원</span>
          </div>
          {[...expenses].reverse().map((exp, i, arr) => {
            const cat = BUDGET_CATS.find(c => c.key === exp.category) ?? BUDGET_CATS.at(-1)
            return (
              <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 17, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.label}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 11, color: cat.color, background: cat.color + '15', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{cat.label}</span>
                    {exp.date && <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{exp.date}</span>}
                    {exp.note && <span style={{ fontSize: 11, color: 'var(--c-text-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80 }}>{exp.note}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, flexShrink: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--c-text-1)' }}>{Number(exp.amount).toLocaleString('ko-KR')}원</p>
                  <button onClick={() => removeExpense(exp.id)} style={{ fontSize: 11, color: '#EF4444', background: '#FEF2F2', padding: '2px 8px', borderRadius: 4, fontWeight: 600 }}>삭제</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      </>)}

      {/* ── 일별 지출 탭 ── */}
      {activeTab === 'daily' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* 일별 합계 요약 바 */}
          {budget > 0 && (
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', padding: '12px 16px', border: '1px solid var(--c-border)', boxShadow: 'var(--shadow-xs)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>여행 중 총 지출</span>
                <span style={{ fontSize: 17, fontWeight: 900, color: totalCombined > budget ? '#EF4444' : 'var(--c-text-1)' }}>{totalCombined.toLocaleString('ko-KR')}원</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: 'var(--c-text-3)', fontWeight: 600 }}>1일 평균</span>
                <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--c-primary)', marginTop: 2 }}>
                  {dates.length > 0 ? Math.round(totalCombined / dates.length).toLocaleString('ko-KR') : 0}원
                </p>
              </div>
            </div>
          )}
          {dates.map((date, dayIdx) => {
            const dayExpenses = expenses.filter(e => e.date === date)
            const daySchedCost = schedules.filter(s => s.date === date).reduce((sum, s) => sum + (Number(s.cost) || 0), 0)
            const dayItemCost  = tripItems.filter(i => i.date === date).reduce((sum, i) => sum + (Number(i.cost) || 0), 0)
            const dayManual    = dayExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)
            const dayTotal     = dayManual + daySchedCost + dayItemCost
            if (dayTotal === 0 && dayExpenses.length === 0) return null
            const dayAvgBudget = budget > 0 ? Math.round(budget / dates.length) : 0
            const dayOver = dayAvgBudget > 0 && dayTotal > dayAvgBudget
            return (
              <div key={date} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: `1px solid ${dayOver ? '#FECACA' : 'var(--c-border)'}`, overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ padding: '12px 16px', background: dayOver ? '#FFF5F5' : 'var(--c-surface2)', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-primary-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--c-primary)' }}>D{dayIdx + 1}</span>
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)' }}>{formatDisplayDate(date)}</p>
                      {dayAvgBudget > 0 && <p style={{ fontSize: 10, color: dayOver ? '#EF4444' : 'var(--c-text-3)' }}>일 평균 {dayAvgBudget.toLocaleString('ko-KR')}원</p>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: dayOver ? '#EF4444' : 'var(--c-text-1)' }}>{dayTotal.toLocaleString('ko-KR')}원</p>
                    {dayOver && <p style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>+{(dayTotal - dayAvgBudget).toLocaleString('ko-KR')}원 초과</p>}
                  </div>
                </div>
                {(daySchedCost + dayItemCost) > 0 && (
                  <div style={{ padding: '9px 16px', borderBottom: dayExpenses.length > 0 ? '1px solid var(--c-border)' : 'none', background: 'var(--c-primary-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 15, color: 'var(--c-primary)', fontVariationSettings: "'FILL' 1" }}>event_note</span>
                    <span style={{ fontSize: 12, color: 'var(--c-primary)', fontWeight: 700, flex: 1 }}>일정 비용</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--c-primary)' }}>{(daySchedCost + dayItemCost).toLocaleString('ko-KR')}원</span>
                  </div>
                )}
                {dayExpenses.map((exp, i) => {
                  const cat = BUDGET_CATS.find(c => c.key === exp.category) ?? BUDGET_CATS.at(-1)
                  return (
                    <div key={exp.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 16px', borderBottom: i < dayExpenses.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                      <div style={{ width: 30, height: 30, borderRadius: 8, background: cat.color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.label}</p>
                        <span style={{ fontSize: 10, color: cat.color, background: cat.color + '15', padding: '1px 5px', borderRadius: 3, fontWeight: 600 }}>{cat.label}</span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--c-text-1)', flexShrink: 0 }}>{Number(exp.amount).toLocaleString('ko-KR')}원</span>
                    </div>
                  )
                })}
              </div>
            )
          })}
          {dates.every(date => {
            const de = expenses.filter(e => e.date === date).length === 0
            const ds = schedules.filter(s => s.date === date).reduce((s,x) => s+(Number(x.cost)||0),0) === 0
            const di = tripItems.filter(i => i.date === date).reduce((s,x) => s+(Number(x.cost)||0),0) === 0
            return de && ds && di
          }) && (
            <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--c-text-3)' }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--c-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 28, color: 'var(--c-text-3)' }}>receipt_long</span>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--c-text-2)', marginBottom: 6 }}>지출 내역이 없어요</p>
              <p style={{ fontSize: 12 }}>지출을 추가하거나 일정에 비용을 입력해보세요</p>
            </div>
          )}
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
