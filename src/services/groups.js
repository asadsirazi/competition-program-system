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

const groupsCollection = (yearId) =>
  collection(db, 'academicYears', yearId, 'groups')

export async function getGroups(yearId) {
  const groupsQuery = query(groupsCollection(yearId), orderBy('name', 'asc'))
  const snapshot = await getDocs(groupsQuery)
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export async function createGroup(yearId, payload) {
  const name = payload.name?.trim() || ''
  if (!name) {
    throw new Error('গ্রুপের নাম প্রয়োজন।')
  }

  await addDoc(groupsCollection(yearId), {
    name,
    classes: payload.classes || [],
    subjects: payload.subjects || [],
    createdAt: serverTimestamp(),
  })
}

export async function updateGroup(yearId, groupId, payload) {
  const name = payload.name?.trim() || ''
  if (!name) {
    throw new Error('গ্রুপের নাম প্রয়োজন।')
  }

  const groupRef = doc(db, 'academicYears', yearId, 'groups', groupId)
  await updateDoc(groupRef, {
    name,
    classes: payload.classes || [],
    subjects: payload.subjects || [],
  })
}

export async function deleteGroup(yearId, groupId) {
  const groupRef = doc(db, 'academicYears', yearId, 'groups', groupId)
  await deleteDoc(groupRef)
}
