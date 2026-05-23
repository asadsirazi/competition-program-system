import { collection, doc, getDocs, updateDoc } from 'firebase/firestore'
import { db } from '../config/firebase.js'

export async function applySortOrderByNames(yearId, collectionName, orderedNames) {
  const ref = collection(db, 'academicYears', yearId, collectionName)
  const snapshot = await getDocs(ref)
  const docsByName = new Map()

  snapshot.docs.forEach((docSnap) => {
    const name = docSnap.data()?.name?.trim()
    if (name) {
      docsByName.set(name, docSnap.id)
    }
  })

  const missing = []

  for (let index = 0; index < orderedNames.length; index += 1) {
    const name = orderedNames[index].trim()
    const docId = docsByName.get(name)
    if (!docId) {
      missing.push(name)
      continue
    }

    await updateDoc(doc(db, 'academicYears', yearId, collectionName, docId), {
      sortOrder: index + 1,
    })
  }

  return {
    total: orderedNames.length,
    updated: orderedNames.length - missing.length,
    missing,
  }
}