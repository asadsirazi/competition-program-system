export function scoreRegistration(item) {
  const judge1 = Number(item.judge1 ?? 0)
  const judge2 = Number(item.judge2 ?? 0)
  const judge3 = Number(item.judge3 ?? 0)
  const total = Number(item.total ?? judge1 + judge2 + judge3)

  return {
    ...item,
    judge1,
    judge2,
    judge3,
    total,
  }
}

export function rankResults(items) {
  const sorted = items.map(scoreRegistration).sort((a, b) => {
    const totalDiff = b.total - a.total
    if (totalDiff !== 0) {
      return totalDiff
    }

    const serialA = Number(a.serialNumber ?? Number.POSITIVE_INFINITY)
    const serialB = Number(b.serialNumber ?? Number.POSITIVE_INFINITY)
    return serialA - serialB
  })

  let currentRank = 0
  let lastTotal = null

  return sorted.map((item) => {
    if (lastTotal === null || item.total !== lastTotal) {
      currentRank += 1
      lastTotal = item.total
    }

    return {
      ...item,
      merit: currentRank,
    }
  })
}
