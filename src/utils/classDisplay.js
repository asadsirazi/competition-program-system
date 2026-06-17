const digitMap = {
  0: '০',
  1: '১',
  2: '২',
  3: '৩',
  4: '৪',
  5: '৫',
  6: '৬',
  7: '৭',
  8: '৮',
  9: '৯',
}

const ordinalClassLabels = {
  1: '১ম',
  2: '২য়',
  3: '৩য়',
  4: '৪র্থ',
  5: '৫ম',
  6: '৬ষ্ট',
  7: '৭ম',
  8: '৮ম',
  9: '৯ম',
  10: '১০ম',
  11: '১১শ',
  12: '১২শ',
}

function toBengaliDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => digitMap[digit] || digit)
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

export function abbreviateClassName(className = '') {
  const normalized = className.trim()
  if (!normalized) {
    return '-'
  }

  const lower = normalized.toLowerCase()
  const isBoyBranch = /বালক|ছাত্র|boy/.test(lower)
  const stripped = normalized
    .replace(/\bবালক\b/g, '')
    .replace(/\bছাত্র\b/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const shortLabels = [
    { label: 'আ:১ম', patterns: [/(?=.*(আলিম|alim))(?=.*(১ম|প্রথম|1|first))/i] },
    { label: 'আ:২য়', patterns: [/(?=.*(আলিম|alim))(?=.*(২য়|২য়|দ্বিতীয়|2|second))/i] },
    { label: 'শিশু', patterns: [/শিশু/i, /nursery/i, /kg1/i, /kg/i] },
    { label: '১২শ', patterns: [/দ্বাদশ/i, /12/i, /১২/i, /twelve/i] },
    { label: '১১শ', patterns: [/একাদশ/i, /11/i, /১১/i, /eleven/i] },
    { label: '১০ম', patterns: [/দশম/i, /10/i, /১০/i, /tenth/i] },
    { label: '৯ম', patterns: [/নবম/i, /9/i, /৯/i, /ninth/i] },
    { label: '৮ম', patterns: [/অষ্টম/i, /8/i, /৮/i, /eighth/i] },
    { label: '৭ম', patterns: [/সপ্তম/i, /7/i, /৭/i, /seventh/i] },
    { label: '৬ষ্ট', patterns: [/ষষ্ঠ/i, /6/i, /৬/i, /sixth/i] },
    { label: '৫ম', patterns: [/পঞ্চম/i, /5/i, /৫/i, /fifth/i] },
    { label: '৪র্থ', patterns: [/চতুর্থ/i, /4/i, /৪/i, /fourth/i] },
    { label: '৩য়', patterns: [/তৃতীয়/i, /3/i, /৩/i, /third/i] },
    { label: '২য়', patterns: [/দ্বিতীয়/i, /2/i, /২/i, /second/i] },
    { label: '১ম', patterns: [/প্রথম/i, /1/i, /১/i, /first/i] },
  ]

  const matchedShortLabel = shortLabels.find(({ patterns }) => matchesAny(normalized, patterns))?.label
  if (matchedShortLabel) {
    return isBoyBranch ? `${matchedShortLabel}-বা` : matchedShortLabel
  }

  const numericMatch = stripped.match(/(\d+|[০-৯]+)/)
  if (numericMatch) {
    const numericValue = Number(
      String(numericMatch[1]).replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit)),
    )
    const label = ordinalClassLabels[numericValue] || `${toBengaliDigits(numericMatch[1])}ম`
    return isBoyBranch ? `${label}-বা` : label
  }

  return isBoyBranch ? `${stripped}-বা` : stripped
}
