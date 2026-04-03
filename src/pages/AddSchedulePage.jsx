import { useState, useEffect, useCallback, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  addSchedule, updateSchedule, getSchedules,
  addTripItem, updateTripItem, getTripItem,
} from '../firebase/firestore'
import PageHeader from '../components/layout/PageHeader'
import PlaceSearch from '../components/maps/PlaceSearch'
import {
  SCHEDULE_CATEGORIES, ITEM_TYPES, ITEM_TYPE_META,
  AIRLINES, AIRPORTS, TRANSPORT_MODES,
} from '../constants'
import { getFlightDuration, formatDuration, getAirportTimezone } from '../utils/timezoneUtils'

/* ── 공용 스타일 ─────────────────────────────────────── */
const inp = {
  width: '100%', height: 48, padding: '0 14px',
  border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)',
  fontSize: 15, outline: 'none', boxSizing: 'border-box', display: 'block',
  background: 'var(--c-surface2)', color: 'var(--c-text-1)',
  transition: 'border-color 0.15s', fontFamily: 'var(--font)',
}
const lbl = { fontSize: 12, fontWeight: 600, color: 'var(--c-text-2)', display: 'block', marginBottom: 6 }
const row = { display: 'flex', gap: 10 }
const col = { display: 'flex', flexDirection: 'column', gap: 14 }

function Field({ label, children }) {
  return <div><label style={lbl}>{label}</label>{children}</div>
}

function TextInput({ label, value, onChange, placeholder, type = 'text', accent, ...rest }) {
  return (
    <Field label={label}>
      <input
        type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={inp}
        onFocus={e => { if (accent) e.target.style.borderColor = accent }}
        onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
        {...rest}
      />
    </Field>
  )
}

function Textarea({ label, value, onChange, placeholder, accent }) {
  return (
    <Field label={label}>
      <textarea
        value={value} onChange={onChange} placeholder={placeholder} rows={3}
        style={{ ...inp, height: 'auto', resize: 'none', lineHeight: 1.7, paddingTop: 12, paddingBottom: 12 }}
        onFocus={e => { if (accent) e.target.style.borderColor = accent }}
        onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
      />
    </Field>
  )
}

function FormCard({ label, icon, color, children }) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 16, padding: '16px 18px', boxShadow: '0 1px 8px rgba(15,23,42,0.06)', border: '1px solid var(--c-border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 15, color: color || 'var(--c-text-3)', fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-text-3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      </div>
      <div style={col}>{children}</div>
    </div>
  )
}

