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
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>저장한 장소</h1>
        <button onClick={() => setShowAdd(true)} style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>add</span>
        </button>
      </div>

      {loading ? <LoadingSpinner /> : places.length === 0 ? (
        <EmptyState icon="bookmark" title="저장한 장소가 없어요" description="가고 싶은 장소를 저장해보세요" action="장소 추가" onAction={() => setShowAdd(true)} />
      ) : (
        <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {places.map(p => {
            const cat = SCHEDULE_CATEGORIES.find(c => c.key === p.category) ?? SCHEDULE_CATEGORIES.at(-1)
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 'var(--radius-lg)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-md)', background: cat.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: cat.color }}>{cat.icon}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700 }}>{p.name}</p>
                  {p.address && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{p.address}</p>}
                  {p.memo && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4, fontStyle: 'italic' }}>{p.memo}</p>}
                </div>
                <button onClick={() => setDeleteTarget(p.id)} style={{ padding: 4, color: 'var(--text-disabled)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* 장소 추가 모달 */}
      {showAdd && (
        <Modal title="장소 저장" onClose={() => setShowAdd(false)} confirmLabel="저장" onConfirm={handleAdd}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={form.name} onChange={set('name')} placeholder="장소명 *" style={inp} />
            <input value={form.address} onChange={set('address')} placeholder="주소 (선택)" style={inp} />
            <select value={form.category} onChange={set('category')} style={inp}>
              {SCHEDULE_CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input value={form.memo} onChange={set('memo')} placeholder="메모 (선택)" style={inp} />
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="장소를 삭제할까요?" onClose={() => setDeleteTarget(null)} confirmLabel="삭제" onConfirm={handleDelete} danger>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>저장된 장소가 삭제됩니다.</p>
        </Modal>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </AppLayout>
  )
}

const inp = { width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)', fontSize: 14, outline: 'none', boxSizing: 'border-box' }
