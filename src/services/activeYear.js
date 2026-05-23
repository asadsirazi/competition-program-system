import { getSystemSettings } from './systemSettings.js'

export async function getActiveYearId() {
  const settings = await getSystemSettings()
  const activeYearId = settings.activeYearId || ''
  if (!activeYearId) {
    throw new Error('সক্রিয় একাডেমিক বছর সেট করা নেই।')
  }
  return activeYearId
}
