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
  const [trackingStatus, setTrackingStatus] = useState('idle')
  const [trackingError, setTrackingError] = useState('')
  const [savingId, setSavingId] = useState('')
  const [bulkStatus, setBulkStatus] = useState('')
  const [savingAll, setSavingAll] = useState(false)
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })
  const [dirtyIds, setDirtyIds] = useState([])
  const [allRegistrations, setAllRegistrations] = useState([])
  const itemsRef = useRef([])

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
      setDirtyIds([])
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'মার্কস লোড করা যায়নি।')
      setStatus('error')
    }
  }

  const loadTracking = async () => {
    if (!activeYearId) {
      return
    }
    setTrackingStatus('loading')
    setTrackingError('')
    try {
      const list = await getRegistrations(activeYearId)
      setAllRegistrations(list)
      setTrackingStatus('ready')
    } catch (err) {
      setTrackingError(err.message || 'ট্র্যাকিং ডাটা আনা যায়নি।')
      setTrackingStatus('error')
    }
  }

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

    setTimeout(() => {
      void loadReferenceData()
    }, 0)
  }, [])

  useEffect(() => {
    itemsRef.current = items
  }, [items])

  useEffect(() => {
    if (!activeYearId) {
      return
    }
    setTimeout(() => {
      void loadTracking()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeYearId])

  useEffect(() => {
    setTimeout(() => {
      setDirtyIds([])
      setBulkStatus('')
      setSavingId('')
      setSavingAll(false)
      setBulkProgress({ done: 0, total: 0 })
    }, 0)
  }, [activeYearId, filters.groupId, filters.subjectId])

  const updateMark = (id, field, value) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    )
    setDirtyIds((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }

  const clearDirtyId = (id) => {
    setDirtyIds((prev) => prev.filter((itemId) => itemId !== id))
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
      clearDirtyId(item.id)
      await loadMarks()
      await loadTracking()
    } catch (err) {
      setError(err.message || 'মার্কস সংরক্ষণ করা যায়নি।')
    } finally {
      setSavingId('')
    }
  }

  const handleSaveAll = async () => {
    setError('')
    setBulkStatus('')
    const dirtyItems = itemsRef.current.filter((item) => dirtyIds.includes(item.id))

    if (!dirtyItems.length) {
      setBulkStatus('সংরক্ষণের জন্য কোনো তথ্য নেই।')
      return
    }

    const invalid = dirtyItems.filter((item) =>
      [item.judge1, item.judge2, item.judge3].some(
        (value) => value === '' || value === null || value === undefined,
      ),
    )

    if (invalid.length) {
      setBulkStatus('সব শিক্ষার্থীর জন্য বিচারকের নম্বর দিন।')
      return
    }

    setSavingAll(true)
    setBulkProgress({ done: 0, total: dirtyItems.length })
    try {
      for (const item of dirtyItems) {
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
      setDirtyIds([])
      await loadMarks()
      await loadTracking()
    } catch (err) {
      setError(err.message || 'সব মার্কস সংরক্ষণ করা যায়নি।')
    } finally {
      setSavingAll(false)
    }
  }

  const showMetadata =
    filters.groupId && filters.subjectId

  const registrationsByGroup = useMemo(() => {
    const grouped = {}
    allRegistrations.forEach((item) => {
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
  }, [allRegistrations])

  const subjectNamesForGroup = (group) => {
    const subjectList = (group?.subjects || []).map((subject) => ({
      id: subject.id,
      name: subject.name,
    }))

    if (subjectList.length) {
      return subjectList
    }

    const groupMap = registrationsByGroup[group.id] || {}
    return Object.keys(groupMap).map((subjectId) => ({
      id: subjectId,
      name: subjectMap[subjectId] || 'বিষয়',
    }))
  }

  const getEntryStatus = (list) => {
    const total = list.length
    if (!total) {
      return { label: 'নিবন্ধন নেই', tone: 'text-muted', done: 0, total: 0 }
    }

    const done = list.filter((item) =>
      [item.judge1, item.judge2, item.judge3].every(
        (value) => value !== '' && value !== null && value !== undefined,
      ),
    ).length

    if (done === 0) {
      return { label: 'এন্ট্রি বাকি', tone: 'text-red-700', done, total }
    }
    if (done === total) {
      return { label: 'এন্ট্রি শেষ', tone: 'text-emerald-700', done, total }
    }
    return { label: 'আংশিক', tone: 'text-amber-700', done, total }
  }

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
        </div>
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
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
                  {items.map((item, index) => (
                    <tr key={item.id} className="border border-line">
                        <td className="border border-line px-3 py-2 text-center">
                          {index + 1}
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
                        {dirtyIds.includes(item.id) ? (
                          <button
                            type="button"
                            className="h-9 border border-ink bg-white px-3 text-xs font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={() => handleSave(item)}
                            disabled={savingId === item.id || savingAll}
                          >
                            {savingId === item.id ? 'সংরক্ষণ...' : 'সংরক্ষণ'}
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-line px-4 py-3">
              <button
                type="button"
                className="h-10 border border-ink bg-ink px-4 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleSaveAll}
                disabled={savingAll || dirtyIds.length === 0}
              >
                {savingAll
                  ? `সব সংরক্ষণ হচ্ছে... (${bulkProgress.done}/${bulkProgress.total})`
                  : 'সব সংরক্ষণ করুন'}
              </button>
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="মার্কস এন্ট্রি ট্র্যাকিং" subtitle="গ্রুপ ও বিষয় অনুযায়ী অগ্রগতি">
        {trackingStatus === 'loading' ? (
          <p className="text-sm text-muted">ট্র্যাকিং লোড হচ্ছে...</p>
        ) : null}
        {trackingStatus === 'error' ? (
          <p className="text-sm text-muted">{trackingError}</p>
        ) : null}
        {trackingStatus === 'ready' ? (
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
                      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-2 lg:grid-cols-3">
                        {subjectList.map((subject) => {
                          const list = registrationsByGroup[group.id]?.[subject.id] || []
                          const statusInfo = getEntryStatus(list)
                          return (
                            <div key={subject.id} className="border border-line p-2.5">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[12px] font-semibold text-ink">{subject.name}</p>
                                <span className={`text-[10px] font-semibold ${statusInfo.tone}`}>
                                  {statusInfo.label}
                                </span>
                              </div>
                              <p className="mt-1.5 text-[10px] text-muted">
                                এন্ট্রি: {statusInfo.done}/{statusInfo.total}
                              </p>
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

export default MarksEntry
