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
  orderBy,
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
    status: 'upcoming',
    createdAt: serverTimestamp(),
  })
  return ref.id
}

export async function getTrips(userId) {
  const q = query(
    collection(db, 'trips'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getTrip(tripId) {
  const snap = await getDoc(doc(db, 'trips', tripId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function updateTrip(tripId, data) {
  await updateDoc(doc(db, 'trips', tripId), { ...data, updatedAt: serverTimestamp() })
}

export async function deleteTrip(tripId) {
  // 일정도 함께 삭제
  const schedules = await getSchedules(tripId)
  await Promise.all(schedules.map((s) => deleteDoc(doc(db, 'schedules', s.id))))
  // 일기도 함께 삭제
  const diaries = await getDiaries(tripId)
  await Promise.all(diaries.map((d) => deleteDoc(doc(db, 'diary', d.id))))
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

export async function getSchedules(tripId) {
  const q = query(
    collection(db, 'schedules'),
    where('tripId', '==', tripId),
    orderBy('date', 'asc'),
    orderBy('order', 'asc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
  const q = query(
    collection(db, 'savedPlaces'),
    where('userId', '==', userId),
    orderBy('savedAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteSavedPlace(placeId) {
  await deleteDoc(doc(db, 'savedPlaces', placeId))
}

// ──────────────────────────────────────────
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
  const q = query(
    collection(db, 'diary'),
    where('tripId', '==', tripId),
    orderBy('createdAt', 'desc'),
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
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
