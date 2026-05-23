import { arrayUnion, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'

export const systemSettingsRef = () => doc(db, 'settings', 'system')

export async function getSystemSettings() {
  const snapshot = await getDoc(systemSettingsRef())
  if (!snapshot.exists()) {
    return {
      adminUids: [],
      adminUid: '',
      resultsPin: '',
      resultsPublished: false,
      cloneLogs: [],
    }
  }

  return snapshot.data()
}

export async function updateSystemSettings(payload) {
  await setDoc(systemSettingsRef(), payload, { merge: true })
}

export async function appendCloneLog(payload) {
  const entry = {
    ...payload,
    createdAt: serverTimestamp(),
  }

  await setDoc(
    systemSettingsRef(),
    {
      cloneLogs: arrayUnion(entry),
    },
    { merge: true },
  )
}
