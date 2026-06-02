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
import { rankResults } from '../utils/resultScoring.js'

const emptyFilters = { groupId: '', subjectId: '' }

function PublicResults() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [items, setItems] = useState([])
  const [summaryItems, setSummaryItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [summaryStatus, setSummaryStatus] = useState('idle')
  const [error, setError] = useState('')
  const [published, setPublished] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState({})

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

      // Load summary data
      setSummaryStatus('loading')
      try {
        const allList = await getRegistrations(yearId)
        setSummaryItems(allList)
        setSummaryStatus('ready')
      } catch (err) {
        setSummaryStatus('error')
      }
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

  const summaryByGroup = useMemo(() => {
    const grouped = {}
    summaryItems.forEach((item) => {
      if (!item.groupId || !item.subjectId) {
        return
      }
      if (!grouped[item.groupId]) {
        grouped[item.groupId] = {}
      }
      if (!grouped[item.groupId][item.subjectId]) {
        grouped[item.groupId][item.subjectId] = []
      }
      grouped[item.groupId][item.subjectId].push(item)
    })
    return grouped
  }, [summaryItems])

  const isMarksComplete = (item) =>
    [item.judge1, item.judge2, item.judge3].every(
      (value) => value !== '' && value !== null && value !== undefined,
    )

  const subjectNamesForGroup = (group) => {
    const subjectList = (group?.subjects || []).map((subject) => ({
      id: subject.id,
      name: subject.name,
    }))

    if (subjectList.length) {
      return subjectList
    }

    const groupSubjectMap = summaryByGroup[group.id] || {}
    return Object.keys(groupSubjectMap).map((subjectId) => ({
      id: subjectId,
      name: subjectMap[subjectId] || 'বিষয়',
    }))
  }

  const getMeritGroups = (list) => {
    const completed = list.filter(isMarksComplete)
    if (!completed.length) {
      return { top: [], rest: [] }
    }
    const ranked = rankResults(completed)
    return {
      top: ranked.filter((item) => item.merit <= 3),
      rest: ranked.filter((item) => item.merit > 3),
    }
  }

  const toggleSubject = (key) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
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
              <div className="grid gap-3 md:grid-cols-2">
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
              </div>
              <ResultsTable items={items} />
            </div>
          ) : null}
        </SectionCard>

        {published && summaryStatus === 'ready' ? (
          <SectionCard title="ফলাফল সারাংশ" subtitle="মেধাক্রম ১-৩ হাইলাইট">
            <div className="grid gap-4">
              {groups.length === 0 ? (
                <p className="text-sm text-muted">গ্রুপ পাওয়া যায়নি।</p>
              ) : (
                groups.map((group) => {
                  const subjectList = subjectNamesForGroup(group)
                  return (
                    <div key={group.id} className="border border-line bg-white px-4 py-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-ink">{group.name}</p>
                        <span className="text-xs text-muted">বিষয়: {subjectList.length}টি</span>
                      </div>
                      {subjectList.length === 0 ? (
                        <p className="mt-3 text-sm text-muted">এই গ্রুপে কোনো বিষয় নেই।</p>
                      ) : (
                        <div className="mt-3 grid gap-3 lg:grid-cols-2">
                          {subjectList.map((subject) => {
                            const list = summaryByGroup[group.id]?.[subject.id] || []
                            const { top, rest } = getMeritGroups(list)
                            if (!top.length) {
                              return null
                            }
                            const toggleKey = `${group.id}-${subject.id}`
                            const isExpanded = Boolean(expandedSubjects[toggleKey])

                            return (
                              <div key={subject.id} className="border border-line px-3 py-3">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-sm font-semibold text-ink">{subject.name}</p>
                                  <span className="text-xs text-muted">মোট: {top.length + rest.length} জন</span>
                                </div>
                                <div className="mt-3 grid gap-2 text-sm">
                                  {top.map((student) => {
                                    const tone = student.merit === 1
                                      ? 'bg-emerald-50'
                                      : student.merit === 2
                                        ? 'bg-amber-50'
                                        : 'bg-sky-50'
                                    return (
                                      <div key={student.id} className={`flex items-center justify-between border border-line px-3 py-2 ${tone}`}>
                                        <span>{student.studentName || 'নাম নেই'}</span>
                                        <span className="text-xs text-muted">মেধা: {student.merit}</span>
                                      </div>
                                    )
                                  })}
                                  {rest.length > 0 ? (
                                    <div className={`extra-list ${isExpanded ? 'is-expanded' : ''}`}>
                                      <div className="grid gap-2 pt-2">
                                        {rest.map((student) => (
                                          <div key={student.id} className="flex items-center justify-between border border-line px-3 py-2">
                                            <span>{student.studentName || 'নাম নেই'}</span>
                                            <span className="text-xs text-muted">মেধা: {student.merit}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                                {rest.length > 0 ? (
                                  <button
                                    type="button"
                                    className="mt-3 text-xs font-semibold text-ink"
                                    onClick={() => toggleSubject(toggleKey)}
                                  >
                                    {isExpanded ? 'কম দেখুন' : 'আরো দেখুন'}
                                  </button>
                                ) : null}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </SectionCard>
        ) : null}
        {summaryStatus === 'loading' ? (
          <p className="text-sm text-muted">সারাংশ লোড হচ্ছে...</p>
        ) : null}
      </div>
    </AppShell>
  )
}

export default PublicResults
