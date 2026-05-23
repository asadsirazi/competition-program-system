import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '../config/firebase.js'
import { getSystemSettings } from '../services/systemSettings.js'

const AuthContext = createContext(null)

function normalizeAdminUids(settings) {
  const list = Array.isArray(settings.adminUids) ? settings.adminUids : []
  const single = typeof settings.adminUid === 'string' ? settings.adminUid : ''
  const merged = new Set([...list, single].filter(Boolean))
  return Array.from(merged)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')

  const refreshAdminAccess = useCallback(async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false)
      return false
    }

    const settings = await getSystemSettings()
    const adminUids = normalizeAdminUids(settings)
    const allowed = adminUids.includes(currentUser.uid)
    setIsAdmin(allowed)
    return allowed
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser)
      setAuthError('')
      await refreshAdminAccess(currentUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [refreshAdminAccess])

  const signIn = async (email, password) => {
    setAuthError('')
    const credentials = await signInWithEmailAndPassword(auth, email, password)
    const allowed = await refreshAdminAccess(credentials.user)
    if (!allowed) {
      await firebaseSignOut(auth)
      setAuthError('অ্যাক্সেস নেই। এই UID অনুমোদিত নয়।')
      return null
    }

    return credentials.user
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setIsAdmin(false)
  }

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      authError,
      signIn,
      signOut,
    }),
    [user, isAdmin, loading, authError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
