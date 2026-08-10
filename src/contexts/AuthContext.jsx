import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, ADMIN_EMAIL } from '../firebase'
import { buildAccountFromForm } from '../utils/idMapping'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubProfile = null

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)

      if (unsubProfile) {
        unsubProfile()
        unsubProfile = null
      }

      if (user) {
        // 일회성 조회(getDoc) 대신 실시간 구독을 사용합니다. 자기소개/포인트 등을 저장한 뒤에도
        // profile이 최신 상태로 자동 갱신되도록 하기 위함입니다(예전엔 재로그인 전까지 옛 값이 보였음).
        unsubProfile = onSnapshot(doc(db, 'users', user.uid), (snap) => {
          setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
          setLoading(false)
        })
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      unsubAuth()
      if (unsubProfile) unsubProfile()
    }
  }, [])

  const isAdmin = currentUser?.email === ADMIN_EMAIL

  async function signup(formValues) {
    const account = buildAccountFromForm(formValues)
    const { user } = await createUserWithEmailAndPassword(auth, account.email, formValues.password)

    const baseDoc = {
      name: account.name,
      grade: account.grade,
      classNum: account.classNum,
      number: account.number,
      email: account.email,
      bio: '',
      equippedStickers: {},
      points: 0,
      streakCount: 0,
      lastPracticeDate: null,
      banned: false,
      termsAgreedAt: serverTimestamp(),
      uiVersion: 'v1',
      createdAt: serverTimestamp(),
    }

    let profileDoc
    if (account.role === 'teacher') {
      // 교사는 관리자 승인 전까지 pending_teacher 상태로 대기합니다.
      profileDoc = { ...baseDoc, role: 'pending_teacher', status: 'pending' }
      await setDoc(doc(db, 'users', user.uid), profileDoc)
      await setDoc(doc(db, 'teacherRequests', user.uid), {
        uid: user.uid,
        name: account.name,
        grade: account.grade,
        classNum: account.classNum,
        email: account.email,
        status: 'pending',
        requestedAt: serverTimestamp(),
      })
    } else {
      profileDoc = { ...baseDoc, role: 'student', status: 'active' }
      await setDoc(doc(db, 'users', user.uid), profileDoc)
    }

    // 다른 학생/교사가 프로필을 조회할 수 있도록, 공개해도 되는 정보만 별도 컬렉션에 둡니다.
    await setDoc(doc(db, 'publicProfiles', user.uid), {
      uid: user.uid,
      name: account.name,
      grade: account.grade,
      classNum: account.classNum,
      number: account.number,
      bio: '',
      equippedStickers: {},
    })

    // onAuthStateChanged 리스너가 이 문서 작성보다 먼저 프로필을 조회해버리면(경쟁 조건)
    // profile이 계속 null로 남는 문제가 있어서, 여기서 직접 상태를 채워줍니다.
    setCurrentUser(user)
    setProfile({ id: user.uid, ...profileDoc })

    return account
  }

  async function login({ grade, classNum, number, password }) {
    const account = buildAccountFromForm({ grade, classNum, number, name: '' })
    return signInWithEmailAndPassword(auth, account.email, password)
  }

  async function loginAdmin(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  async function logout() {
    return signOut(auth)
  }

  const value = { currentUser, profile, loading, isAdmin, signup, login, loginAdmin, logout }

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
