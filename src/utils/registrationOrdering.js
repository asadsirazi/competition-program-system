function getClassSortOrder(classId, classMap) {
  return Number(classMap.get(classId)?.sortOrder || 0)
}

function getGroupSortOrder(groupId, groupMap) {
  return Number(groupMap.get(groupId)?.index ?? Number.MAX_SAFE_INTEGER)
}

function getSubjectSortOrder(groupId, subjectId, groupMap, subjectMap) {
  const groupEntry = groupMap.get(groupId)
  if (groupEntry?.subjectOrder?.has(subjectId)) {
    return groupEntry.subjectOrder.get(subjectId)
  }

  return Number(subjectMap.get(subjectId)?.sortOrder ?? Number.MAX_SAFE_INTEGER)
}

export function sortRegistrationsByGroupSubject(items, groups, subjects = []) {
  const groupMap = new Map(
    groups.map((group, index) => [
      group.id,
      {
        index,
        subjectOrder: new Map(
          (Array.isArray(group.subjects) ? group.subjects : [])
            .map((subject, subjectIndex) => {
              if (!subject) {
                return null
              }

              const subjectId = typeof subject === 'string' ? subject : subject.id
              if (!subjectId) {
                return null
              }

              return [subjectId, subjectIndex]
            })
            .filter(Boolean),
        ),
      },
    ]),
  )
  const subjectMap = new Map(subjects.map((subject) => [subject.id, subject]))

  return [...items].sort((a, b) => {
    const groupDiff = getGroupSortOrder(a.groupId, groupMap) - getGroupSortOrder(b.groupId, groupMap)
    if (groupDiff !== 0) {
      return groupDiff
    }

    const subjectDiff =
      getSubjectSortOrder(a.groupId, a.subjectId, groupMap, subjectMap) -
      getSubjectSortOrder(b.groupId, b.subjectId, groupMap, subjectMap)
    if (subjectDiff !== 0) {
      return subjectDiff
    }

    const serialA = Number(a.serialNumber || 0)
    const serialB = Number(b.serialNumber || 0)
    if (serialA !== serialB) {
      return serialA - serialB
    }

    return String(a.studentName || '').localeCompare(String(b.studentName || ''), 'bn')
  })
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