const criteriaBySubjectPatterns = [
  {
    patterns: ['বক্তব্য', 'কথোপকথন'],
    labels: ['বিষয়বস্তু', 'উচ্চারণ', 'সুন্দর উপস্থাপনা'],
  },
  {
    patterns: ['সঙ্গীত', 'গান', 'কবিতা', 'হামদ', 'নাত'],
    labels: ['সুর', 'উচ্চারণ', 'সুন্দর কণ্ঠ'],
  },
  {
    patterns: ['তেলাওয়াত', 'সূরা', 'মুখস্থ', 'হাদিস', 'হিফজ'],
    labels: ['মুখস্থ', 'বিশুদ্ধ উচ্চারণ', 'সুন্দর কণ্ঠ'],
  },
  {
    patterns: ['কুইজ', 'উপস্থিত'],
    labels: ['সঠিক উত্তর', 'দ্রুততা', 'সতর্কতা'],
  },
]

const defaultCriteria = ['বিচার ১', 'বিচার ২', 'বিচার ৩']

export function getMarkCriteria(subjectName = '') {
  const normalized = subjectName.trim().toLowerCase()

  for (const entry of criteriaBySubjectPatterns) {
    if (entry.patterns.some((pattern) => normalized.includes(pattern.toLowerCase()))) {
      return entry.labels
    }
  }

  return defaultCriteria
}
