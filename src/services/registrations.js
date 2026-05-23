import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getCountFromServer,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../config/firebase.js'

const registrationsCollection = (yearId) =>
  collection(db, 'academicYears', yearId, 'registrations')

async function getNextRegistrationSerial(yearId) {
  const snapshot = await getCountFromServer(registrationsCollection(yearId))
  return snapshot.data().count + 1
}

export async function getRegistrations(yearId, filters = {}) {
  const baseQuery = registrationsCollection(yearId)
  const registrationsQuery = query(baseQuery, orderBy('serialNumber', 'asc'))
  const snapshot = await getDocs(registrationsQuery)
  const items = snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))

  return items.filter((item) => {
    if (filters.groupId && item.groupId !== filters.groupId) {
      return false
    }
    if (filters.subjectId && item.subjectId !== filters.subjectId) {
      return false
    }
    if (filters.classId && item.classId !== filters.classId) {
      return false
    }
    return true
  })
}

export async function createRegistration(yearId, payload) {
  const studentName = payload.studentName?.trim() || ''
  const rollNumber = Number(payload.rollNumber)

  if (!payload.groupId || !payload.subjectId || !payload.classId) {
    throw new Error('গ্রুপ, বিষয় এবং শ্রেণি নির্বাচন করুন।')
  }
  if (!studentName) {
    throw new Error('শিক্ষার্থীর নাম প্রয়োজন।')
  }
  if (Number.isNaN(rollNumber) || rollNumber <= 0) {
    throw new Error('সঠিক রোল নম্বর দিন।')
  }

  const serialNumber = await getNextRegistrationSerial(yearId)

  await addDoc(registrationsCollection(yearId), {
    serialNumber,
    groupId: payload.groupId,
    groupName: payload.groupName || '',
    subjectId: payload.subjectId,
    subjectName: payload.subjectName || '',
    classId: payload.classId,
    className: payload.className || '',
    studentName,
    rollNumber,
    createdAt: serverTimestamp(),
  })
}

export async function updateRegistration(yearId, registrationId, payload) {
  const groupId = payload.groupId || ''
  const subjectId = payload.subjectId || ''
  const classId = payload.classId || ''
  const studentName = payload.studentName?.trim() || ''
  const rollNumber = Number(payload.rollNumber)
  if (!groupId || !subjectId || !classId) {
    throw new Error('গ্রুপ, বিষয় এবং শ্রেণি নির্বাচন করুন।')
  }
  if (!studentName) {
    throw new Error('শিক্ষার্থীর নাম প্রয়োজন।')
  }
  if (Number.isNaN(rollNumber) || rollNumber <= 0) {
    throw new Error('সঠিক রোল নম্বর দিন।')
  }

  const registrationRef = doc(db, 'academicYears', yearId, 'registrations', registrationId)
  await updateDoc(registrationRef, {
    groupId,
    groupName: payload.groupName || '',
    subjectId,
    subjectName: payload.subjectName || '',
    classId,
    className: payload.className || '',
    studentName,
    rollNumber,
  })
}

export async function updateRegistrationMarks(yearId, registrationId, payload) {
  const judge1 = Number(payload.judge1)
  const judge2 = Number(payload.judge2)
  const judge3 = Number(payload.judge3)

  if ([judge1, judge2, judge3].some((value) => Number.isNaN(value) || value < 0 || value > 33)) {
    throw new Error('সব বিচারকের নম্বর ০ থেকে ৩৩ এর মধ্যে দিন।')
  }

  const total = judge1 + judge2 + judge3
  const average = Number((total / 3).toFixed(2))
  const registrationRef = doc(db, 'academicYears', yearId, 'registrations', registrationId)
  await updateDoc(registrationRef, {
    judge1,
    judge2,
    judge3,
    total,
    average,
  })
}

export async function deleteRegistration(yearId, registrationId) {
  const registrationRef = doc(db, 'academicYears', yearId, 'registrations', registrationId)
  await deleteDoc(registrationRef)
}
