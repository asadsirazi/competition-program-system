import { useEffect, useMemo, useRef, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import ResultsTable from '../../components/ResultsTable.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getSubjects } from '../../services/subjects.js'
import { getGroups } from '../../services/groups.js'
import { getRegistrations } from '../../services/registrations.js'
import { getSystemSettings, updateSystemSettings } from '../../services/systemSettings.js'
import { getGroupSubjectOptions } from '../../utils/groupSubjects.js'
import { getMarkCriteria } from '../../utils/markCriteria.js'
import { rankResults } from '../../utils/resultScoring.js'
import { toPng } from 'html-to-image'
import { downloadDetailedPdf, downloadSummaryPdf } from '../../services/pdf/pdfService.jsx'

const emptyFilters = { groupId: '', subjectId: '' }

function ResultsAdmin() {
  const tableRef = useRef(null)
  const [institutionName, setInstitutionName] = useState('আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা')
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [items, setItems] = useState([])
  const [summaryItems, setSummaryItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [summaryStatus, setSummaryStatus] = useState('idle')
  const [error, setError] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [published, setPublished] = useState(false)
  const [busy, setBusy] = useState(false)
  const [expandedSubjects, setExpandedSubjects] = useState({})
  const [resultsPin, setResultsPin] = useState('')
  const [pinSaveStatus, setPinSaveStatus] = useState('')

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
      setResultsPin(settings.resultsPin || '')
      setInstitutionName(settings.institutionName || 'আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা')
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'রেফারেন্স ডাটা আনা যায়নি।')
      setStatus('error')
    }
  }

  const loadSummary = async () => {
    if (!activeYearId) {
      return
    }
    setSummaryStatus('loading')
    setSummaryError('')
    try {
      const list = await getRegistrations(activeYearId)
      setSummaryItems(list)
      setSummaryStatus('ready')
    } catch (err) {
      setSummaryError(err.message || 'ফলাফল সারাংশ লোড করা যায়নি।')
      setSummaryStatus('error')
    }
  }

  useEffect(() => {
    setTimeout(() => {
      void loadReferenceData()
    }, 0)
  }, [])

  useEffect(() => {
    if (activeYearId) {
      setTimeout(() => {
        void loadSummary()
      }, 0)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeYearId])

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

  const handleSavePin = async () => {
    setBusy(true)
    setPinSaveStatus('')
    setError('')
    try {
      await updateSystemSettings({ resultsPin })
      setPinSaveStatus('পিন সংরক্ষণ হয়েছে।')
    } catch (err) {
      setError(err.message || 'পিন সংরক্ষণ করা যায়নি।')
    } finally {
      setBusy(false)
    }
  }

  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((item) => [item.id, item.name])),
    [subjects],
  )

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

    const groupMap = summaryByGroup[group.id] || {}
    return Object.keys(groupMap).map((subjectId) => ({
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

  const downloadImage = () => {
    if (!tableRef.current) return
    toPng(tableRef.current, {
      cacheBust: true,
      pixelRatio: 3,
      style: {
        background: 'white',
        margin: '0',
      }
    })
    .then((dataUrl) => {
      const link = document.createElement('a')
      link.download = `ফলাফল_তালিকা_${selectedGroup?.name || 'গ্রুপ'}_${selectedSubject?.name || 'বিষয়'}.png`
      link.href = dataUrl
      link.click()
    })
    .catch((err) => {
      console.error('Image export failed:', err)
    })
  }

  const handleDownloadDetailedPdf = async () => {
    const safeName = [
      institutionName,
      selectedGroup?.name || 'group',
      selectedSubject?.name || 'subject',
    ]
      .join('-')
      .replace(/\s+/g, '-')
    
    await downloadDetailedPdf({
      year: activeYearId,
      institution: institutionName,
      groupName: selectedGroup?.name,
      subjectName: selectedSubject?.name,
      items: items,
      criteriaLabels: criteriaLabels
    }, `ফলাফল_${safeName}.pdf`)
  }

  const handleDownloadSummaryPdf = async () => {
    await downloadSummaryPdf({
      year: activeYearId,
      institution: institutionName,
      groups: groups,
      summaryByGroup: summaryByGroup,
      subjectMap: subjectMap
    }, `ফলাফল_সারাংশ_${activeYearId || 'তথ্যাদি'}.pdf`)
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

      <SectionCard title="গ্লোবাল ফলাফল পিন" subtitle="সাধারণ ইউজারদের জন্য পিন সেট করুন">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-muted">
            ফলাফল পিন
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={resultsPin}
              onChange={(event) => {
                setResultsPin(event.target.value)
                setPinSaveStatus('')
              }}
              placeholder="পিন লিখুন (যেমন: 1234)"
              type="text"
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="h-10 border border-ink bg-ink px-4 text-xs font-semibold text-white"
            onClick={handleSavePin}
            disabled={busy}
          >
            পিন সংরক্ষণ করুন
          </button>
          {pinSaveStatus ? <span className="text-sm text-ink">{pinSaveStatus}</span> : null}
        </div>
        <p className="mt-3 text-xs text-muted">
          এই পিন দিয়ে সাধারণ ইউজাররা ফলাফল মেনু থেকে প্রতিটি গ্রুপের প্রতিটি বিষয়ের ফলাফল ও সারাংশ দেখতে পারবে।
        </p>
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
          <div className="grid gap-3">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={handleDownloadDetailedPdf}
                className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink hover:bg-gray-50 transition"
              >
                পিডিএফ ডাউনলোড
              </button>
              <button
                type="button"
                onClick={downloadImage}
                className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink hover:bg-gray-50 transition"
              >
                📸 ছবি ডাউনলোড করুন
              </button>
            </div>
            <div ref={tableRef} className="border border-line bg-white p-6">
              <div className="mb-6 flex flex-col items-center justify-center text-center border-b border-line pb-4">
                <h2 className="text-xl font-bold text-ink">ফলাফল তালিকা</h2>
                <p className="mt-1 text-sm text-muted">
                  ইসলামিক সংস্কৃতি প্রতিযোগিতা - {activeYearId || 'তথ্যাদি'}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {institutionName}
                </p>
                <p className="mt-1 text-xs text-muted">
                  গ্রুপ : {selectedGroup?.name || 'গ্রুপ'}, বিষয় : {selectedSubject?.name || 'বিষয়'}
                </p>
              </div>
              <ResultsTable items={items} criteriaLabels={criteriaLabels} />
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="ফলাফল সারাংশ" subtitle="মেধাক্রম ১-৩ হাইলাইট">
        {summaryStatus === 'loading' ? (
          <p className="text-sm text-muted">সারাংশ লোড হচ্ছে...</p>
        ) : null}
        {summaryStatus === 'error' ? (
          <p className="text-sm text-muted">{summaryError}</p>
        ) : null}
        {summaryStatus === 'ready' ? (
          <div className="grid gap-4">
            {groups.length > 0 ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDownloadSummaryPdf}
                  className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink hover:bg-gray-50 transition"
                >
                  সারাংশ পিডিএফ ডাউনলোড
                </button>
              </div>
            ) : null}
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
        ) : null}
      </SectionCard>
    </div>
  )
}

export default ResultsAdmin
