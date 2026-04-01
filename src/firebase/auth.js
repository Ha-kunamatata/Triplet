import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './config'

// 회원가입
export async function register(email, password, nickname) {
  const credential = await createUserWithEmailAndPassword(auth, email, password)
  await updateProfile(credential.user, { displayName: nickname })
  await setDoc(doc(db, 'users', credential.user.uid), {
    email,
    nickname,
    createdAt: serverTimestamp(),
  })
  return credential.user
}

// 로그인
export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password)
  return credential.user
}

// 구글 로그인
export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider()
  const credential = await signInWithPopup(auth, provider)
  const user = credential.user
  const userDoc = await getDoc(doc(db, 'users', user.uid))
  if (!userDoc.exists()) {
    await setDoc(doc(db, 'users', user.uid), {
      email: user.email,
      nickname: user.displayName,
      createdAt: serverTimestamp(),
    })
  }
  return user
}

// 로그아웃
export async function logout() {
  await signOut(auth)
}
