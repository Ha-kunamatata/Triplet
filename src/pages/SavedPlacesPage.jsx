import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSavedPlaces, savePlace, deleteSavedPlace } from '../firebase/firestore'
import { SCHEDULE_CATEGORIES } from '../constants'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'
import PlaceSearch from '../components/maps/PlaceSearch'

const ALL = { key: 'all', label: '전체', icon: 'apps', color: 'var(--c-primary)' }

export default function SavedPlacesPage() {
  const { user } = useAuth()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [form, setForm] = useState({ name: '', address: '', lat: null, lng: null, category: 'attraction', memo: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getSavedPlaces(user.uid).then(setPlaces).finally(() => setLoading(false))
  }, [user])

  async function handleAdd() {
    if (!form.name) return
    const id = await savePlace(user.uid, form)
    setPlaces(prev => [{ id, ...form, savedAt: new Date() }, ...prev])
    setForm({ name: '', address: '', lat: null, lng: null, category: 'attraction', memo: '' })
    setShowAdd(false)
    setToast({ message: '장소가 저장되었습니다.', type: 'success' })
  }

  async function handleDelete() {
    await deleteSavedPlace(deleteTarget)
    setPlaces(prev => prev.filter(p => p.id !== deleteTarget))
    setDeleteTarget(null)
    setToast({ message: '장소가 삭제되었습니다.' })
  }

  const set = key => e => setForm(p => ({ ...p, [key]: e.target.value }))

  const filtered = activeFilter === 'all' ? places : places.filter(p => p.category === activeFilter)
  const usedCategories = [ALL, ...SCHEDULE_CATEGORIES.filter(c => places.some(p => p.category === c.key))]

  return (
      <div style={{ minHeight: '100%' }}>
      {/* ── Header ── */}
      <div style={{ background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', padding: '20px 20px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', letterSpacing: -0.5 }}>저장한 장소</h1>
            {!loading && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 3 }}>
                {places.length > 0 ? `총 ${places.length}곳` : '아직 저장된 장소가 없어요'}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, height: 44, padding: '0 16px', borderRadius: 'var(--r-xl)', background: 'var(--c-primary)', color: '#fff', fontSize: 'var(--text-sm)', fontWeight: 'var(--fw-bold)', boxShadow: 'var(--shadow-primary)', flexShrink: 0, transition: 'transform var(--t-fast)' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = ''}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>add_location</span>
            장소 추가
          </button>
        </div>

        {/* Category filter tabs */}
        {places.length > 0 && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 12, scrollbarWidth: 'none' }}>
            {usedCategories.map(c => {
              const active = activeFilter === c.key
              return (
                <button key={c.key} onClick={() => setActiveFilter(c.key)} style={{
                  flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 'var(--r-full)',
                  background: active ? c.color + '18' : 'var(--c-surface2)',
                  border: `1.5px solid ${active ? c.color : 'transparent'}`,
                  color: active ? c.color : 'var(--c-text-2)',
                  fontSize: 'var(--text-xs)', fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-medium)',
                  transition: 'all var(--t-fast)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}>{c.icon}</span>
                  {c.label}
                  {c.key !== 'all' && <span style={{ fontSize: 10, background: active ? c.color + '25' : 'var(--c-border)', borderRadius: 'var(--r-full)', padding: '1px 6px', fontWeight: 700, color: active ? c.color : 'var(--c-text-3)' }}>{places.filter(p => p.category === c.key).length}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title={activeFilter === 'all' ? '저장한 장소가 없어요' : '해당 카테고리에 장소가 없어요'}
          description="가고 싶은 장소를 미리 저장해보세요"
          action="장소 추가"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(p => {
            const cat = SCHEDULE_CATEGORIES.find(c => c.key === p.category) ?? SCHEDULE_CATEGORIES.at(-1)
            return (
              <div key={p.id} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--c-border)', display: 'flex', transition: 'box-shadow var(--t-fast)' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow-sm)'}
              >
                {/* Color stripe */}
                <div style={{ width: 4, background: cat.color, flexShrink: 0 }} />

                {/* Icon */}
                <div style={{ width: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 'var(--r-lg)', background: cat.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 20, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                  </div>
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '14px 10px 14px 0', minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</p>
                      {p.address && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: 11, flexShrink: 0 }}>location_on</span>{p.address}
                        </p>
                      )}
                      {p.memo && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', marginTop: 5, fontStyle: 'italic', lineHeight: 1.5 }}>{p.memo}</p>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginLeft: 8, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, background: cat.color + '18', color: cat.color, padding: '2px 8px', borderRadius: 'var(--r-full)', fontWeight: 700, textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {cat.label}
                      </span>
                      <button
                        onClick={() => setDeleteTarget(p.id)}
                        style={{ width: 28, height: 28, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', alignSelf: 'center', transition: 'all var(--t-fast)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--c-error)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Add place modal ── */}
      {showAdd && (
        <Modal title="장소 저장" onClose={() => setShowAdd(false)} confirmLabel="저장" onConfirm={handleAdd}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={lbl}>장소 검색 *</label>
              <div style={{ marginTop: 6 }}>
                <PlaceSearch
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value, address: '', lat: null, lng: null }))}
                  onPlaceSelect={({ name, address, lat, lng }) => setForm(p => ({ ...p, name, address, lat, lng }))}
                />
              </div>
            </div>

            <div>
              <label style={lbl}>카테고리</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                {SCHEDULE_CATEGORIES.map(c => (
                  <button key={c.key} type="button" onClick={() => setForm(p => ({ ...p, category: c.key }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 'var(--r-full)', fontSize: 12, fontWeight: 600,
                      background: form.category === c.key ? c.color + '18' : 'var(--c-surface2)',
                      border: `1.5px solid ${form.category === c.key ? c.color : 'transparent'}`,
                      color: form.category === c.key ? c.color : 'var(--c-text-2)',
                    }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 13, fontVariationSettings: "'FILL' 1" }}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={lbl}>메모</label>
              <input value={form.memo} onChange={set('memo')} placeholder="선택 사항" style={{ ...inp, marginTop: 6 }} />
            </div>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="장소를 삭제할까요?" onClose={() => setDeleteTarget(null)} confirmLabel="삭제" onConfirm={handleDelete} danger>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--c-text-2)' }}>저장된 장소가 삭제됩니다.</p>
        </Modal>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block' }
const inp = { width: '100%', height: 44, padding: '0 14px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-surface2)', color: 'var(--c-text-1)', fontFamily: 'var(--font)', display: 'block' }
