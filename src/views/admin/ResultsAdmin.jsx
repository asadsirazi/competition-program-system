import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import ResultsTable from '../../components/ResultsTable.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getSubjects } from '../../services/subjects.js'
import { getGroups } from '../../services/groups.js'
import { getRegistrations } from '../../services/registrations.js'
import { getSystemSettings, updateSystemSettings } from '../../services/systemSettings.js'
import { getGroupSubjectOptions } from '../../utils/groupSubjects.js'
import { getMarkCriteria } from '../../utils/markCriteria.js'

const emptyFilters = { groupId: '', subjectId: '' }

function ResultsAdmin() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)
  const [busy, setBusy] = useState(false)

  const selectedGroup = useMemo(
    () => groups.find((item) => item.id === filters.groupId),
    [groups, filters.groupId],
  )
  const subjectOptions = useMemo(
    () => getGroupSubjectOptions(selectedGroup, subjects),
    [selectedGroup, subjects],
  )
  const selectedSubject = useMemo(
    () => subjects.find((item) => item.id === filters.subjectId),
    [subjects, filters.subjectId],
  )
  const criteriaLabels = useMemo(
    () => getMarkCriteria(selectedSubject?.name || ''),
    [selectedSubject?.name],
  )

  const loadReferenceData = async () => {
    setStatus('loading')
    setError('')
    try {
      const yearId = await getActiveYearId()
      const [groupList, subjectList, settings] = await Promise.all([
        getGroups(yearId),
        getSubjects(yearId),
        getSystemSettings(),
      ])
      setActiveYearId(yearId)
      setGroups(groupList)
      setSubjects(subjectList)
      setPublished(Boolean(settings.resultsPublished))
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'রেফারেন্স ডাটা আনা যায়নি।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadReferenceData()
  }, [])

  const loadResults = async () => {
    if (!activeYearId) {
      return
    }
    setStatus('loading')
    setError('')
    try {
      const list = await getRegistrations(activeYearId, filters)
      setItems(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'ফলাফল লোড করা যায়নি।')
      setStatus('error')
    }
  }

  const handlePublish = async (next) => {
    setBusy(true)
    setError('')
    try {
      await updateSystemSettings({ resultsPublished: next })
      setPublished(next)
    } catch (err) {
      setError(err.message || 'ফলাফল প্রকাশ করা যায়নি।')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="ফলাফল" subtitle="অ্যাডমিন ফলাফল পর্যালোচনা">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm text-muted">
            গ্রুপ
            <select
              className="h-11 border border-line bg-white px-3 text-ink"
              value={filters.groupId}
              onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    groupId: event.target.value,
                    subjectId: '',
                  }))
              }
            >
              <option value="">নির্বাচন করুন</option>
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            বিষয়
            <select
              className="h-11 border border-line bg-white px-3 text-ink"
              value={filters.subjectId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, subjectId: event.target.value }))
              }
            >
              <option value="">নির্বাচন করুন</option>
              {subjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink"
            onClick={loadResults}
          >
            ফলাফল লোড করুন
          </button>
          <button
            type="button"
            className="h-10 border border-ink bg-ink px-4 text-xs font-semibold text-white"
            onClick={() => handlePublish(!published)}
            disabled={busy}
          >
            {published ? 'প্রকাশ বন্ধ করুন' : 'ফলাফল প্রকাশ করুন'}
          </button>
        </div>
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="ফলাফল তালিকা" subtitle="মেধা স্থান দেখুন">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">ফলাফল দেখানোর মতো তথ্য নেই।</p>
        ) : null}
        {items.length > 0 ? (
          <div className="border border-line bg-white p-4">
            <ResultsTable items={items} criteriaLabels={criteriaLabels} />
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default ResultsAdmin
