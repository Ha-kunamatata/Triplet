import { useState } from 'react'
import { addTripItem } from '../../firebase/firestore'
import { ITEM_TYPES, ITEM_TYPE_META, TRANSPORT_MODES } from '../../constants'
import { generateDateRange, formatDisplayDate } from '../../utils/dateUtils'
import PlaceSearch from '../maps/PlaceSearch'

const TYPE_CARDS = [
  { type: ITEM_TYPES.PLACE,     emoji: '📍', label: '장소',   desc: '방문할 장소 추가' },
  { type: ITEM_TYPES.STAY,      emoji: '🏨', label: '숙소',   desc: '호텔, 숙박 정보' },
  { type: ITEM_TYPES.FLIGHT,    emoji: '✈️', label: '항공',   desc: '항공편 정보' },
  { type: ITEM_TYPES.TRANSPORT, emoji: '🚗', label: '이동',   desc: '버스/기차/렌터카' },
  { type: ITEM_TYPES.MEMO,      emoji: '📝', label: '메모',   desc: '자유 메모' },
]

export default function QuickAddSheet({ tripId, trip, open, onClose, onAdded }) {
  const [step, setStep] = useState(0)
  const [type, setType] = useState(null)
  const [saving, setSaving] = useState(false)

  if (!open) return null

  const dateList = trip ? generateDateRange(trip.startDate, trip.endDate) : []

  function pickType(t) {
    setType(t)
    setStep(1)
  }

  function handleClose() {
    setStep(0)
    setType(null)
    onClose()
  }

  async function handleSave(data) {
    if (saving) return
    setSaving(true)
    try {
      const id = await addTripItem(tripId, { ...data, type })
      onAdded?.({ id, ...data, type })
      handleClose()
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'flex-end',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={handleClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--c-surface)',
          borderRadius: '20px 20px 0 0',
          maxHeight: '92dvh',
          overflowY: 'auto',
          animation: 'slideUp 0.28s cubic-bezier(0.32,0.72,0,1)',
          paddingBottom: 'calc(var(--safe-bottom) + 16px)',
        }}
      >
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--c-border2)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '8px 20px 16px', borderBottom: '1px solid var(--c-border)' }}>
          {step === 1 && (
            <button onClick={() => setStep(0)} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--c-surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            </button>
          )}
          <h3 style={{ flex: 1, fontSize: 16, fontWeight: 700, color: 'var(--c-text-1)' }}>
            {step === 0 ? '일정 추가' : `${TYPE_CARDS.find(c => c.type === type)?.label} 추가`}
          </h3>
          <button onClick={handleClose} style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'var(--c-surface2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {step === 0 ? (
          <TypePicker onPick={pickType} />
        ) : (
          <FormStep type={type} dateList={dateList} defaultDate={dateList[0]} onSave={handleSave} saving={saving} />
        )}
      </div>

      <style>{`
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
      `}</style>
    </div>
  )
}

/* ── Type picker ── */
function TypePicker({ onPick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, padding: '16px 16px 8px' }}>
      {TYPE_CARDS.map(c => (
        <button
          key={c.type}
          onClick={() => onPick(c.type)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '14px 4px', border: '1.5px solid var(--c-border)', borderRadius: 14,
            background: 'var(--c-surface2)', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-primary)'; e.currentTarget.style.background = 'var(--c-primary-light)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--c-border)'; e.currentTarget.style.background = 'var(--c-surface2)' }}
        >
          <span style={{ fontSize: 26 }}>{c.emoji}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--c-text-1)' }}>{c.label}</span>
        </button>
      ))}
    </div>
  )
}

/* ── Form dispatcher ── */
function FormStep({ type, dateList, defaultDate, onSave, saving }) {
  switch (type) {
    case ITEM_TYPES.PLACE:     return <PlaceForm     dateList={dateList} defaultDate={defaultDate} onSave={onSave} saving={saving} />
    case ITEM_TYPES.STAY:      return <StayForm      dateList={dateList} defaultDate={defaultDate} onSave={onSave} saving={saving} />
    case ITEM_TYPES.FLIGHT:    return <FlightForm    dateList={dateList} defaultDate={defaultDate} onSave={onSave} saving={saving} />
    case ITEM_TYPES.TRANSPORT: return <TransportForm dateList={dateList} defaultDate={defaultDate} onSave={onSave} saving={saving} />
    case ITEM_TYPES.MEMO:      return <MemoForm      dateList={dateList} defaultDate={defaultDate} onSave={onSave} saving={saving} />
    default: return null
  }
}

