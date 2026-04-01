import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCAHXlgPWX83cJ9SbwalmKar9jlSY1khPs",
  authDomain: "triplet-88282.firebaseapp.com",
  projectId: "triplet-88282",
  storageBucket: "triplet-88282.firebasestorage.app",
  messagingSenderId: "156758250963",
  appId: "1:156758250963:web:1e6a543f1b2d38453d4b26",
  measurementId: "G-D0TWNGPNX9"
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