/* ── 공항 검색 자동완성 ──────────────────────────────── */
function AirportInput({ label, value, onChange, accent }) {
  const [query, setQuery] = useState(value?.code ? `${value.code} – ${value.city}` : '')
  const [open, setOpen] = useState(false)

  const results = useMemo(() => {
    const q = query.toLowerCase()
    if (!q || q.length < 1) return []
    return AIRPORTS.filter(a =>
      a.code.toLowerCase().includes(q) ||
      a.city.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q)
    ).slice(0, 7)
  }, [query])

  function select(airport) {
    setQuery(`${airport.code} – ${airport.city}`)
    setOpen(false)
    onChange(airport)
  }

  return (
    <Field label={label}>
      <div style={{ position: 'relative' }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(null) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="공항 코드 또는 도시 (예: ICN, 파리)"
          style={inp}
          onFocusCapture={e => { if (accent) e.target.style.borderColor = accent }}
          onBlurCapture={e => e.target.style.borderColor = 'var(--c-border)'}
        />
        {open && results.length > 0 && (
          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200, background: 'var(--c-surface)', border: '1.5px solid var(--c-border)', borderRadius: 12, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(15,23,42,0.12)' }}>
            {results.map(a => (
              <div key={a.code} onMouseDown={() => select(a)}
                style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--c-surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--c-text-1)' }}>{a.code}</span>
                  <span style={{ fontSize: 13, color: 'var(--c-text-2)', marginLeft: 8 }}>{a.city} · {a.name}</span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--c-text-3)' }}>{a.country}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Field>
  )
}

/* ── 항공사 자동 식별 ────────────────────────────────── */
function detectAirline(flightNumber) {
  const code = flightNumber?.slice(0, 2).toUpperCase()
  return AIRLINES.find(a => a.code === code) ?? null
}

/* ────────────────────────────────────────────────────────
   FLIGHT FORM
──────────────────────────────────────────────────────── */
function FlightForm({ form, set, accent }) {
  const airline = detectAirline(form.flightNumber)
  const duration = getFlightDuration(form.departureTime, form.arrivalTime, form.departureTZ, form.arrivalTZ)

  // 공항 선택 시 타임존 자동 설정
  function handleDepAirport(airport) {
    set('departureAirport')(airport?.code ?? '')
    set('departureTZ')(airport?.tz ?? '')
  }
  function handleArrAirport(airport) {
    set('arrivalAirport')(airport?.code ?? '')
    set('arrivalTZ')(airport?.tz ?? '')
  }

  return (
    <>
      <FormCard label="항공편 정보" icon="flight" color={accent}>
        <Field label="편명 *">
          <div style={{ position: 'relative' }}>
            <input
              value={form.flightNumber}
              onChange={e => set('flightNumber')(e)}
              placeholder="예: KE907, OZ501"
              style={{ ...inp, paddingRight: airline ? 120 : 14 }}
              onFocus={e => e.target.style.borderColor = accent}
              onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
            />
            {airline && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: accent, background: accent + '18', padding: '3px 10px', borderRadius: 20 }}>
                {airline.name}
              </span>
            )}
          </div>
        </Field>

        <div style={row}>
          <div style={{ flex: 1 }}>
            <AirportInput label="출발 공항 *" value={{ code: form.departureAirport }} onChange={handleDepAirport} accent={accent} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: accent }}>flight_takeoff</span>
          </div>
          <div style={{ flex: 1 }}>
            <AirportInput label="도착 공항 *" value={{ code: form.arrivalAirport }} onChange={handleArrAirport} accent={accent} />
          </div>
        </div>

        <div style={row}>
          <div style={{ flex: 1 }}>
            <Field label="출발 일시 *">
              <input type="datetime-local" value={form.departureTime} onChange={set('departureTime')}
                style={inp} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="도착 일시 *">
              <input type="datetime-local" value={form.arrivalTime} onChange={set('arrivalTime')}
                style={inp} onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
        </div>

        {duration && (
          <div style={{ background: accent + '12', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: accent }}>schedule</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>실제 비행 시간: {formatDuration(duration)}</span>
          </div>
        )}
      </FormCard>

      <FormCard label="예약 정보" icon="confirmation_number" color={accent}>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <TextInput label="예약 확인번호" value={form.bookingRef} onChange={set('bookingRef')} placeholder="예: ABC123" accent={accent} />
          </div>
          <div style={{ flex: 1 }}>
            <TextInput label="좌석번호" value={form.seatNumber} onChange={set('seatNumber')} placeholder="예: 32A" accent={accent} />
          </div>
        </div>
        <TextInput label="터미널" value={form.terminal} onChange={set('terminal')} placeholder="예: T2" accent={accent} />
        <Textarea label="메모" value={form.notes} onChange={set('notes')} placeholder="수하물 안내, 탑승 게이트 등..." accent={accent} />
      </FormCard>
    </>
  )
}