/* ── Shared sub-components ── */
function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--c-text-2)', marginBottom: 5 }}>{label}</label>}
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', ...rest }) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      {...rest}
      style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--c-border)', borderRadius: 10, fontSize: 15, background: 'var(--c-surface2)', color: 'var(--c-text-1)', boxSizing: 'border-box', outline: 'none' }}
      onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
      onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
    />
  )
}

function DateSelect({ label, value, onChange, dateList }) {
  return (
    <Field label={label}>
      <select value={value} onChange={onChange} style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--c-border)', borderRadius: 10, fontSize: 15, background: 'var(--c-surface2)', color: 'var(--c-text-1)', boxSizing: 'border-box', outline: 'none' }}>
        {dateList.map(d => <option key={d} value={d}>{formatDisplayDate(d)}</option>)}
      </select>
    </Field>
  )
}

function SaveButton({ saving, disabled }) {
  return (
    <button
      type="submit"
      disabled={saving || disabled}
      style={{ width: '100%', padding: '14px', borderRadius: 12, background: saving ? 'var(--c-border2)' : 'var(--c-primary)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', marginTop: 8 }}
    >
      {saving ? '저장 중…' : '저장'}
    </button>
  )
}

/* ── PLACE form ── */
function PlaceForm({ dateList, defaultDate, onSave, saving }) {
  const [placeName, setPlaceName] = useState('')
  const [placeData, setPlaceData] = useState(null)
  const [placeInput, setPlaceInput] = useState('')
  const [date, setDate] = useState(defaultDate || '')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!placeName && !placeData) return
    onSave({
      name: placeData?.place_name || placeName,
      address: placeData?.address || '',
      lat: placeData?.lat || null,
      lng: placeData?.lng || null,
      date, time, notes,
      title: placeData?.place_name || placeName,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
      <Field label="장소 검색">
        <PlaceSearch
          value={placeInput}
          onChange={e => { setPlaceInput(e.target.value); setPlaceName(e.target.value) }}
          onPlaceSelect={p => { setPlaceData(p); setPlaceName(p.place_name); setPlaceInput(p.place_name) }}
          countryContext="auto"
        />
      </Field>
      {dateList.length > 0 && <DateSelect label="날짜" value={date} onChange={e => setDate(e.target.value)} dateList={dateList} />}
      <Field label="시간 (선택)">
        <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
      </Field>
      <Field label="메모 (선택)">
        <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="방문 메모를 입력하세요" />
      </Field>
      <SaveButton saving={saving} disabled={!placeName && !placeData} />
    </form>
  )
}

/* ── STAY form ── */
function StayForm({ dateList, defaultDate, onSave, saving }) {
  const [placeName, setPlaceName] = useState('')
  const [placeData, setPlaceData] = useState(null)
  const [placeInput, setPlaceInput] = useState('')
  const [checkIn, setCheckIn] = useState(defaultDate || '')
  const [checkInTime, setCheckInTime] = useState('15:00')
  const [checkOut, setCheckOut] = useState(dateList[1] || defaultDate || '')
  const [checkOutTime, setCheckOutTime] = useState('11:00')
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!placeName && !placeData) return
    onSave({
      name: placeData?.place_name || placeName,
      address: placeData?.address || '',
      lat: placeData?.lat || null,
      lng: placeData?.lng || null,
      checkIn, checkInTime, checkOut, checkOutTime, notes,
      date: checkIn,
      title: placeData?.place_name || placeName,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
      <Field label="숙소 검색">
        <PlaceSearch
          value={placeInput}
          onChange={e => { setPlaceInput(e.target.value); setPlaceName(e.target.value) }}
          onPlaceSelect={p => { setPlaceData(p); setPlaceName(p.place_name); setPlaceInput(p.place_name) }}
          countryContext="auto"
        />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {dateList.length > 0
          ? <DateSelect label="체크인" value={checkIn} onChange={e => setCheckIn(e.target.value)} dateList={dateList} />
          : <Field label="체크인"><Input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></Field>
        }
        {dateList.length > 0
          ? <DateSelect label="체크아웃" value={checkOut} onChange={e => setCheckOut(e.target.value)} dateList={dateList} />
          : <Field label="체크아웃"><Input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></Field>
        }
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="체크인 시간"><Input type="time" value={checkInTime} onChange={e => setCheckInTime(e.target.value)} /></Field>
        <Field label="체크아웃 시간"><Input type="time" value={checkOutTime} onChange={e => setCheckOutTime(e.target.value)} /></Field>
      </div>
      <Field label="메모 (선택)"><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="예약번호, 연락처 등" /></Field>
      <SaveButton saving={saving} disabled={!placeName && !placeData} />
    </form>
  )
}

