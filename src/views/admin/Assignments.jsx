import { useEffect, useMemo, useRef, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getGroups } from '../../services/groups.js'
import { getSubjects } from '../../services/subjects.js'
import { getTeachers } from '../../services/teachers.js'
import { getSystemSettings, updateSystemSettings } from '../../services/systemSettings.js'

const emptyPerson = { name: '', title: '', photoUrl: '' }

const emptyAssignment = {
  noticeHtml: '',
  committee: [],
  groupLeads: [],
  subjectLeads: [],
  classLeads: [],
}

function normalizePerson(person = {}) {
  return {
    name: person.name || '',
    title: person.title || '',
    photoUrl: person.photoUrl || '',
  }
}

function normalizeCommittee(committee = []) {
  if (!Array.isArray(committee)) {
    return []
  }
  return committee.map((item) => ({
    name: item.name || '',
    title: item.title || '',
    title2: item.title2 || '',
    photoUrl: item.photoUrl || '',
  }))
}

function normalizeSubjectLeads(subjectLeads = []) {
  if (!Array.isArray(subjectLeads)) {
    return []
  }
  return subjectLeads.map((item) => ({
    subjectId: item?.subjectId || '',
    ...normalizePerson(item),
  }))
}

function normalizeClassLeads(classLeads = []) {
  if (!Array.isArray(classLeads)) {
    return []
  }
  return classLeads.map((item) => ({
    classId: item?.classId || '',
    ...normalizePerson(item),
  }))
}

function normalizeGroupLeads(groups = [], groupLeads = []) {
  return groups.map((group) => {
    const saved = groupLeads.find((item) => item.groupId === group.id) || {}
    
    let lead = { name: '', title: '', photoUrl: '' }
    let assistants = []

    // Backward compatibility check for old format flat fields
    if (saved.leadName || saved.leadTitle || saved.leadPhotoUrl) {
      lead = {
        name: saved.leadName || '',
        title: saved.leadTitle || '',
        photoUrl: saved.leadPhotoUrl || '',
      }
    } else if (saved.lead) {
      lead = normalizePerson(saved.lead)
    }

    if (Array.isArray(saved.assistants)) {
      assistants = saved.assistants.map(normalizePerson)
    } else if (saved.assistantName || saved.assistantTitle || saved.assistantPhotoUrl) {
      assistants = [
        {
          name: saved.assistantName || '',
          title: saved.assistantTitle || '',
          photoUrl: saved.assistantPhotoUrl || '',
        },
      ]
    }

    return {
      groupId: group.id,
      lead,
      assistants,
    }
  })
}

function buildAssignment(base = {}, groups = []) {
  return {
    noticeHtml: base.noticeHtml || base.notice || '',
    committee: normalizeCommittee(base.committee),
    groupLeads: normalizeGroupLeads(groups, base.groupLeads || []),
    subjectLeads: normalizeSubjectLeads(base.subjectLeads),
    classLeads: normalizeClassLeads(base.classLeads),
  }
}

