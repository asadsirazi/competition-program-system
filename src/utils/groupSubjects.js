export function normalizeGroupSubjects(subjects) {
  if (!Array.isArray(subjects)) {
    return []
  }

  return subjects
    .map((subject) => {
      if (!subject) {
        return null
      }

      if (typeof subject === 'string') {
        return {
          id: subject,
          name: subject,
          syllabus: '',
        }
      }

      const id = typeof subject.id === 'string' ? subject.id : ''
      const name = typeof subject.name === 'string' ? subject.name : ''
      const syllabus = typeof subject.syllabus === 'string' ? subject.syllabus : ''

      if (!id && !name) {
        return null
      }

      return {
        id: id || name,
        name: name || id,
        syllabus,
      }
    })
    .filter(Boolean)
}

export function getGroupSubjectOptions(group, subjects) {
  const groupSubjects = normalizeGroupSubjects(group?.subjects)
  return groupSubjects.length ? groupSubjects : subjects
}