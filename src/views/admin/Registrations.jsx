import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getSubjects } from '../../services/subjects.js'
import { getGroups } from '../../services/groups.js'
import { abbreviateClassName } from '../../utils/classDisplay.js'
import { getGroupSubjectOptions } from '../../utils/groupSubjects.js'
import { sortRegistrationsByGroupSubject } from '../../utils/registrationOrdering.js'
import {
  createRegistration,
  deleteRegistration,
  getRegistrations,
  updateRegistration,
} from '../../services/registrations.js'

const emptyForm = {
  groupId: '',
  subjectId: '',
  classId: '',
  studentName: '',
  rollNumber: '',
}

const emptyEditingForm = {
  groupId: '',
  subjectId: '',
  classId: '',
  studentName: '',
  rollNumber: '',
}

const emptyBulkForm = {
  groupId: '',
  subjectId: '',
  rows: '',
}

const bengaliDigits = {
  '০': '0',
  '১': '1',
  '২': '2',
  '৩': '3',
  '৪': '4',
  '৫': '5',
  '৬': '6',
  '৭': '7',
  '৮': '8',
  '৯': '9',
}

function normalizeLookupText(value = '') {
  return String(value).replace(/[—–]/g, '-').replace(/\s+/g, '').toLowerCase()
}

function normalizeDigits(value = '') {
  return String(value).replace(/[০-৯]/g, (digit) => bengaliDigits[digit] || digit).trim()
}

function splitClassAndRoll(value = '') {
  const normalizedValue = normalizeDigits(String(value).trim())
  if (!normalizedValue) {
    return { classLabel: '', rollNumber: '' }
  }

  const compactMatch = normalizedValue.match(/^(.*?)[\s,]+([0-9]+)$/)
  if (compactMatch) {
    return {
      classLabel: compactMatch[1].trim(),
      rollNumber: compactMatch[2].trim(),
    }
  }

  return { classLabel: normalizedValue, rollNumber: '' }
}

function findClassByLabel(label, classes) {
  const normalizedLabel = normalizeLookupText(label)

  return classes.find((item) => {
    const candidates = [item.name, abbreviateClassName(item.name)]
    return candidates.some((candidate) => normalizeLookupText(candidate) === normalizedLabel)
  })
}

function parseBulkRows(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), lineNumber: index + 1 }))
    .filter(({ line }) => line)
    .filter(({ line }) => !/^(ক্র|ক্রম|ক্রমিক|প্রতিযোগির নাম|নাম|শ্রেণী|শ্রেণি|রোল)\b/i.test(line))
    .map(({ line, lineNumber }) => {
      const normalizedLine = line.replace(/[\t]+/g, ',')
      const parts = normalizedLine
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)

      if (parts.length >= 4) {
        return {
          lineNumber,
          serialNumber: normalizeDigits(parts[0]),
          studentName: parts[1],
          classLabel: parts[2],
          rollNumber: normalizeDigits(parts[3]),
        }
      }

      if (parts.length === 3) {
        const classAndRoll = splitClassAndRoll(parts[2])
        return {
          lineNumber,
          serialNumber: normalizeDigits(parts[0]),
          studentName: parts[1],
          classLabel: classAndRoll.classLabel,
          rollNumber: classAndRoll.rollNumber,
        }
      }

      const serialStrippedLine = normalizeDigits(line).replace(/^[\s]*([0-9]+)\s*[.)\-:—–]?\s*/, '')
      const tabParts = serialStrippedLine
        .split(/\t+/)
        .map((part) => part.trim())
        .filter(Boolean)

      if (tabParts.length === 3) {
        const classAndRoll = splitClassAndRoll(tabParts[2])
        return {
          lineNumber,
          serialNumber: normalizeDigits(line.match(/^[\s]*([০-৯0-9]+)/)?.[1] || ''),
          studentName: tabParts[0],
          classLabel: classAndRoll.classLabel,
          rollNumber: classAndRoll.rollNumber,
        }
      }

      const whitespaceParts = serialStrippedLine
        .split(/\s+/)
        .map((part) => part.trim())
        .filter(Boolean)

      if (whitespaceParts.length >= 3) {
        const rollNumber = whitespaceParts[whitespaceParts.length - 1]
        const classLabel = whitespaceParts[whitespaceParts.length - 2]
        const studentName = whitespaceParts.slice(0, -2).join(' ')
        return {
          lineNumber,
          serialNumber: normalizeDigits(line.match(/^[\s]*([০-৯0-9]+)/)?.[1] || ''),
          studentName,
          classLabel,
          rollNumber: normalizeDigits(rollNumber),
        }
      }

      return {
        lineNumber,
        serialNumber: '',
        studentName: '',
        classLabel: '',
        rollNumber: '',
      }
    })
}

