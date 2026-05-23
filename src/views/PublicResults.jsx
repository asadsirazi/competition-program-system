import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell.jsx'
import SectionCard from '../components/SectionCard.jsx'
import ResultsTable from '../components/ResultsTable.jsx'
import { getSystemSettings } from '../services/systemSettings.js'
import { getActiveYearId } from '../services/activeYear.js'
import { getGroups } from '../services/groups.js'
import { getClasses } from '../services/classes.js'
import { getSubjects } from '../services/subjects.js'
import { getRegistrations } from '../services/registrations.js'
import { getGroupSubjectOptions } from '../utils/groupSubjects.js'

const emptyFilters = { groupId: '', subjectId: '', classId: '' }

function PublicResults() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)

  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((item) => [item.id, item.name])),
    [groups],
  )
  const classMap = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, item.name])),
    [classes],
  )
  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((item) => [item.id, item.name])),
    [subjects],
  )
  const selectedGroup = useMemo(
    () => groups.find((item) => item.id === filters.groupId),
    [groups, filters.groupId],
  )
  const subjectOptions = useMemo(
    () => getGroupSubjectOptions(selectedGroup, subjects),
    [selectedGroup, subjects],
  )

  const loadReferenceData = async () => {
    setStatus('loading')
    setError('')
    try {
      const settings = await getSystemSettings()
      setPublished(Boolean(settings.resultsPublished))

      const yearId = await getActiveYearId()
      const [groupList, classList, subjectList] = await Promise.all([
        getGroups(yearId),
        getClasses(yearId),
        getSubjects(yearId),
      ])
      setActiveYearId(yearId)
      setGroups(groupList)
      setClasses(classList)
      setSubjects(subjectList)
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

  return (
    <AppShell>
      <div className="grid gap-6">
        <SectionCard title="ফলাফল" subtitle="প্রকাশিত ফলাফল দেখুন">
          {!published ? (
            <p className="text-sm text-muted">
              ফলাফল এখনও প্রকাশ করা হয়নি।
            </p>
          ) : (
            <>
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
                      setFilters((prev) => ({
                        ...prev,
                        subjectId: event.target.value,
                      }))
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
                <label className="grid gap-2 text-sm text-muted">
                  শ্রেণি
                  <select
                    className="h-11 border border-line bg-white px-3 text-ink"
                    value={filters.classId}
                    onChange={(event) =>
                      setFilters((prev) => ({
                        ...prev,
                        classId: event.target.value,
                      }))
                    }
                  >
                    <option value="">নির্বাচন করুন</option>
                    {classes.map((item) => (
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
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard title="ফলাফল তালিকা" subtitle="মেধা স্থান">
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
              <div className="mb-3 text-xs text-muted">
                <p>গ্রুপ: {groupMap[filters.groupId] || 'নির্বাচন করুন'}</p>
                <p>বিষয়: {subjectMap[filters.subjectId] || 'নির্বাচন করুন'}</p>
                <p>শ্রেণি: {classMap[filters.classId] || 'নির্বাচন করুন'}</p>
              </div>
              <ResultsTable items={items} />
            </div>
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default PublicResults
