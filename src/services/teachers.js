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

const teachersCollection = (yearId) =>
  collection(db, 'academicYears', yearId, 'teachers')

export async function getTeachers(yearId) {
  const teachersQuery = query(teachersCollection(yearId), orderBy('sortOrder', 'asc'))
  const snapshot = await getDocs(teachersQuery)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function createTeacher(yearId, payload) {
  const name = payload.name?.trim() || ''
  if (!name) {
    throw new Error('শিক্ষকের নাম প্রয়োজন।')
  }

  const existing = await getDocs(teachersCollection(yearId))
  const nextSortOrder = existing.size + 1

  await addDoc(teachersCollection(yearId), {
    name,
    designation: payload.designation?.trim() || '',
    phone: payload.phone?.trim() || '',
    email: payload.email?.trim() || '',
    sortOrder: nextSortOrder,
    createdAt: serverTimestamp(),
  })
}

export async function updateTeacher(yearId, teacherId, payload) {
  const name = payload.name?.trim() || ''
  if (!name) {
    throw new Error('শিক্ষকের নাম প্রয়োজন।')
  }

  const teacherRef = doc(db, 'academicYears', yearId, 'teachers', teacherId)
  await updateDoc(teacherRef, {
    name,
    designation: payload.designation?.trim() || '',
    phone: payload.phone?.trim() || '',
    email: payload.email?.trim() || '',
  })
}

export async function deleteTeacher(yearId, teacherId) {
  const teacherRef = doc(db, 'academicYears', yearId, 'teachers', teacherId)
  await deleteDoc(teacherRef)
}