/* ── FLIGHT form ── */
function FlightForm({ dateList, defaultDate, onSave, saving }) {
  const [flightNumber, setFlightNumber] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [depDate, setDepDate] = useState(defaultDate || '')
  const [depTime, setDepTime] = useState('')
  const [arrTime, setArrTime] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!from && !to) return
    onSave({
      flightNumber, from, to,
      departureDate: depDate, departureTime: depTime, arrivalTime: arrTime,
      notes, date: depDate,
      title: flightNumber || `${from} → ${to}`,
    })
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
      <Field label="항공편 번호 (선택)">
        <Input value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="예: KE123" />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="출발지"><Input value={from} onChange={e => setFrom(e.target.value)} placeholder="예: ICN, 인천" /></Field>
        <Field label="도착지"><Input value={to} onChange={e => setTo(e.target.value)} placeholder="예: NRT, 도쿄" /></Field>
      </div>
      {dateList.length > 0
        ? <DateSelect label="출발 날짜" value={depDate} onChange={e => setDepDate(e.target.value)} dateList={dateList} />
        : <Field label="출발 날짜"><Input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} /></Field>
      }
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="출발 시간"><Input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} /></Field>
        <Field label="도착 시간"><Input type="time" value={arrTime} onChange={e => setArrTime(e.target.value)} /></Field>
      </div>
      <Field label="메모 (선택)"><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="좌석, 짐 정보 등" /></Field>
      <SaveButton saving={saving} disabled={!from && !to} />
    </form>
  )
}

/* ── TRANSPORT form ── */
function TransportForm({ dateList, defaultDate, onSave, saving }) {
  const [mode, setMode] = useState('car')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [date, setDate] = useState(defaultDate || '')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!from && !to) return
    const modeLabel = TRANSPORT_MODES.find(m => m.key === mode)?.label || mode
    onSave({ mode, from, to, date, time, notes, title: `${modeLabel}: ${from || '?'} → ${to || '?'}` })
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
      <Field label="이동 수단">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {TRANSPORT_MODES.slice(0, 6).map(m => (
            <button
              key={m.key} type="button" onClick={() => setMode(m.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: `1.5px solid ${mode === m.key ? 'var(--c-primary)' : 'var(--c-border)'}`, background: mode === m.key ? 'var(--c-primary-light)' : 'var(--c-surface2)', color: mode === m.key ? 'var(--c-primary)' : 'var(--c-text-2)', fontSize: 13, fontWeight: mode === m.key ? 700 : 400, cursor: 'pointer' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{m.icon}</span>
              {m.label}
            </button>
          ))}
        </div>
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="출발지"><Input value={from} onChange={e => setFrom(e.target.value)} placeholder="출발지" /></Field>
        <Field label="도착지"><Input value={to} onChange={e => setTo(e.target.value)} placeholder="도착지" /></Field>
      </div>
      {dateList.length > 0
        ? <DateSelect label="날짜" value={date} onChange={e => setDate(e.target.value)} dateList={dateList} />
        : <Field label="날짜"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      }
      <Field label="시간 (선택)"><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></Field>
      <Field label="메모 (선택)"><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="예약번호, 비용 등" /></Field>
      <SaveButton saving={saving} disabled={!from && !to} />
    </form>
  )
}

/* ── MEMO form ── */
function MemoForm({ dateList, defaultDate, onSave, saving }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState(defaultDate || '')
  const [content, setContent] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!title) return
    onSave({ title, date, content })
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px 20px' }}>
      <Field label="제목">
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="메모 제목" />
      </Field>
      {dateList.length > 0
        ? <DateSelect label="날짜" value={date} onChange={e => setDate(e.target.value)} dateList={dateList} />
        : <Field label="날짜"><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></Field>
      }
      <Field label="내용 (선택)">
        <textarea
          value={content} onChange={e => setContent(e.target.value)}
          placeholder="메모 내용을 입력하세요"
          rows={4}
          style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--c-border)', borderRadius: 10, fontSize: 15, background: 'var(--c-surface2)', color: 'var(--c-text-1)', boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = 'var(--c-primary)'}
          onBlur={e => e.target.style.borderColor = 'var(--c-border)'}
        />
      </Field>
      <SaveButton saving={saving} disabled={!title} />
    </form>
  )
}
