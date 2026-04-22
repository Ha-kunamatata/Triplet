import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './config'

// ──────────────────────────────────────────
// 여행 (Trips)
// ──────────────────────────────────────────

export async function createTrip(userId, data) {
  const ref = await addDoc(collection(db, 'trips'), {
    ...data,
    userId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTrips(userId) {
  const q = query(collection(db, 'trips'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export async function getTrip(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateTrip(tripId, data) {
  await updateDoc(doc(db, 'trips', tripId), { ...data, updatedAt: serverTimestamp() })
}

export async function updateChecklist(tripId, items) {
  await updateDoc(doc(db, 'trips', tripId), { checklist: items })
}

export async function updateTripBudgetData(tripId, { budget, expenses, categoryBudgets }) {
  await updateDoc(doc(db, 'trips', tripId), {
    budget:          budget          ?? 0,
    expenses:        expenses        ?? [],
    categoryBudgets: categoryBudgets ?? {},
    updatedAt:       serverTimestamp(),
  })
}

export async function deleteTrip(tripId) {
  const schedules = await getSchedules(tripId)
  await Promise.all(schedules.map(s => deleteDoc(doc(db, 'schedules', s.id))))
  const diaries = await getDiaries(tripId)
  await Promise.all(diaries.map(d => deleteDoc(doc(db, 'diary', d.id))))
  await deleteDoc(doc(db, 'trips', tripId))
}

// ──────────────────────────────────────────
// 일정 (Schedules)
// ──────────────────────────────────────────

export async function addSchedule(tripId, data) {
  const ref = await addDoc(collection(db, 'schedules'), {
    ...data,
    tripId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

// 복합 인덱스 없이 클라이언트 정렬
export async function getSchedules(tripId) {
  const q = query(collection(db, 'schedules'), where('tripId', '==', tripId))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return (a.startTime || '99:99').localeCompare(b.startTime || '99:99')
  })
}

export async function updateSchedule(scheduleId, data) {
  await updateDoc(doc(db, 'schedules', scheduleId), data)
}

export async function deleteSchedule(scheduleId) {
  await deleteDoc(doc(db, 'schedules', scheduleId))
}

// ──────────────────────────────────────────
// 저장된 장소 (Saved Places)
// ──────────────────────────────────────────

export async function savePlace(userId, data) {
  const ref = await addDoc(collection(db, 'savedPlaces'), {
    ...data,
    userId,
    savedAt: serverTimestamp(),
  })
  return ref.id
}

export async function getSavedPlaces(userId) {
  const q = query(collection(db, 'savedPlaces'), where('userId', '==', userId))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const ta = a.savedAt?.toMillis?.() ?? 0
    const tb = b.savedAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export async function deleteSavedPlace(placeId) {
  await deleteDoc(doc(db, 'savedPlaces', placeId))
}

// ──────────────────────────────────────────
// TripItems (typed: FLIGHT, STAY, PLACE, TRANSPORT, MEMO)
export async function addTripItem(tripId, data) {
  const ref = await addDoc(collection(db, 'tripItems'), {
    ...data,
    tripId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTripItems(tripId) {
  const q = query(collection(db, 'tripItems'), where('tripId', '==', tripId))
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() }))
}

export async function getTripItem(itemId) {
  const snap = await getDoc(doc(db, 'tripItems', itemId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateTripItem(itemId, data) {
  await updateDoc(doc(db, 'tripItems', itemId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteTripItem(itemId) {
  await deleteDoc(doc(db, 'tripItems', itemId))
}

// 여행 일기 (Diary)
// ──────────────────────────────────────────

export async function createDiary(userId, tripId, data) {
  const ref = await addDoc(collection(db, 'diary'), {
    ...data,
    userId,
    tripId,
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getDiaries(tripId) {
  const q = query(collection(db, 'diary'), where('tripId', '==', tripId))
  const snap = await getDocs(q)
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  return docs.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0
    const tb = b.createdAt?.toMillis?.() ?? 0
    return tb - ta
  })
}

export async function getDiary(diaryId) {
  const snap = await getDoc(doc(db, 'diary', diaryId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateDiary(diaryId, data) {
  await updateDoc(doc(db, 'diary', diaryId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteDiary(diaryId) {
  await deleteDoc(doc(db, 'diary', diaryId))
}
