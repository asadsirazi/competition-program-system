import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getSubjects } from '../../services/subjects.js'
import { getGroups } from '../../services/groups.js'
import { getGroupSubjectOptions } from '../../utils/groupSubjects.js'
import { sortRegistrationsByClass } from '../../utils/registrationOrdering.js'
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

  const loadRegistrations = async (yearId, activeFilters) => {
    setStatus('loading')
    setError('')
    try {
      const list = await getRegistrations(yearId, activeFilters)
      setItems(sortRegistrationsByClass(list, classes))
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
      setItems(sortRegistrationsByClass(list, classList))
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
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো রেজিস্ট্রেশন নেই।</p>
        ) : null}
        {items.length > 0 ? (
          <div className="grid gap-3 text-sm text-muted">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3"
              >
                {editingId === item.id ? (
                  <div className="grid w-full gap-3">
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      value={editingForm.studentName}
                      onChange={(event) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          studentName: event.target.value,
                        }))
                      }
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      value={editingForm.rollNumber}
                      onChange={(event) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          rollNumber: event.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-3 md:grid-cols-3">
                      <label className="grid gap-2 text-xs text-muted">
                        গ্রুপ
                        <select
                          className="h-10 border border-line bg-white px-3 text-ink"
                          value={editingForm.groupId}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
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
                      <label className="grid gap-2 text-xs text-muted">
                        বিষয়
                        <select
                          className="h-10 border border-line bg-white px-3 text-ink"
                          value={editingForm.subjectId}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              subjectId: event.target.value,
                            }))
                          }
                        >
                          <option value="">নির্বাচন করুন</option>
                          {getGroupSubjectOptions(
                            groups.find((item) => item.id === editingForm.groupId),
                            subjects,
                          ).map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-2 text-xs text-muted">
                        শ্রেণি
                        <select
                          className="h-10 border border-line bg-white px-3 text-ink"
                          value={editingForm.classId}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              classId: event.target.value,
                            }))
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
                    <div className="flex items-center gap-2 text-xs">
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
                    </div>
                  </div>
                ) : (
                  <div className="flex w-full flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink">
                        #{item.serialNumber ?? '-'} {item.studentName}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        রোল: {item.rollNumber}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        গ্রুপ: {item.groupName || groupMap[item.groupId] || 'নেই'}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        বিষয়: {item.subjectName || subjectMap[item.subjectId] || 'নেই'}
                      </p>
                      <p className="mt-1 text-xs text-muted">
                        শ্রেণি: {item.className || classMap[item.classId] || 'নেই'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
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
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Registrations
