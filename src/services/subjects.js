import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'

const subjectsCollection = (yearId) =>
  collection(db, 'academicYears', yearId, 'subjects')

export async function getSubjects(yearId) {
  const subjectsQuery = query(subjectsCollection(yearId), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(subjectsQuery)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function createSubject(yearId, payload) {
  const name = payload.name?.trim() || ''
  if (!name) {
    throw new Error('বিষয়ের নাম প্রয়োজন।')
  }

  const existing = await getDocs(subjectsCollection(yearId))
  const nextSortOrder = existing.size + 1

  await addDoc(subjectsCollection(yearId), {
    name,
    sortOrder: nextSortOrder,
    createdAt: serverTimestamp(),
  })
}

export async function updateSubject(yearId, subjectId, payload) {
  const name = payload.name?.trim() || ''
  if (!name) {
    throw new Error('বিষয়ের নাম প্রয়োজন।')
  }

  const subjectRef = doc(db, 'academicYears', yearId, 'subjects', subjectId)
  await updateDoc(subjectRef, { name })
}

export async function deleteSubject(yearId, subjectId) {
  const subjectRef = doc(db, 'academicYears', yearId, 'subjects', subjectId)
  await deleteDoc(subjectRef)
}
