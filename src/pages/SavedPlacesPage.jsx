import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSavedPlaces, savePlace, deleteSavedPlace } from '../firebase/firestore'
import { SCHEDULE_CATEGORIES } from '../constants'
import AppLayout from '../components/layout/AppLayout'
import EmptyState from '../components/common/EmptyState'
import LoadingSpinner from '../components/common/LoadingSpinner'
import Modal from '../components/common/Modal'
import Toast from '../components/common/Toast'

export default function SavedPlacesPage() {
  const { user } = useAuth()
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', category: 'attraction', memo: '' })
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    getSavedPlaces(user.uid).then(setPlaces).finally(() => setLoading(false))
  }, [user])

  async function handleAdd() {
    if (!form.name) return
    const id = await savePlace(user.uid, form)
    setPlaces(prev => [{ id, ...form, savedAt: new Date() }, ...prev])
    setForm({ name: '', address: '', category: 'attraction', memo: '' })
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

  return (
    <AppLayout>
      {/* Header */}
      <div style={{ padding: '20px 20px 16px', background: 'var(--c-surface)', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 'var(--fw-extrabold)', color: 'var(--c-text-1)', letterSpacing: -0.5 }}>저장한 장소</h1>
          {!loading && places.length > 0 && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 2 }}>{places.length}곳</p>
          )}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            width: 44, height: 44, borderRadius: 'var(--r-xl)',
            background: 'var(--c-primary)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: 'var(--shadow-primary)', transition: 'transform var(--t-fast)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
          onMouseLeave={e => e.currentTarget.style.transform = ''}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : places.length === 0 ? (
        <EmptyState
          icon="bookmark"
          title="저장한 장소가 없어요"
          description="가고 싶은 장소를 저장해보세요"
          action="장소 추가"
          onAction={() => setShowAdd(true)}
        />
      ) : (
        <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {places.map(p => {
            const cat = SCHEDULE_CATEGORIES.find(c => c.key === p.category) ?? SCHEDULE_CATEGORIES.at(-1)
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--c-surface)', borderRadius: 'var(--r-xl)',
                  padding: '14px 16px', boxShadow: 'var(--shadow-sm)',
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  transition: 'box-shadow var(--t-fast)',
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 'var(--r-lg)',
                  background: cat.color + '18',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 22, color: cat.color, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--fw-bold)', color: 'var(--c-text-1)' }}>{p.name}</p>
                  {p.address && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-3)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>location_on</span>
                      {p.address}
                    </p>
                  )}
                  {p.memo && (
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--c-text-2)', marginTop: 5, fontStyle: 'italic', lineHeight: 1.5 }}>{p.memo}</p>
                  )}
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 7,
                    fontSize: 'var(--text-xs)', color: cat.color, fontWeight: 'var(--fw-semibold)',
                    background: cat.color + '10', padding: '2px 8px', borderRadius: 'var(--r-full)',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 10, fontVariationSettings: "'FILL' 1" }}>{cat.icon}</span>
                    {cat.label}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => setDeleteTarget(p.id)}
                  style={{ width: 30, height: 30, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--c-text-3)', flexShrink: 0, transition: 'background var(--t-fast), color var(--t-fast)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.color = 'var(--c-error)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = 'var(--c-text-3)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 17 }}>delete</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add place modal */}
      {showAdd && (
        <Modal title="장소 저장" onClose={() => setShowAdd(false)} confirmLabel="저장" onConfirm={handleAdd}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={lbl}>장소명 *</label>
              <input value={form.name} onChange={set('name')} placeholder="예) 신주쿠 공원" style={{ ...inp, marginTop: 6 }} />
            </div>
            <div>
              <label style={lbl}>주소</label>
              <input value={form.address} onChange={set('address')} placeholder="선택 사항" style={{ ...inp, marginTop: 6 }} />
            </div>
            <div>
              <label style={lbl}>카테고리</label>
              <select value={form.category} onChange={set('category')} style={{ ...inp, marginTop: 6 }}>
                {SCHEDULE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
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
    </AppLayout>
  )
}

const lbl = { fontSize: 'var(--text-xs)', fontWeight: 'var(--fw-semibold)', color: 'var(--c-text-2)', display: 'block' }
const inp = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--c-border)', borderRadius: 'var(--r-lg)', fontSize: 'var(--text-sm)', outline: 'none', boxSizing: 'border-box', background: 'var(--c-surface2)', color: 'var(--c-text-1)', display: 'block', fontFamily: 'var(--font)' }