/* ────────────────────────────────────────────────────────
   STAY FORM
──────────────────────────────────────────────────────── */
function StayForm({ form, set, accent }) {
  const nights = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0
    const diff = new Date(form.checkOut) - new Date(form.checkIn)
    return Math.max(0, Math.round(diff / 86400000))
  }, [form.checkIn, form.checkOut])

  const handlePlaceSelect = useCallback(({ name, address, lat, lng }) => {
    set('name')({ target: { value: name } })
    set('address')({ target: { value: address } })
    set('lat')({ target: { value: lat } })
    set('lng')({ target: { value: lng } })
  }, [set])

  return (
    <>
      <FormCard label="숙소 정보" icon="hotel" color={accent}>
        <Field label="숙소명 검색 *">
          <PlaceSearch
            value={form.name}
            onChange={e => {
              set('name')(e)
              set('address')({ target: { value: '' } })
              set('lat')({ target: { value: null } })
              set('lng')({ target: { value: null } })
            }}
            onPlaceSelect={handlePlaceSelect}
          />
        </Field>
        {form.address && (
          <p style={{ fontSize: 12, color: 'var(--c-text-3)', marginTop: -6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>{form.address}
          </p>
        )}
      </FormCard>

      <FormCard label="체크인 / 체크아웃" icon="calendar_month" color={accent}>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <Field label="체크인 날짜 *">
              <input type="date" value={form.checkIn} onChange={set('checkIn')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="체크아웃 날짜 *">
              <input type="date" value={form.checkOut} onChange={set('checkOut')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
        </div>

        {nights > 0 && (
          <div style={{ background: accent + '12', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: accent }}>bedtime</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: accent }}>{nights}박 {nights + 1}일</span>
          </div>
        )}

        <div style={row}>
          <div style={{ flex: 1 }}>
            <Field label="체크인 시간">
              <input type="time" value={form.checkInTime} onChange={set('checkInTime')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="체크아웃 시간">
              <input type="time" value={form.checkOutTime} onChange={set('checkOutTime')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
        </div>
      </FormCard>

      <FormCard label="예약 정보" icon="confirmation_number" color={accent}>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <TextInput label="예약 확인번호" value={form.bookingRef} onChange={set('bookingRef')} placeholder="예약번호" accent={accent} />
          </div>
          <div style={{ flex: 1 }}>
            <TextInput label="요금 (원)" value={form.cost} onChange={set('cost')} type="number" placeholder="0" accent={accent} />
          </div>
        </div>
        <TextInput label="전화번호" value={form.phone} onChange={set('phone')} placeholder="+33 1 23 45 67 89" accent={accent} />
        <TextInput label="웹사이트" value={form.website} onChange={set('website')} placeholder="https://..." accent={accent} />
        <Textarea label="메모" value={form.notes} onChange={set('notes')} placeholder="조식 포함 여부, 주차 안내 등..." accent={accent} />
      </FormCard>
    </>
  )
}

/* ────────────────────────────────────────────────────────
   PLACE FORM
──────────────────────────────────────────────────────── */
function PlaceForm({ form, set, accent }) {
  const handlePlaceSelect = useCallback(({ name, address, lat, lng }) => {
    set('title')({ target: { value: name } })
    set('address')({ target: { value: address } })
    set('lat')({ target: { value: lat } })
    set('lng')({ target: { value: lng } })
  }, [set])

  return (
    <>
      <FormCard label="카테고리" icon="category" color={accent}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
          {SCHEDULE_CATEGORIES.map(c => {
            const active = form.category === c.key
            return (
              <button key={c.key} type="button"
                onClick={() => set('category')({ target: { value: c.key } })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  borderRadius: 20, fontSize: 13,
                  background: active ? c.color + '18' : 'var(--c-surface2)',
                  border: `1.5px solid ${active ? c.color : 'transparent'}`,
                  color: active ? c.color : 'var(--c-text-2)',
                  fontWeight: active ? 700 : 500, transition: 'all 0.15s',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{c.icon}</span>
                {c.label}
              </button>
            )
          })}
        </div>
      </FormCard>

      <FormCard label="장소 정보" icon="location_on" color={accent}>
        <Field label="장소명 *">
          <PlaceSearch
            value={form.title}
            onChange={e => { set('title')(e); set('address')({ target: { value: '' } }); set('lat')({ target: { value: null } }); set('lng')({ target: { value: null } }) }}
            onPlaceSelect={handlePlaceSelect}
          />
        </Field>
        {form.address && (
          <p style={{ fontSize: 12, color: 'var(--c-text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>location_on</span>{form.address}
          </p>
        )}
      </FormCard>

      <FormCard label="방문 일시" icon="schedule" color={accent}>
        <Field label="날짜 *">
          <input type="date" value={form.date} onChange={set('date')} style={inp}
            onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
          />
        </Field>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <Field label="방문 시간">
              <input type="time" value={form.visitTime} onChange={set('visitTime')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="종료 시간">
              <input type="time" value={form.endTime} onChange={set('endTime')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
        </div>
      </FormCard>

      <FormCard label="비용 & 메모" icon="receipt_long" color={accent}>
        <Field label="예산 (원)">
          <div style={{ position: 'relative' }}>
            <input type="number" value={form.cost} onChange={set('cost')} placeholder="0"
              style={{ ...inp, paddingRight: 40 }}
              onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
            />
            <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--c-text-3)', fontWeight: 700 }}>원</span>
          </div>
        </Field>
        <Textarea label="메모" value={form.notes} onChange={set('notes')} placeholder="예약 정보, 운영 시간, 팁 등..." accent={accent} />
      </FormCard>
    </>
  )
}

/* ────────────────────────────────────────────────────────
   TRANSPORT FORM
──────────────────────────────────────────────────────── */
function TransportForm({ form, set, accent }) {
  return (
    <>
      <FormCard label="이동 수단" icon="directions_car" color={accent}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRANSPORT_MODES.map(m => {
            const active = form.mode === m.key
            return (
              <button key={m.key} type="button"
                onClick={() => set('mode')({ target: { value: m.key } })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                  borderRadius: 20, fontSize: 13,
                  background: active ? accent + '18' : 'var(--c-surface2)',
                  border: `1.5px solid ${active ? accent : 'transparent'}`,
                  color: active ? accent : 'var(--c-text-2)',
                  fontWeight: active ? 700 : 500, transition: 'all 0.15s',
                }}>
                <span className="material-symbols-outlined" style={{ fontSize: 14, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{m.icon}</span>
                {m.label}
              </button>
            )
          })}
        </div>
      </FormCard>

      <FormCard label="출발 / 도착" icon="swap_vert" color={accent}>
        <TextInput label="출발지" value={form.fromName} onChange={set('fromName')} placeholder="출발 장소" accent={accent} />
        <TextInput label="목적지" value={form.toName} onChange={set('toName')} placeholder="도착 장소" accent={accent} />
        <div style={row}>
          <div style={{ flex: 1 }}>
            <Field label="출발 일시">
              <input type="datetime-local" value={form.departureTime} onChange={set('departureTime')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="도착 일시">
              <input type="datetime-local" value={form.arrivalTime} onChange={set('arrivalTime')} style={inp}
                onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
              />
            </Field>
          </div>
        </div>
      </FormCard>

      <FormCard label="기타 정보" icon="receipt_long" color={accent}>
        <div style={row}>
          <div style={{ flex: 1 }}>
            <TextInput label="예약 확인번호" value={form.bookingRef} onChange={set('bookingRef')} placeholder="예약번호" accent={accent} />
          </div>
          <div style={{ flex: 1 }}>
            <TextInput label="요금 (원)" value={form.cost} onChange={set('cost')} type="number" placeholder="0" accent={accent} />
          </div>
        </div>
        <Textarea label="메모" value={form.notes} onChange={set('notes')} placeholder="플랫폼 번호, 좌석 등..." accent={accent} />
      </FormCard>
    </>
  )
}

/* ────────────────────────────────────────────────────────
   MEMO FORM
──────────────────────────────────────────────────────── */
const MEMO_COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6', '#EC4899']

function MemoForm({ form, set, accent }) {
  return (
    <FormCard label="메모" icon="sticky_note_2" color={accent}>
      <TextInput label="제목 *" value={form.title} onChange={set('title')} placeholder="메모 제목" accent={accent} />
      <Field label="날짜">
        <input type="date" value={form.date} onChange={set('date')} style={inp}
          onFocus={e => e.target.style.borderColor = accent} onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
        />
      </Field>
      <Field label="색상">
        <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
          {MEMO_COLORS.map(c => (
            <button key={c} type="button" onClick={() => set('color')({ target: { value: c } })}
              style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: form.color === c ? `3px solid var(--c-text-1)` : '3px solid transparent', transition: 'border 0.1s' }}
            />
          ))}
        </div>
      </Field>
      <Textarea label="내용" value={form.content} onChange={set('content')} placeholder="자유롭게 메모하세요..." accent={accent} />
    </FormCard>
  )
}

/* ────────────────────────────────────────────────────────
   타입 선택 화면
──────────────────────────────────────────────────────── */
function TypePicker({ onSelect, onBack }) {
  const types = [
    { type: ITEM_TYPES.FLIGHT,    desc: '항공편 출발/도착 시간, 좌석 등' },
    { type: ITEM_TYPES.STAY,      desc: '호텔, 숙소 체크인/아웃' },
    { type: ITEM_TYPES.PLACE,     desc: '방문 장소, 식당, 카페 등' },
    { type: ITEM_TYPES.TRANSPORT, desc: '기차, 버스, 렌터카 등' },
    { type: ITEM_TYPES.MEMO,      desc: '자유 메모, 알림 사항' },
  ]
  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <div style={{ borderBottom: '1px solid var(--c-border)' }}>
        <PageHeader title="무엇을 추가할까요?" onBack={onBack} noBorder />
      </div>
      <div style={{ padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {types.map(({ type, desc }) => {
          const meta = ITEM_TYPE_META[type]
          return (
            <button key={type} onClick={() => onSelect(type)}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                background: 'var(--c-surface)', border: `1.5px solid ${meta.color}30`,
                borderRadius: 16, textAlign: 'left', transition: 'all 0.15s',
                boxShadow: '0 2px 8px rgba(15,23,42,0.06)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = meta.color; e.currentTarget.style.boxShadow = `0 4px 16px ${meta.color}30` }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = `${meta.color}30`; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)' }}
            >
              <div style={{ width: 48, height: 48, borderRadius: 14, background: meta.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: meta.color, fontVariationSettings: "'FILL' 1" }}>{meta.icon}</span>
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text-1)' }}>{meta.label}</p>
                <p style={{ fontSize: 13, color: 'var(--c-text-3)', marginTop: 2 }}>{desc}</p>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--c-text-3)', marginLeft: 'auto' }}>chevron_right</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ────────────────────────────────────────────────────────
   MAIN: AddSchedulePage
──────────────────────────────────────────────────────── */
export default function AddSchedulePage() {
  const { tripId, scheduleId, itemId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  // 기존 스케줄 편집 모드
  const isLegacyEdit = !!scheduleId
  const isItemEdit = !!itemId
  const isEdit = isLegacyEdit || isItemEdit

  const initDate = location.state?.date ?? ''
  const initType = location.state?.type ?? null

  const [itemType, setItemType] = useState(initType) // null → 타입 선택 화면
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEdit)

  // 편집 시 기존 데이터 로드
  useEffect(() => {
    if (!isEdit) return
    const load = async () => {
      try {
        if (isItemEdit) {
          const item = await getTripItem(itemId)
          if (item) { setItemType(item.type); setForm(item) }
        } else {
          // 기존 스케줄 (legacy PLACE 타입)
          const all = await getSchedules(tripId)
          const s = all.find(x => x.id === scheduleId)
          if (s) {
            setItemType(ITEM_TYPES.PLACE)
            setForm({
              title: s.title, category: s.category ?? 'attraction',
              date: s.date, visitTime: s.startTime ?? '', endTime: s.endTime ?? '',
              address: s.place ?? '', lat: s.lat ?? null, lng: s.lng ?? null,
              notes: s.memo ?? '', cost: s.cost ?? 0,
            })
          }
        }
      } finally { setLoading(false) }
    }
    load()
  }, [isEdit, isItemEdit, itemId, scheduleId, tripId])

  // form setter
  const set = useCallback((key) => (e) => {
    const val = e?.target !== undefined ? e.target.value : e
    setForm(prev => ({ ...prev, [key]: val }))
  }, [])

  function handleTypeSelect(type) {
    setItemType(type)
    // 날짜 초기값 세팅
    const defaults = {
      [ITEM_TYPES.FLIGHT]:    { departureTime: initDate ? `${initDate}T09:00` : '', arrivalTime: '', departureTZ: 'Asia/Seoul', arrivalTZ: '', date: initDate },
      [ITEM_TYPES.STAY]:      { checkIn: initDate, checkOut: '', checkInTime: '15:00', checkOutTime: '11:00', date: initDate, name: '', address: '', lat: null, lng: null, bookingRef: '', phone: '', website: '', notes: '', cost: 0 },
      [ITEM_TYPES.PLACE]:     { title: '', category: 'attraction', date: initDate, visitTime: '', endTime: '', address: '', lat: null, lng: null, notes: '', cost: 0 },
      [ITEM_TYPES.TRANSPORT]: { mode: 'train', fromName: '', toName: '', departureTime: initDate ? `${initDate}T09:00` : '', arrivalTime: '', bookingRef: '', notes: '', cost: 0, date: initDate },
      [ITEM_TYPES.MEMO]:      { title: '', content: '', color: '#F59E0B', date: initDate },
    }
    setForm(defaults[type] ?? {})
  }

  async function handleSubmit(e) {
    e?.preventDefault()
    setSaving(true)
    try {
      const data = { ...form, type: itemType, order: form.order ?? Date.now() }

      if (isLegacyEdit) {
        // 기존 schedules 컬렉션 업데이트 (legacy)
        await updateSchedule(scheduleId, {
          title: data.title, category: data.category ?? 'attraction',
          date: data.date, startTime: data.visitTime ?? '',
          endTime: data.endTime ?? '', place: data.address ?? '',
          lat: data.lat, lng: data.lng,
          memo: data.notes ?? '', cost: Number(data.cost) || 0,
        })
      } else if (isItemEdit) {
        await updateTripItem(itemId, data)
      } else {
        await addTripItem(tripId, data)
      }
      navigate(`/trips/${tripId}`)
    } finally { setSaving(false) }
  }

  function isValid() {
    switch (itemType) {
      case ITEM_TYPES.FLIGHT:    return !!form.flightNumber && !!form.departureTime
      case ITEM_TYPES.STAY:      return !!form.name && !!form.checkIn
      case ITEM_TYPES.PLACE:     return !!form.title && !!form.date
      case ITEM_TYPES.TRANSPORT: return !!form.fromName && !!form.toName
      case ITEM_TYPES.MEMO:      return !!form.title
      default: return false
    }
  }

  if (loading) return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--c-border)', borderTopColor: 'var(--c-primary)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (!itemType) return (
    <TypePicker
      onSelect={handleTypeSelect}
      onBack={() => navigate(-1)}
    />
  )

  const meta = ITEM_TYPE_META[itemType] ?? {}
  const accent = meta.color ?? 'var(--c-primary)'

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--c-bg)' }}>
      <div style={{ background: `linear-gradient(135deg,${accent}20,${accent}08)`, borderBottom: `3px solid ${accent}` }}>
        <PageHeader
          title={isEdit ? `${meta.label} 수정` : `${meta.label} 추가`}
          onBack={() => isEdit ? navigate(-1) : setItemType(null)}
          noBorder
          actions={
            <button onClick={handleSubmit} disabled={saving || !isValid()} style={{
              padding: '8px 20px', borderRadius: 20,
              background: isValid() ? accent : 'var(--c-border2)',
              color: '#fff', fontSize: 13, fontWeight: 700,
              boxShadow: isValid() ? `0 4px 14px ${accent}55` : 'none',
              transition: 'all 0.15s',
            }}>
              {saving ? '저장 중...' : isEdit ? '수정 완료' : '추가'}
            </button>
          }
        />
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {itemType === ITEM_TYPES.FLIGHT    && <FlightForm    form={form} set={set} accent={accent} />}
        {itemType === ITEM_TYPES.STAY      && <StayForm      form={form} set={set} accent={accent} />}
        {itemType === ITEM_TYPES.PLACE     && <PlaceForm     form={form} set={set} accent={accent} />}
        {itemType === ITEM_TYPES.TRANSPORT && <TransportForm form={form} set={set} accent={accent} />}
        {itemType === ITEM_TYPES.MEMO      && <MemoForm      form={form} set={set} accent={accent} />}

        <button type="submit" disabled={saving || !isValid()} style={{
          width: '100%', padding: 16, marginTop: 4,
          background: isValid() ? accent : 'var(--c-border2)',
          color: '#fff', borderRadius: 14,
          fontSize: 15, fontWeight: 800,
          boxShadow: isValid() ? `0 4px 14px ${accent}50` : 'none',
          transition: 'all 0.15s',
        }}>
          {saving ? '저장 중...' : isEdit ? `✏️ 수정 완료` : `✅ ${meta.label} 추가`}
        </button>
      </form>
    </div>
  )
}
