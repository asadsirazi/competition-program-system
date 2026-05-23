import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'
import { appendCloneLog, systemSettingsRef } from './systemSettings.js'

const yearsCollection = collection(db, 'academicYears')

export async function getAcademicYears() {
  const yearsQuery = query(yearsCollection, orderBy('year', 'desc'))
  const snapshot = await getDocs(yearsQuery)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function createAcademicYear(yearId) {
  const trimmed = yearId.trim()
  if (!trimmed) {
    throw new Error('একাডেমিক বছর প্রয়োজন।')
  }

  const yearRef = doc(db, 'academicYears', trimmed)
  const existing = await getDoc(yearRef)
  if (existing.exists()) {
    throw new Error('এই একাডেমিক বছর আগে থেকেই আছে।')
  }

  await setDoc(yearRef, {
    year: trimmed,
    status: 'draft',
    isFrozen: false,
    createdAt: serverTimestamp(),
  })
}

export async function setActiveAcademicYear(yearId) {
  const yearRef = doc(db, 'academicYears', yearId)
  const yearSnap = await getDoc(yearRef)
  if (!yearSnap.exists()) {
    throw new Error('একাডেমিক বছর পাওয়া যায়নি।')
  }

  const settingsSnap = await getDoc(systemSettingsRef())
  const settings = settingsSnap.exists() ? settingsSnap.data() : {}
  const previousId = settings.activeYearId

  const batch = writeBatch(db)
  batch.set(systemSettingsRef(), { activeYearId: yearId }, { merge: true })
  batch.set(
    yearRef,
    {
      status: 'active',
      isFrozen: false,
      activatedAt: serverTimestamp(),
    },
    { merge: true },
  )

  if (previousId && previousId !== yearId) {
    const previousRef = doc(db, 'academicYears', previousId)
    batch.set(
      previousRef,
      {
        status: 'archived',
        isFrozen: true,
        archivedAt: serverTimestamp(),
      },
      { merge: true },
    )
  }

  await batch.commit()

  if (previousId && previousId !== yearId) {
    const summary = await cloneAcademicYearData(previousId, yearId)
    await appendCloneLog({
      fromYearId: previousId,
      toYearId: yearId,
      summary,
    })
    return { cloned: true, from: previousId, summary }
  }

  return { cloned: false }
}

async function cloneCollection(sourceYearId, targetYearId, collectionName) {
  const sourceRef = collection(db, 'academicYears', sourceYearId, collectionName)
  const snapshot = await getDocs(sourceRef)
  let batch = writeBatch(db)
  let count = 0

  for (const docSnap of snapshot.docs) {
    const targetRef = doc(
      db,
      'academicYears',
      targetYearId,
      collectionName,
      docSnap.id,
    )
    batch.set(targetRef, docSnap.data())
    count += 1

    if (count >= 400) {
      await batch.commit()
      batch = writeBatch(db)
      count = 0
    }
  }

  if (count > 0) {
    await batch.commit()
  }

  return snapshot.size
}

export async function cloneAcademicYearData(sourceYearId, targetYearId) {
  const [classes, subjects, groups, teachers] = await Promise.all([
    cloneCollection(sourceYearId, targetYearId, 'classes'),
    cloneCollection(sourceYearId, targetYearId, 'subjects'),
    cloneCollection(sourceYearId, targetYearId, 'groups'),
    cloneCollection(sourceYearId, targetYearId, 'teachers'),
  ])

  return { classes, subjects, groups, teachers }
}
