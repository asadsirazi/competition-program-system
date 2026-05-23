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

const classesCollection = (yearId) =>
  collection(db, 'academicYears', yearId, 'classes')

export async function getClasses(yearId) {
  const classesQuery = query(classesCollection(yearId), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(classesQuery)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function createClass(yearId, name) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('শ্রেণির নাম প্রয়োজন।')
  }

  const existing = await getDocs(classesCollection(yearId))
  const nextSortOrder = existing.size + 1

  await addDoc(classesCollection(yearId), {
    name: trimmed,
    sortOrder: nextSortOrder,
    createdAt: serverTimestamp(),
  })
}

export async function updateClass(yearId, classId, name) {
  const trimmed = name.trim()
  if (!trimmed) {
    throw new Error('শ্রেণির নাম প্রয়োজন।')
  }

  const classRef = doc(db, 'academicYears', yearId, 'classes', classId)
  await updateDoc(classRef, { name: trimmed })
}

export async function deleteClass(yearId, classId) {
  const classRef = doc(db, 'academicYears', yearId, 'classes', classId)
  await deleteDoc(classRef)
}