function validateBulkRow(row, classes) {
  const serialNumber = normalizeDigits(row.serialNumber)
  const studentName = row.studentName.trim()
  const classLabel = row.classLabel.trim()
  const rollNumber = Number(normalizeDigits(row.rollNumber))
  const classItem = findClassByLabel(classLabel, classes)
  const errors = []

  if (!serialNumber) {
    errors.push('ক্রমিক নেই')
  }
  if (!studentName) {
    errors.push('নাম নেই')
  }
  if (!classLabel) {
    errors.push('শ্রেণী নেই')
  } else if (!classItem) {
    errors.push(`শ্রেণী "${classLabel}" মেলেনি`)
  }
  if (Number.isNaN(rollNumber) || rollNumber <= 0) {
    errors.push('রোল সঠিক নয়')
  }

  return {
    ...row,
    serialNumber,
    studentName,
    classLabel,
    rollNumber,
    classItem,
    errors,
  }
}

function sortClassesForDisplay(items) {
  return [...items].sort((a, b) => (b.sortOrder || 0) - (a.sortOrder || 0))
}

function Registrations() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState({ groupId: '', subjectId: '', classId: '' })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingForm, setEditingForm] = useState(emptyEditingForm)
  const [bulkForm, setBulkForm] = useState(emptyBulkForm)
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 })

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
    () => groups.find((item) => item.id === form.groupId),
    [groups, form.groupId],
  )
  const selectedFilterGroup = useMemo(
    () => groups.find((item) => item.id === filters.groupId),
    [groups, filters.groupId],
  )
  const formSubjectOptions = useMemo(
    () => getGroupSubjectOptions(selectedGroup, subjects),
    [selectedGroup, subjects],
  )
  const filterSubjectOptions = useMemo(
    () => getGroupSubjectOptions(selectedFilterGroup, subjects),
    [selectedFilterGroup, subjects],
  )
  const sortedClasses = useMemo(() => sortClassesForDisplay(classes), [classes])
  const orderedItems = useMemo(
    () => sortRegistrationsByGroupSubject(items, groups, subjects),
    [items, groups, subjects],
  )
  const resolvedBulkGroup = useMemo(
    () => groups.find((item) => item.id === bulkForm.groupId),
    [groups, bulkForm.groupId],
  )
  const resolvedBulkSubject = useMemo(
    () => subjects.find((item) => item.id === bulkForm.subjectId),
    [subjects, bulkForm.subjectId],
  )
  const bulkSubjectOptions = useMemo(
    () => getGroupSubjectOptions(resolvedBulkGroup, subjects),
    [resolvedBulkGroup, subjects],
  )
  const bulkPreviewRows = useMemo(
    () => parseBulkRows(bulkForm.rows).map((row) => validateBulkRow(row, sortedClasses)),
    [bulkForm.rows, sortedClasses],
  )
  const bulkPreviewErrors = bulkPreviewRows.filter((row) => row.errors.length > 0)

  const loadRegistrations = async (yearId, activeFilters) => {
    setStatus('loading')
    setError('')
    try {
      const list = await getRegistrations(yearId, activeFilters)
      setItems(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'রেজিস্ট্রেশন তালিকা আনা যায়নি।')
      setStatus('error')
    }
  }

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
      const list = await getRegistrations(yearId, filters)
      setItems(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'রেফারেন্স ডাটা আনা যায়নি।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadReferenceData()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        groupName: groupMap[form.groupId] || '',
        className: classMap[form.classId] || '',
        subjectName: subjectMap[form.subjectId] || '',
      }
      await createRegistration(activeYearId, payload)
      await loadRegistrations(activeYearId, filters)
    } catch (err) {
      setError(err.message || 'রেজিস্ট্রেশন যোগ করা যায়নি।')
    }
  }

  const handleBulkCreate = async (event) => {
    event.preventDefault()
    setError('')
    setBulkStatus('')

    if (!activeYearId) {
      setBulkStatus('সক্রিয় বছর পাওয়া যায়নি।')
      return
    }
    if (!bulkForm.groupId || !bulkForm.subjectId) {
      setBulkStatus('আগে গ্রুপ এবং বিষয় নির্বাচন করুন।')
      return
    }

    const parsedRows = bulkPreviewRows
    if (!parsedRows.length) {
      setBulkStatus('পেস্ট করা তালিকায় বৈধ কোনো সারি পাওয়া যায়নি।')
      return
    }

    try {
      if (bulkPreviewErrors.length > 0) {
        const firstError = bulkPreviewErrors[0]
        throw new Error(`লাইন ${firstError.lineNumber}: ${firstError.errors.join(', ')}`)
      }

      const resolvedRows = parsedRows

      setBulkProgress({ done: 0, total: resolvedRows.length })

      for (const [index, row] of resolvedRows.entries()) {
        await createRegistration(activeYearId, {
          groupId: bulkForm.groupId,
          groupName: resolvedBulkGroup?.name || '',
          subjectId: bulkForm.subjectId,
          subjectName: resolvedBulkSubject?.name || '',
          classId: row.classItem.id,
          className: row.classItem.name || '',
          studentName: row.studentName,
          rollNumber: row.rollNumber,
        })
        setBulkProgress({ done: index + 1, total: resolvedRows.length })
      }

      setBulkStatus(`${resolvedRows.length}টি রেজিস্ট্রেশন যোগ হয়েছে।`)
      setBulkForm((prev) => ({
        ...prev,
        rows: '',
      }))
      await loadRegistrations(activeYearId, filters)
    } catch (err) {
      setBulkStatus(err.message || 'বাল্ক রেজিস্ট্রেশন করা যায়নি।')
    }
  }

  const applyFilters = async () => {
    if (!activeYearId) {
      return
    }
    await loadRegistrations(activeYearId, filters)
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditingForm({
      groupId: item.groupId || '',
      subjectId: item.subjectId || '',
      classId: item.classId || '',
      studentName: item.studentName || '',
      rollNumber: item.rollNumber || '',
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingForm(emptyEditingForm)
  }

  const saveEdit = async (itemId) => {
    setError('')
    try {
      const payload = {
        ...editingForm,
        groupName: groupMap[editingForm.groupId] || '',
        className: classMap[editingForm.classId] || '',
        subjectName: subjectMap[editingForm.subjectId] || '',
      }
      await updateRegistration(activeYearId, itemId, payload)
      cancelEdit()
      await loadRegistrations(activeYearId, filters)
    } catch (err) {
      setError(err.message || 'রেজিস্ট্রেশন আপডেট করা যায়নি।')
    }
  }

  const handleDelete = async (itemId) => {
    setError('')
    try {
      await deleteRegistration(activeYearId, itemId)
      await loadRegistrations(activeYearId, filters)
    } catch (err) {
      setError(err.message || 'রেজিস্ট্রেশন মুছে ফেলা যায়নি।')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="রেজিস্ট্রেশন" subtitle="গ্রুপ, বিষয় ও শ্রেণি অনুযায়ী">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <form className="grid gap-3" onSubmit={handleCreate}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-2 text-sm text-muted">
              গ্রুপ
              <select
                className="h-11 border border-line bg-white px-3 text-ink"
                value={form.groupId}
                onChange={(event) =>
                  setForm((prev) => ({
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
                value={form.subjectId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, subjectId: event.target.value }))
                }
              >
                <option value="">নির্বাচন করুন</option>
                {formSubjectOptions.map((item) => (
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
                value={form.classId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, classId: event.target.value }))
                }
              >
                <option value="">নির্বাচন করুন</option>
                {sortedClasses.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted">
              শিক্ষার্থীর নাম
              <input
                className="h-11 border border-line bg-white px-3 text-ink"
                value={form.studentName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, studentName: event.target.value }))
                }
                placeholder="শিক্ষার্থীর নাম"
              />
            </label>
            <label className="grid gap-2 text-sm text-muted">
              রোল নম্বর
              <input
                className="h-11 border border-line bg-white px-3 text-ink"
                value={form.rollNumber}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, rollNumber: event.target.value }))
                }
                placeholder="১"
                inputMode="numeric"
              />
            </label>
          </div>
          <button
            type="submit"
            className="h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white"
            disabled={!activeYearId}
          >
            যোগ করুন
          </button>
        </form>
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
        <div className="mt-6 border border-line bg-[var(--surface-alt)] p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-ink">একসাথে একাধিক রেজিস্ট্রেশন</p>
            <p className="mt-1 text-xs text-muted">
              গ্রুপ, বিষয়, আর নিচে প্রতিটি লাইন এই ফরম্যাটে পেস্ট করুন: ক্রমিক, নাম, শ্রেণী, রোল।
            </p>
          </div>
          <form className="grid gap-3" onSubmit={handleBulkCreate}>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm text-muted">
                গ্রুপ
                <select
                  className="h-11 border border-line bg-white px-3 text-ink"
                  value={bulkForm.groupId}
                  onChange={(event) =>
                    setBulkForm((prev) => ({
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
                  value={bulkForm.subjectId}
                  onChange={(event) =>
                    setBulkForm((prev) => ({ ...prev, subjectId: event.target.value }))
                  }
                >
                  <option value="">নির্বাচন করুন</option>
                  {bulkSubjectOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm text-muted">
              নাম, শ্রেণী ও রোলের তালিকা
              <textarea
                className="min-h-48 border border-line bg-white px-3 py-2 text-ink"
                value={bulkForm.rows}
                onChange={(event) =>
                  setBulkForm((prev) => ({ ...prev, rows: event.target.value }))
                }
                placeholder={'১, কারিমা, ৫ম, ৩\n২, উম্মে হান্নান মাবরুরা, ৯ম, ১১\n৩, সিদরাতুল মুন্তাহা, ৯ম, ১২'}
              />
            </label>
            <p className="text-xs text-muted">
              ফরম্যাট: ক্রমিক, নাম, শ্রেণী, রোল। প্রতিটি সারি কমা দিয়ে আলাদা করুন।
            </p>
            {bulkPreviewRows.length > 0 ? (
              <div className="grid gap-2 border border-line bg-white p-3 text-xs text-muted">
                <p className="font-semibold text-ink">প্রিভিউ</p>
                <div className="grid gap-2">
                  {bulkPreviewRows.map((row) => (
                    <div
                      key={row.lineNumber}
                      className={`grid gap-1 border px-3 py-2 ${
                        row.errors.length > 0
                          ? 'border-red-300 bg-red-50'
                          : 'border-line bg-[var(--surface-alt)]'
                      }`}
                    >
                      <p className="text-ink">
                        লাইন {row.lineNumber}: {row.serialNumber || '—'} | {row.studentName || '—'} |{' '}
                        {row.classLabel || '—'} | {row.rollNumber || '—'}
                      </p>
                      {row.errors.length > 0 ? (
                        <p className="text-red-700">সমস্যা: {row.errors.join(', ')}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <button
              type="submit"
              className="h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white"
              disabled={!activeYearId}
            >
              একসাথে যোগ করুন
            </button>
          </form>
          {bulkStatus ? (
            <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
              {bulkStatus}
            </p>
          ) : null}
          {bulkProgress.total > 0 ? (
            <p className="mt-2 text-xs text-muted">
              অগ্রগতি: {bulkProgress.done}/{bulkProgress.total}
            </p>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard title="রেজিস্ট্রেশন তালিকা" subtitle="ফিল্টার ও সম্পাদনা">
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          <label className="grid gap-2 text-sm text-muted">
            গ্রুপ ফিল্টার
            <select
              className="h-10 border border-line bg-white px-3 text-ink"
              value={filters.groupId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  groupId: event.target.value,
                  subjectId: '',
                }))
              }
            >
              <option value="">সব</option>
              {groups.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            বিষয় ফিল্টার
            <select
              className="h-10 border border-line bg-white px-3 text-ink"
              value={filters.subjectId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, subjectId: event.target.value }))
              }
            >
              <option value="">সব</option>
              {filterSubjectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-muted">
            শ্রেণি ফিল্টার
            <select
              className="h-10 border border-line bg-white px-3 text-ink"
              value={filters.classId}
              onChange={(event) =>
                setFilters((prev) => ({ ...prev, classId: event.target.value }))
              }
            >
              <option value="">সব</option>
              {sortedClasses.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button
          type="button"
          className="mb-4 h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink"
          onClick={applyFilters}
        >
          ফিল্টার প্রয়োগ করুন
        </button>
        {status === 'loading' ? <p className="text-sm text-muted">লোড হচ্ছে...</p> : null}
        {status === 'error' ? <p className="text-sm text-muted">{error}</p> : null}
        {status === 'ready' && orderedItems.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো রেজিস্ট্রেশন নেই।</p>
        ) : null}
        {orderedItems.length > 0 ? (
          <div className="table-scroll">
            <table className="w-full min-w-[1180px] border-collapse text-sm text-muted">
              <thead>
                <tr className="bg-[var(--surface-alt)] text-xs uppercase text-muted">
                  <th className="border border-line px-3 py-2 text-center">ক্রমিক</th>
                  <th className="border border-line px-3 py-2 text-center">গ্রুপ</th>
                  <th className="border border-line px-3 py-2 text-center">বিষয়</th>
                  <th className="border border-line px-3 py-2 text-center">প্রতিযোগির নাম</th>
                  <th className="border border-line px-3 py-2 text-center">শ্রেণী</th>
                  <th className="border border-line px-3 py-2 text-center">রোল</th>
                  <th className="border border-line px-3 py-2 text-center">একশন</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.map((item, index) => (
                  <tr key={item.id} className="align-top">
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">{index + 1}</td>
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">
                      {item.groupName || groupMap[item.groupId] || 'নেই'}
                    </td>
                    <td className="border border-line px-3 py-2 text-ink">
                      {item.subjectName || subjectMap[item.subjectId] || 'নেই'}
                    </td>
                    <td className="border border-line px-3 py-2 text-ink">
                      {editingId === item.id ? (
                        <input
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.studentName}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              studentName: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p>{item.studentName}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-ink">
                      {editingId === item.id ? (
                        <select
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.classId}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              classId: event.target.value,
                            }))
                          }
                        >
                          <option value="">নির্বাচন করুন</option>
                          {sortedClasses.map((classItem) => (
                            <option key={classItem.id} value={classItem.id}>
                              {classItem.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <p>{item.className || classMap[item.classId] || 'নেই'}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">
                      {editingId === item.id ? (
                        <input
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.rollNumber}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              rollNumber: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p>{item.rollNumber}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-center align-middle">
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                        {editingId === item.id ? (
                          <>
                            <button
                              type="button"
                              className="h-9 border border-ink bg-white px-4 font-semibold text-ink"
                              onClick={() => saveEdit(item.id)}
                            >
                              সংরক্ষণ
                            </button>
                            <button
                              type="button"
                              className="h-9 border border-line bg-white px-4 font-semibold text-muted"
                              onClick={cancelEdit}
                            >
                              বাতিল
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="h-9 border border-ink bg-white px-4 font-semibold text-ink"
                              onClick={() => startEdit(item)}
                            >
                              সম্পাদনা
                            </button>
                            <button
                              type="button"
                              className="h-9 border border-line bg-white px-4 font-semibold text-muted"
                              onClick={() => handleDelete(item.id)}
                            >
                              মুছুন
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Registrations
