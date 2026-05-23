import { useEffect, useMemo, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getSubjects } from '../../services/subjects.js'
import {
  createGroup,
  deleteGroup,
  getGroups,
  updateGroup,
} from '../../services/groups.js'
import { normalizeGroupSubjects } from '../../utils/groupSubjects.js'

const emptyForm = { name: '', classes: [], subjects: [] }

function toggleSelection(current, option) {
  const exists = current.some((item) => item.id === option.id)
  if (exists) {
    return current.filter((item) => item.id !== option.id)
  }
  return [...current, option]
}

function setSelectionSyllabus(current, subjectId, syllabus) {
  return current.map((subject) =>
    subject.id === subjectId ? { ...subject, syllabus } : subject,
  )
}

function cloneClasses(classes) {
  return (Array.isArray(classes) ? classes : []).map((item) => ({
    id: item.id,
    name: item.name,
  }))
}

function cloneSubjects(subjects) {
  return normalizeGroupSubjects(subjects).map((subject) => ({
    id: subject.id,
    name: subject.name,
    syllabus: subject.syllabus || '',
  }))
}

function Groups() {
  const [activeYearId, setActiveYearId] = useState('')
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingForm, setEditingForm] = useState(emptyForm)

  const classOptions = useMemo(
    () => classes.map((item) => ({ id: item.id, name: item.name })),
    [classes],
  )
  const subjectOptions = useMemo(
    () => subjects.map((item) => ({ id: item.id, name: item.name })),
    [subjects],
  )

  const loadGroups = async () => {
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
      setItems(groupList)
      setClasses(classList)
      setSubjects(subjectList)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'গ্রুপের তথ্য আনতে সমস্যা হয়েছে।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadGroups()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await createGroup(activeYearId, form)
      setForm(emptyForm)
      await loadGroups()
    } catch (err) {
      setError(err.message || 'গ্রুপ যোগ করা যায়নি।')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditingForm({
      name: item.name || '',
      classes: item.classes || [],
      subjects: normalizeGroupSubjects(item.subjects),
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingForm(emptyForm)
  }

  const saveEdit = async (itemId) => {
    setError('')
    try {
      await updateGroup(activeYearId, itemId, editingForm)
      cancelEdit()
      await loadGroups()
    } catch (err) {
      setError(err.message || 'গ্রুপ আপডেট করা যায়নি।')
    }
  }

  const handleDelete = async (itemId) => {
    setError('')
    try {
      await deleteGroup(activeYearId, itemId)
      await loadGroups()
    } catch (err) {
      setError(err.message || 'গ্রুপ মুছে ফেলা যায়নি।')
    }
  }

  const duplicateGroup = (item) => {
    setError('')
    setEditingId('')
    setEditingForm(emptyForm)
    setForm({
      name: `${item.name || 'নতুন গ্রুপ'} (কপি)`,
      classes: cloneClasses(item.classes),
      subjects: cloneSubjects(item.subjects),
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const renderClassOption = (option, selected, toggle) => (
    <label
      key={option.id}
      className="flex items-center gap-2 border border-line px-3 py-2 text-xs text-muted"
    >
      <input
        type="checkbox"
        checked={selected.some((item) => item.id === option.id)}
        onChange={() => toggle(option)}
      />
      <span className="text-ink">{option.name}</span>
    </label>
  )

  const renderSubjectOption = (option, selected, setSelected) => {
    const current = selected.find((item) => item.id === option.id)
    const isChecked = Boolean(current)

    return (
      <div key={option.id} className="grid gap-2 border border-line px-3 py-2">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={isChecked}
            onChange={() =>
              setSelected((prev) =>
                isChecked
                  ? prev.filter((item) => item.id !== option.id)
                  : [
                      ...prev,
                      {
                        id: option.id,
                        name: option.name,
                        syllabus: '',
                      },
                    ],
              )
            }
          />
          <span className="text-ink">{option.name}</span>
        </label>
        {isChecked ? (
          <label className="grid gap-1 text-xs text-muted">
            এই গ্রুপের সিলেবাস
            <textarea
              className="min-h-[90px] border border-line bg-white px-3 py-2 text-ink"
              value={current?.syllabus || ''}
              onChange={(event) =>
                setSelected((prev) =>
                  setSelectionSyllabus(prev, option.id, event.target.value),
                )
              }
              placeholder="এই গ্রুপের জন্য সিলেবাস লিখুন"
            />
          </label>
        ) : null}
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="গ্রুপ" subtitle="শ্রেণি ও বিষয় ম্যাপিং">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <form className="grid gap-4" onSubmit={handleCreate}>
          <label className="grid gap-2 text-sm text-muted">
            গ্রুপের নাম
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="গ্রুপ এ"
            />
          </label>
          <div className="grid gap-2 text-sm text-muted">
            শ্রেণি নির্বাচন
            <div className="grid gap-2 md:grid-cols-2">
              {classOptions.length === 0 ? (
                <p className="text-xs text-muted">শ্রেণি যোগ করা হয়নি।</p>
              ) : (
                classOptions.map((option) =>
                  renderClassOption(option, form.classes, (item) =>
                    setForm((prev) => ({
                      ...prev,
                      classes: toggleSelection(prev.classes, item),
                    })),
                  ),
                )
              )}
            </div>
          </div>
          <div className="grid gap-2 text-sm text-muted">
            বিষয় নির্বাচন
            <div className="grid gap-2 md:grid-cols-2">
              {subjectOptions.length === 0 ? (
                <p className="text-xs text-muted">বিষয় যোগ করা হয়নি।</p>
              ) : (
                subjectOptions.map((option) =>
                  renderSubjectOption(option, form.subjects, (updater) =>
                    setForm((prev) => ({
                      ...prev,
                      subjects:
                        typeof updater === 'function'
                          ? updater(prev.subjects)
                          : updater,
                    })),
                  ),
                )
              )}
            </div>
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

      <SectionCard title="গ্রুপ তালিকা" subtitle="সম্পাদনা বা মুছুন">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো গ্রুপ যোগ হয়নি।</p>
        ) : null}
        {items.length > 0 ? (
          <div className="grid gap-3 text-sm text-muted">
            {items.map((item) => (
              <div key={item.id} className="border border-line px-4 py-3">
                {editingId === item.id ? (
                  <div className="grid gap-3">
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      value={editingForm.name}
                      onChange={(event) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          name: event.target.value,
                        }))
                      }
                    />
                    <div className="grid gap-2 text-xs text-muted">
                      শ্রেণি নির্বাচন
                      <div className="grid gap-2 md:grid-cols-2">
                        {classOptions.map((option) =>
                          renderClassOption(option, editingForm.classes, (itemOption) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              classes: toggleSelection(prev.classes, itemOption),
                            })),
                          ),
                        )}
                      </div>
                    </div>
                    <div className="grid gap-2 text-xs text-muted">
                      বিষয় নির্বাচন
                      <div className="grid gap-2 md:grid-cols-2">
                        {subjectOptions.length === 0 ? (
                          <p className="text-xs text-muted">বিষয় যোগ করা হয়নি।</p>
                        ) : (
                          subjectOptions.map((option) =>
                            renderSubjectOption(option, editingForm.subjects, (updater) =>
                              setEditingForm((prev) => ({
                                ...prev,
                                subjects:
                                  typeof updater === 'function'
                                    ? updater(prev.subjects)
                                    : updater,
                              })),
                            ),
                          )
                        )}
                      </div>
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
                  <div className="grid gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <button
                          type="button"
                          className="h-9 border border-line bg-white px-4 font-semibold text-muted"
                          onClick={() => duplicateGroup(item)}
                        >
                          ডুপ্লিকেট
                        </button>
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
                    <div className="grid gap-3 text-xs text-muted">
                      <p>
                        শ্রেণি: {item.classes?.length ? item.classes.map((c) => c.name).join(', ') : 'নেই'}
                      </p>
                      {normalizeGroupSubjects(item.subjects).length ? (
                        <div className="grid gap-2">
                          <p>
                            বিষয়: {normalizeGroupSubjects(item.subjects).map((s) => s.name).join(', ')}
                          </p>
                          <div className="grid gap-2">
                            {normalizeGroupSubjects(item.subjects).map((subject) => (
                              <div key={subject.id} className="border border-line px-3 py-2">
                                <p className="font-semibold text-ink">{subject.name}</p>
                                <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                                  {subject.syllabus || 'সিলেবাস নেই'}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p>বিষয়: নেই</p>
                      )}
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

export default Groups
