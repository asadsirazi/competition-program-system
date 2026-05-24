import { useEffect, useMemo, useRef, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getSubjects } from '../../services/subjects.js'
import { getGroups } from '../../services/groups.js'
import { getRegistrations, updateRegistrationMarks } from '../../services/registrations.js'
import { getGroupSubjectOptions } from '../../utils/groupSubjects.js'
import { abbreviateClassName } from '../../utils/classDisplay.js'
import { sortRegistrationsByClass } from '../../utils/registrationOrdering.js'
import { getMarkCriteria } from '../../utils/markCriteria.js'

const emptyFilters = { groupId: '', subjectId: '' }

function MarksEntry() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [savingAll, setSavingAll] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })
  const [autoSaveNote, setAutoSaveNote] = useState('')
  const itemsRef = useRef([])
  const timersRef = useRef({})

  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((item) => [item.id, item.name])),
    [groups],
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
  const selectedSubject = useMemo(
    () => subjects.find((item) => item.id === filters.subjectId),
    [subjects, filters.subjectId],
  )
  const criteriaLabels = useMemo(
    () => getMarkCriteria(selectedSubject?.name || ''),
    [selectedSubject?.name],
  )

  useEffect(() => {
    const loadReferenceData = async () => {
      setStatus('loading')
      setError('')
      try {
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

    void loadReferenceData()
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const loadMarks = async () => {
    if (!activeYearId) {
      return
    }
    setStatus('loading')
    setError('')
    try {
      const list = await getRegistrations(activeYearId, filters)
      const hydrated = sortRegistrationsByClass(list, classes).map((item) => ({
        ...item,
        judge1: item.judge1 ?? '',
        judge2: item.judge2 ?? '',
        judge3: item.judge3 ?? '',
      }))
      setItems(hydrated)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'মার্কস লোড করা যায়নি।')
      setStatus('error')
    }
  }

  const updateMark = (id, field, value) => {
    setAutoSaveNote('')
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )

    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id])
    }

    timersRef.current[id] = setTimeout(async () => {
      const current = itemsRef.current.find((item) => item.id === id)
      if (!current || savingAll) {
        return
      }
      if ([current.judge1, current.judge2, current.judge3].some((v) => v === '')) {
        return
      }
      try {
        await updateRegistrationMarks(activeYearId, id, {
          judge1: current.judge1,
          judge2: current.judge2,
          judge3: current.judge3,
        })
        setAutoSaveNote(`স্বয়ংক্রিয় সংরক্ষণ: ${current.studentName}`)
      } catch (err) {
        setError(err.message || 'অটো-সেভ ব্যর্থ হয়েছে।')
      }
    }, 800)
  }

  const handleSave = async (item) => {
    setError('')
    setSavingId(item.id)
    try {
      await updateRegistrationMarks(activeYearId, item.id, {
        judge1: item.judge1,
        judge2: item.judge2,
        judge3: item.judge3,
      })
      await loadMarks()
    } catch (err) {
      setError(err.message || 'মার্কস সংরক্ষণ করা যায়নি।')
    } finally {
      setSavingId('')
    }
  }

  const handleSaveAll = async () => {
    setError('')
    setBulkStatus('')
    if (!items.length) {
      setBulkStatus('সংরক্ষণের জন্য কোনো তথ্য নেই।')
      return
    }

    const invalid = items.filter((item) =>
      [item.judge1, item.judge2, item.judge3].some(
        (value) => value === '' || value === null || value === undefined,
      ),
    )

    if (invalid.length) {
      setBulkStatus('সব শিক্ষার্থীর জন্য বিচারকের নম্বর দিন।')
      return
    }

    setSavingAll(true)
    setBulkProgress({ done: 0, total: items.length })
    try {
      for (const item of items) {
        await updateRegistrationMarks(activeYearId, item.id, {
          judge1: item.judge1,
          judge2: item.judge2,
          judge3: item.judge3,
        })
        setBulkProgress((prev) => ({
          done: prev.done + 1,
          total: prev.total,
        }))
      }
      setBulkStatus('সব মার্কস সংরক্ষণ হয়েছে।')
      await loadMarks()
    } catch (err) {
      setError(err.message || 'সব মার্কস সংরক্ষণ করা যায়নি।')
    } finally {
      setSavingAll(false)
    }
  }

  const showMetadata =
    filters.groupId && filters.subjectId

  return (
    <div className="grid gap-6">
      <SectionCard title="মার্কস এন্ট্রি" subtitle="বিচারকের নম্বর দিন">
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
            onClick={loadMarks}
          >
            তালিকা লোড করুন
          </button>
          <button
            type="button"
            className="h-10 border border-ink bg-ink px-4 text-xs font-semibold text-white"
            onClick={handleSaveAll}
            disabled={savingAll}
          >
            {savingAll ? 'সব সংরক্ষণ হচ্ছে...' : 'সব সংরক্ষণ করুন'}
          </button>
        </div>
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
        {autoSaveNote ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {autoSaveNote}
          </p>
        ) : null}
        {bulkStatus ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {bulkStatus}
          </p>
        ) : null}
        {savingAll ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            অগ্রগতি: {bulkProgress.done}/{bulkProgress.total}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="মার্কস তালিকা" subtitle="প্রতি শিক্ষার্থীর নম্বর">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">মার্কস এন্ট্রির জন্য তথ্য নেই।</p>
        ) : null}
        {items.length > 0 ? (
          <div className="border border-line bg-white">
            <div className="border-b border-line px-4 py-3 text-xs text-muted">
              {showMetadata ? (
                <div className="grid gap-1">
                  <p>গ্রুপ: {groupMap[filters.groupId]}</p>
                  <p>বিষয়: {subjectMap[filters.subjectId]}</p>
                  <p>মানদণ্ড: {criteriaLabels.join(' / ')}</p>
                </div>
              ) : (
                <p>গ্রুপ ও বিষয় নির্বাচন করুন।</p>
              )}
            </div>
            <div className="table-scroll">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border border-line bg-white">
                      <th className="border border-line px-3 py-2 text-center">ক্রমিক</th>
                      <th className="border border-line px-3 py-2 text-left">প্রতিযোগীর নাম</th>
                      <th className="border border-line px-3 py-2 text-left">শ্রেণী</th>
                      {criteriaLabels.map((label) => (
                        <th key={label} className="border border-line px-3 py-2 text-center">
                        {label}
                      </th>
                    ))}
                      <th className="border border-line px-3 py-2 text-center">মোট</th>
                      <th className="border border-line px-3 py-2 text-center">সংরক্ষণ</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border border-line">
                        <td className="border border-line px-3 py-2 text-center">
                          {item.serialNumber ?? '-'}
                      </td>
                        <td className="border border-line px-3 py-2">
                          {item.studentName}
                      </td>
                        <td className="border border-line px-3 py-2">
                          {abbreviateClassName(item.className || '')}
                      </td>
                      <td className="border border-line px-2 py-2">
                        <input
                          className="h-9 w-20 border border-line bg-white px-2 text-center text-ink"
                          type="number"
                          min="0"
                          max="33"
                          step="1"
                          value={item.judge1}
                          onChange={(event) =>
                            updateMark(item.id, 'judge1', event.target.value)
                          }
                          inputMode="decimal"
                        />
                      </td>
                      <td className="border border-line px-2 py-2">
                        <input
                          className="h-9 w-20 border border-line bg-white px-2 text-center text-ink"
                          type="number"
                          min="0"
                          max="33"
                          step="1"
                          value={item.judge2}
                          onChange={(event) =>
                            updateMark(item.id, 'judge2', event.target.value)
                          }
                          inputMode="decimal"
                        />
                      </td>
                      <td className="border border-line px-2 py-2">
                        <input
                          className="h-9 w-20 border border-line bg-white px-2 text-center text-ink"
                          type="number"
                          min="0"
                          max="33"
                          step="1"
                          value={item.judge3}
                          onChange={(event) =>
                            updateMark(item.id, 'judge3', event.target.value)
                          }
                          inputMode="decimal"
                        />
                      </td>
                      <td className="border border-line px-3 py-2 text-center">
                        {item.total ?? '-'}
                      </td>
                      <td className="border border-line px-3 py-2 text-center">
                        <button
                          type="button"
                          className="h-9 border border-ink bg-white px-3 text-xs font-semibold text-ink"
                          onClick={() => handleSave(item)}
                          disabled={savingId === item.id}
                        >
                          {savingId === item.id ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default MarksEntry
