function getClassSortOrder(classId, classMap) {
  return Number(classMap.get(classId)?.sortOrder || 0)
}

export function sortRegistrationsByClass(items, classes) {
  const classMap = new Map(classes.map((item) => [item.id, item]))

  return [...items].sort((a, b) => {
    const classDiff = getClassSortOrder(b.classId, classMap) - getClassSortOrder(a.classId, classMap)
    if (classDiff !== 0) {
      return classDiff
    }

    const serialA = Number(a.serialNumber || 0)
    const serialB = Number(b.serialNumber || 0)
    if (serialA !== serialB) {
      return serialA - serialB
    }

    return String(a.studentName || '').localeCompare(String(b.studentName || ''))
  })
}