function Assignments() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [form, setForm] = useState({ ...emptyAssignment })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [saveStatus, setSaveStatus] = useState('')
  const editorRef = useRef(null)
  const [editorFocused, setEditorFocused] = useState(false)
  const [textColor, setTextColor] = useState('#1b1b1b')
  const [highlightColor, setHighlightColor] = useState('#fff2cc')

  const groupOptions = useMemo(
    () => groups.map((item) => ({ id: item.id, name: item.name })),
    [groups],
  )
  const subjectOptions = useMemo(
    () => subjects.map((item) => ({ id: item.id, name: item.name })),
    [subjects],
  )
  const classOptions = useMemo(
    () => classes.map((item) => ({ id: item.id, name: item.name })),
    [classes],
  )
  const teacherOptions = useMemo(
    () => teachers.map((item) => ({ id: item.id, name: item.name })),
    [teachers],
  )

  useEffect(() => {
    let active = true

    const loadData = async () => {
      setStatus('loading')
      setError('')
      setSaveStatus('')
      try {
        const yearId = await getActiveYearId()
        const [groupList, subjectList, classList, teacherList, settings] = await Promise.all([
          getGroups(yearId),
          getSubjects(yearId),
          getClasses(yearId),
          getTeachers(yearId),
          getSystemSettings(),
        ])
        if (!active) {
          return
        }
        const saved = settings?.assignmentsByYear?.[yearId] || {}
        setActiveYearId(yearId)
        setGroups(groupList)
        setSubjects(subjectList)
        setClasses(classList)
        setTeachers(teacherList)
        setForm(buildAssignment(saved, groupList))
        setStatus('ready')
      } catch (err) {
        if (active) {
          setError(err.message || 'দায়িত্ব বণ্টনের তথ্য আনা যায়নি।')
          setStatus('error')
        }
      }
    }

    loadData()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!editorRef.current || editorFocused) {
      return
    }
    if (editorRef.current.innerHTML !== form.noticeHtml) {
      editorRef.current.innerHTML = form.noticeHtml || ''
    }
  }, [form.noticeHtml, editorFocused])

  const handleSave = async () => {
    if (!activeYearId) {
      return
    }
    setError('')
    setSaveStatus('')
    // Sync latest content from editor before saving
    const latestForm = { ...form }
    if (editorRef.current) {
      latestForm.noticeHtml = editorRef.current.innerHTML || ''
    }
    try {
      const settings = await getSystemSettings()
      const nextAssignments = {
        ...(settings.assignmentsByYear || {}),
        [activeYearId]: latestForm,
      }
      await updateSystemSettings({ assignmentsByYear: nextAssignments })
      setForm(latestForm)
      setSaveStatus('দায়িত্ব বণ্টন সংরক্ষণ হয়েছে।')
    } catch (err) {
      setError(err.message || 'দায়িত্ব বণ্টন সংরক্ষণ করা যায়নি।')
    }
  }

  const updateCommittee = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.committee]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, committee: next }
    })
  }

  const addCommitteeMember = () => {
    setForm((prev) => ({
      ...prev,
      committee: [...prev.committee, { name: '', title: '', title2: '', photoUrl: '' }],
    }))
  }

  const removeCommitteeMember = (index) => {
    setForm((prev) => ({
      ...prev,
      committee: prev.committee.filter((_, idx) => idx !== index),
    }))
  }

  const updateGroupLeadMain = (groupId, field, value) => {
    setForm((prev) => ({
      ...prev,
      groupLeads: prev.groupLeads.map((item) =>
        item.groupId === groupId
          ? { ...item, lead: { ...item.lead, [field]: value } }
          : item,
      ),
    }))
  }

  const updateGroupLeadAssistant = (groupId, assistantIndex, field, value) => {
    setForm((prev) => ({
      ...prev,
      groupLeads: prev.groupLeads.map((item) => {
        if (item.groupId !== groupId) return item
        const nextAssistants = [...item.assistants]
        nextAssistants[assistantIndex] = {
          ...nextAssistants[assistantIndex],
          [field]: value,
        }
        return { ...item, assistants: nextAssistants }
      }),
    }))
  }

  const addGroupLeadAssistant = (groupId) => {
    setForm((prev) => ({
      ...prev,
      groupLeads: prev.groupLeads.map((item) =>
        item.groupId === groupId
          ? { ...item, assistants: [...item.assistants, { ...emptyPerson }] }
          : item,
      ),
    }))
  }

  const removeGroupLeadAssistant = (groupId, assistantIndex) => {
    setForm((prev) => ({
      ...prev,
      groupLeads: prev.groupLeads.map((item) =>
        item.groupId === groupId
          ? {
              ...item,
              assistants: item.assistants.filter((_, idx) => idx !== assistantIndex),
            }
          : item,
      ),
    }))
  }

  const updateSubjectLead = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.subjectLeads]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, subjectLeads: next }
    })
  }

  const addSubjectLead = () => {
    setForm((prev) => ({
      ...prev,
      subjectLeads: [...prev.subjectLeads, { subjectId: '', ...emptyPerson }],
    }))
  }

  const removeSubjectLead = (index) => {
    setForm((prev) => ({
      ...prev,
      subjectLeads: prev.subjectLeads.filter((_, idx) => idx !== index),
    }))
  }

  const updateClassLead = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.classLeads]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, classLeads: next }
    })
  }

  const addClassLead = () => {
    setForm((prev) => ({
      ...prev,
      classLeads: [...prev.classLeads, { classId: '', ...emptyPerson }],
    }))
  }

  const removeClassLead = (index) => {
    setForm((prev) => ({
      ...prev,
      classLeads: prev.classLeads.filter((_, idx) => idx !== index),
    }))
  }

  const handleTeacherNameChange = (name, onMatch) => {
    const matchedTeacher = teachers.find(
      (t) => t.name?.trim().toLowerCase() === name?.trim().toLowerCase(),
    )
    if (matchedTeacher) {
      const formattedTitle = matchedTeacher.designation
        ? `${matchedTeacher.designation}, আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা`
        : 'আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা'
      onMatch({
        title: formattedTitle,
        photoUrl: matchedTeacher.photoUrl || '',
      })
    }
  }


  const applyEditorCommand = (command, value) => {
    if (!editorRef.current) {
      return
    }
    editorRef.current.focus()
    try {
      document.execCommand(command, false, value)
    } catch {
      setError('এডিটর কমান্ড চালানো যায়নি।')
    }
    setForm((prev) => ({
      ...prev,
      noticeHtml: editorRef.current?.innerHTML || '',
    }))
  }

  const applyLink = () => {
    const url = window.prompt('লিংক দিন')
    if (url) {
      applyEditorCommand('createLink', url)
    }
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="দায়িত্ব বণ্টন" subtitle="হোম পেজের বিজ্ঞপ্তি ও দায়িত্বশীল তালিকা">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' ? (
          <div className="grid gap-6">
            <div className="grid gap-2 text-sm text-muted">
              <div className="flex flex-wrap items-center gap-2">
                <span>সাংস্কৃতিক প্রতিযোগিতার বিজ্ঞপ্তি</span>
                <span className="text-xs text-muted">(ফরম্যাটিং সাপোর্ট)</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 border border-line bg-[var(--surface-alt)] px-3 py-2">
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('bold')}
                >
                  Bold
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('italic')}
                >
                  Italic
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('underline')}
                >
                  Underline
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('insertUnorderedList')}
                >
                  Bullet
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('insertOrderedList')}
                >
                  Number
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('justifyLeft')}
                >
                  Left
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('justifyCenter')}
                >
                  Center
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('justifyRight')}
                >
                  Right
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('formatBlock', 'h3')}
                >
                  Heading
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={applyLink}
                >
                  Link
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('unlink')}
                >
                  Unlink
                </button>
                <button
                  type="button"
                  className="h-9 border border-line bg-white px-3 text-xs font-semibold text-ink"
                  onClick={() => applyEditorCommand('removeFormat')}
                >
                  Clear
                </button>
                <label className="flex items-center gap-2 text-xs text-muted">
                  Text
                  <input
                    type="color"
                    value={textColor}
                    onChange={(event) => {
                      setTextColor(event.target.value)
                      applyEditorCommand('foreColor', event.target.value)
                    }}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted">
                  Highlight
                  <input
                    type="color"
                    value={highlightColor}
                    onChange={(event) => {
                      setHighlightColor(event.target.value)
                      applyEditorCommand('hiliteColor', event.target.value)
                    }}
                  />
                </label>
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="min-h-[180px] border border-line bg-white px-3 py-2 text-ink"
                style={{ fontFamily: 'SulaimanLipi, sans-serif' }}
                onFocus={() => setEditorFocused(true)}
                onBlur={(event) => {
                  setEditorFocused(false)
                  const newHtml = event.currentTarget.innerHTML
                  setForm((prev) => ({
                    ...prev,
                    noticeHtml: newHtml,
                  }))
                }}
                onPaste={(event) => {
                  event.preventDefault()
                  const text = event.clipboardData.getData('text/html') || event.clipboardData.getData('text/plain')
                  if (text) {
                    document.execCommand('insertHTML', false, text)
                  }
                }}
              />
              <p className="text-xs text-muted">
                লেখা সিলেক্ট করে টুল ব্যবহার করুন। লিংক দিতে Link চাপুন।
              </p>
            </div>

            <datalist id="teacher-name-options">
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.name} />
              ))}
            </datalist>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted">প্রতিযোগিতা পরিচালনা পর্ষদ</p>
                  <p className="mt-1 text-sm text-ink">নাম, পদবী ও ছবি URL দিন।</p>
                </div>
                <button
                  type="button"
                  onClick={addCommitteeMember}
                  className="h-9 border border-ink bg-white px-3 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition"
                >
                  + সদস্য যোগ করুন
                </button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {form.committee.map((member, index) => (
                  <div key={`committee-${index}`} className="grid gap-2 border border-line bg-white p-4 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase text-muted">সদস্য {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeCommitteeMember(index)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="নাম"
                      list="teacher-name-options"
                      value={member.name}
                      onChange={(event) => {
                        const val = event.target.value
                        updateCommittee(index, 'name', val)
                        handleTeacherNameChange(val, (matched) => {
                          updateCommittee(index, 'title', matched.title)
                          updateCommittee(index, 'photoUrl', matched.photoUrl)
                        })
                      }}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="পদবী"
                      value={member.title}
                      onChange={(event) => updateCommittee(index, 'title', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="পদবী"
                      value={member.title2 || ''}
                      onChange={(event) => updateCommittee(index, 'title2', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="ছবির লিংক"
                      value={member.photoUrl}
                      onChange={(event) => updateCommittee(index, 'photoUrl', event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase text-muted">গ্রুপ দায়িত্বশীল</p>
                <p className="mt-1 text-sm text-ink">প্রতি গ্রুপে একজন প্রধান এবং ইচ্ছামতো সহকারী দায়িত্বশীল যোগ করতে পারবেন।</p>
              </div>
              <div className="grid gap-4">
                {groupOptions.length === 0 ? (
                  <p className="text-sm text-muted">গ্রুপ যোগ করা হয়নি।</p>
                ) : (
                  form.groupLeads.map((lead) => {
                    const groupName = groupOptions.find((item) => item.id === lead.groupId)?.name || 'গ্রুপ'
                    return (
                      <div key={lead.groupId} className="grid gap-3 border border-line bg-white p-4">
                        <div className="flex items-center justify-between border-b border-line pb-2">
                          <p className="text-sm font-semibold text-ink">{groupName}</p>
                          <button
                            type="button"
                            onClick={() => addGroupLeadAssistant(lead.groupId)}
                            className="h-8 border border-ink bg-white px-3 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition"
                          >
                            + সহকারী যোগ করুন
                          </button>
                        </div>
                        <div className="grid gap-4 mt-2">
                          {/* Main Lead */}
                          <div className="grid gap-2 border border-[var(--line-alt)] p-3 bg-[var(--surface-alt)]">
                            <p className="text-xs font-semibold uppercase text-ink">প্রধান দায়িত্বশীল</p>
                            <div className="grid gap-2 md:grid-cols-3">
                              <input
                                className="h-10 border border-line bg-white px-3 text-ink"
                                placeholder="নাম"
                                list="teacher-name-options"
                                value={lead.lead.name}
                                onChange={(event) => {
                                  const val = event.target.value
                                  updateGroupLeadMain(lead.groupId, 'name', val)
                                  handleTeacherNameChange(val, (matched) => {
                                    updateGroupLeadMain(lead.groupId, 'leadTitle', matched.title)
                                    updateGroupLeadMain(lead.groupId, 'leadPhotoUrl', matched.photoUrl)
                                  })
                                }}
                              />
                              <input
                                className="h-10 border border-line bg-white px-3 text-ink"
                                placeholder="পদবী"
                                value={lead.lead.title}
                                onChange={(event) => updateGroupLeadMain(lead.groupId, 'title', event.target.value)}
                              />
                              <input
                                className="h-10 border border-line bg-white px-3 text-ink"
                                placeholder="ছবির লিংক"
                                value={lead.lead.photoUrl}
                                onChange={(event) => updateGroupLeadMain(lead.groupId, 'photoUrl', event.target.value)}
                              />
                            </div>
                          </div>

                          {/* Assistants */}
                          {lead.assistants.map((assistant, index) => (
                            <div key={`assistant-${index}`} className="grid gap-2 border border-line p-3 relative bg-white">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold uppercase text-muted">সহকারী দায়িত্বশীল {index + 1}</p>
                                <button
                                  type="button"
                                  onClick={() => removeGroupLeadAssistant(lead.groupId, index)}
                                  className="text-xs text-red-500 hover:underline"
                                >
                                  মুছে ফেলুন
                                </button>
                              </div>
                              <div className="grid gap-2 md:grid-cols-3">
                                <input
                                  className="h-10 border border-line bg-white px-3 text-ink"
                                  placeholder="নাম"
                                  list="teacher-name-options"
                                  value={assistant.name}
                                  onChange={(event) => {
                                    const val = event.target.value
                                    updateGroupLeadAssistant(lead.groupId, index, 'name', val)
                                    handleTeacherNameChange(val, (matched) => {
                                      updateGroupLeadAssistant(lead.groupId, index, 'title', matched.title)
                                      updateGroupLeadAssistant(lead.groupId, index, 'photoUrl', matched.photoUrl)
                                    })
                                  }}
                                />
                                <input
                                  className="h-10 border border-line bg-white px-3 text-ink"
                                  placeholder="পদবী"
                                  value={assistant.title}
                                  onChange={(event) => updateGroupLeadAssistant(lead.groupId, index, 'title', event.target.value)}
                                />
                                <input
                                  className="h-10 border border-line bg-white px-3 text-ink"
                                  placeholder="ছবির লিংক"
                                  value={assistant.photoUrl}
                                  onChange={(event) => updateGroupLeadAssistant(lead.groupId, index, 'photoUrl', event.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted">বিষয় দায়িত্বশীল</p>
                  <p className="mt-1 text-sm text-ink">বিষয়ের জন্য দায়িত্বশীল শিক্ষক যুক্ত করুন।</p>
                </div>
                <button
                  type="button"
                  onClick={addSubjectLead}
                  className="h-9 border border-ink bg-white px-3 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition"
                >
                  + দায়িত্বশীল যোগ করুন
                </button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {form.subjectLeads.map((lead, index) => (
                  <div key={`subject-lead-${index}`} className="grid gap-2 border border-line bg-white p-4 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase text-muted">দায়িত্বশীল {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeSubjectLead(index)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                    <select
                      className="h-10 border border-line bg-white px-3 text-ink"
                      value={lead.subjectId}
                      onChange={(event) => updateSubjectLead(index, 'subjectId', event.target.value)}
                    >
                      <option value="">বিষয় নির্বাচন করুন</option>
                      {subjectOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="নাম"
                      list="teacher-name-options"
                      value={lead.name}
                      onChange={(event) => {
                        const val = event.target.value
                        updateSubjectLead(index, 'name', val)
                        handleTeacherNameChange(val, (matched) => {
                          updateSubjectLead(index, 'title', matched.title)
                          updateSubjectLead(index, 'photoUrl', matched.photoUrl)
                        })
                      }}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="পদবী"
                      value={lead.title}
                      onChange={(event) => updateSubjectLead(index, 'title', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="ছবির লিংক"
                      value={lead.photoUrl}
                      onChange={(event) => updateSubjectLead(index, 'photoUrl', event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-muted">শ্রেণি দায়িত্বশীল</p>
                  <p className="mt-1 text-sm text-ink">শ্রেণির জন্য দায়িত্বশীল শিক্ষক যুক্ত করুন।</p>
                </div>
                <button
                  type="button"
                  onClick={addClassLead}
                  className="h-9 border border-ink bg-white px-3 text-xs font-semibold text-ink hover:bg-ink hover:text-white transition"
                >
                  + দায়িত্বশীল যোগ করুন
                </button>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {form.classLeads.map((lead, index) => (
                  <div key={`class-lead-${index}`} className="grid gap-2 border border-line bg-white p-4 relative">
                    <div className="flex items-center justify-between">
                      <p className="text-xs uppercase text-muted">দায়িত্বশীল {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeClassLead(index)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        মুছে ফেলুন
                      </button>
                    </div>
                    <select
                      className="h-10 border border-line bg-white px-3 text-ink"
                      value={lead.classId}
                      onChange={(event) => updateClassLead(index, 'classId', event.target.value)}
                    >
                      <option value="">শ্রেণি নির্বাচন করুন</option>
                      {classOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="নাম"
                      list="teacher-name-options"
                      value={lead.name}
                      onChange={(event) => {
                        const val = event.target.value
                        updateClassLead(index, 'name', val)
                        handleTeacherNameChange(val, (matched) => {
                          updateClassLead(index, 'title', matched.title)
                          updateClassLead(index, 'photoUrl', matched.photoUrl)
                        })
                      }}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="পদবী"
                      value={lead.title}
                      onChange={(event) => updateClassLead(index, 'title', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="ছবির লিংক"
                      value={lead.photoUrl}
                      onChange={(event) => updateClassLead(index, 'photoUrl', event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="h-11 border border-ink bg-ink px-5 text-sm font-semibold text-white"
                onClick={handleSave}
              >
                সংরক্ষণ করুন
              </button>
              {saveStatus ? <span className="text-sm text-ink">{saveStatus}</span> : null}
            </div>
          </div>
        ) : null}
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Assignments
