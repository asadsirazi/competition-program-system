import { useEffect, useMemo, useRef, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getGroups } from '../../services/groups.js'
import { getSubjects } from '../../services/subjects.js'
import { getTeachers } from '../../services/teachers.js'
import { getSystemSettings, updateSystemSettings } from '../../services/systemSettings.js'

const emptyPerson = { name: '', title: '', photoUrl: '' }
const emptyLeadership = {
  founder: { ...emptyPerson },
  principal: { ...emptyPerson },
  educationDirector: { ...emptyPerson },
  culturalLead: { ...emptyPerson },
  culturalAssistant: { ...emptyPerson },
}

const emptyAssignment = {
  noticeHtml: '',
  committee: Array.from({ length: 5 }, () => ({ ...emptyPerson })),
  leadership: { ...emptyLeadership },
  groupLeads: [],
  subjectLeads: Array.from({ length: 2 }, () => ({ subjectId: '', ...emptyPerson })),
  classLeads: Array.from({ length: 2 }, () => ({ classId: '', ...emptyPerson })),
}

function normalizePerson(person = {}) {
  return {
    name: person.name || '',
    title: person.title || '',
    photoUrl: person.photoUrl || '',
  }
}

function normalizeCommittee(committee = []) {
  return Array.from({ length: 5 }, (_, index) => normalizePerson(committee[index]))
}

function normalizeLeadership(leadership = {}) {
  return {
    founder: normalizePerson(leadership.founder),
    principal: normalizePerson(leadership.principal),
    educationDirector: normalizePerson(leadership.educationDirector),
    culturalLead: normalizePerson(leadership.culturalLead),
    culturalAssistant: normalizePerson(leadership.culturalAssistant),
  }
}

function normalizeSubjectLeads(subjectLeads = []) {
  return Array.from({ length: 2 }, (_, index) => ({
    subjectId: subjectLeads[index]?.subjectId || '',
    ...normalizePerson(subjectLeads[index]),
  }))
}

function normalizeClassLeads(classLeads = []) {
  return Array.from({ length: 2 }, (_, index) => ({
    classId: classLeads[index]?.classId || '',
    ...normalizePerson(classLeads[index]),
  }))
}

function normalizeGroupLeads(groups = [], groupLeads = []) {
  return groups.map((group) => {
    const saved = groupLeads.find((item) => item.groupId === group.id) || {}
    return {
      groupId: group.id,
      leadName: saved.leadName || '',
      leadTitle: saved.leadTitle || '',
      leadPhotoUrl: saved.leadPhotoUrl || '',
      assistantName: saved.assistantName || '',
      assistantTitle: saved.assistantTitle || '',
      assistantPhotoUrl: saved.assistantPhotoUrl || '',
    }
  })
}

function buildAssignment(base = {}, groups = []) {
  return {
    noticeHtml: base.noticeHtml || base.notice || '',
    committee: normalizeCommittee(base.committee),
    leadership: normalizeLeadership(base.leadership),
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

  const updateLeadership = (role, field, value) => {
    setForm((prev) => ({
      ...prev,
      leadership: {
        ...prev.leadership,
        [role]: { ...prev.leadership[role], [field]: value },
      },
    }))
  }

  const updateGroupLead = (groupId, field, value) => {
    setForm((prev) => ({
      ...prev,
      groupLeads: prev.groupLeads.map((item) =>
        item.groupId === groupId ? { ...item, [field]: value } : item,
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

  const updateClassLead = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev.classLeads]
      next[index] = { ...next[index], [field]: value }
      return { ...prev, classLeads: next }
    })
  }

  const applyEditorCommand = (command, value) => {
    if (!editorRef.current) {
      return
    }
    editorRef.current.focus()
    try {
      document.execCommand(command, false, value)
    } catch (err) {
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
                onFocus={() => setEditorFocused(true)}
                onBlur={(event) => {
                  setEditorFocused(false)
                  setForm((prev) => ({
                    ...prev,
                    noticeHtml: event.currentTarget.innerHTML,
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
              <div>
                <p className="text-xs uppercase text-muted">প্রতিযোগিতা পরিচালনা পর্ষদ (৫ জন)</p>
                <p className="mt-1 text-sm text-ink">নাম, পদবী ও ছবি URL দিন।</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {form.committee.map((member, index) => (
                  <div key={`committee-${index}`} className="grid gap-2 border border-line bg-white p-4">
                    <p className="text-xs uppercase text-muted">সদস্য {index + 1}</p>
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="নাম"
                      list="teacher-name-options"
                      value={member.name}
                      onChange={(event) => updateCommittee(index, 'name', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="পদবী"
                      value={member.title}
                      onChange={(event) => updateCommittee(index, 'title', event.target.value)}
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
                <p className="text-xs uppercase text-muted">প্রতিষ্ঠান ও ফোরাম নেতৃত্ব</p>
                <p className="mt-1 text-sm text-ink">নাম, পদবী ও ছবি URL দিন।</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {[
                  { key: 'founder', label: 'প্রতিষ্ঠাতা ও পৃষ্ঠপোষক' },
                  { key: 'principal', label: 'অধ্যক্ষ' },
                  { key: 'educationDirector', label: 'শিক্ষা পরিচালক' },
                  { key: 'culturalLead', label: 'সাংস্কৃতিক ফোরামের প্রধান দায়িত্বশীল' },
                  { key: 'culturalAssistant', label: 'সাংস্কৃতিক ফোরামের সহকারী দায়িত্বশীল' },
                ].map((role) => (
                  <div key={role.key} className="grid gap-2 border border-line bg-white p-4">
                    <p className="text-xs uppercase text-muted">{role.label}</p>
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="নাম"
                      list="teacher-name-options"
                      value={form.leadership[role.key].name}
                      onChange={(event) => updateLeadership(role.key, 'name', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="পদবী"
                      value={form.leadership[role.key].title}
                      onChange={(event) => updateLeadership(role.key, 'title', event.target.value)}
                    />
                    <input
                      className="h-10 border border-line bg-white px-3 text-ink"
                      placeholder="ছবির লিংক"
                      value={form.leadership[role.key].photoUrl}
                      onChange={(event) => updateLeadership(role.key, 'photoUrl', event.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase text-muted">গ্রুপ দায়িত্বশীল</p>
                <p className="mt-1 text-sm text-ink">প্রতি গ্রুপে প্রধান ও সহকারী দায়িত্বশীল দিন।</p>
              </div>
              <div className="grid gap-4">
                {groupOptions.length === 0 ? (
                  <p className="text-sm text-muted">গ্রুপ যোগ করা হয়নি।</p>
                ) : (
                  form.groupLeads.map((lead) => {
                    const groupName = groupOptions.find((item) => item.id === lead.groupId)?.name || 'গ্রুপ'
                    return (
                      <div key={lead.groupId} className="grid gap-3 border border-line bg-white p-4">
                        <p className="text-sm font-semibold text-ink">{groupName}</p>
                        <div className="grid gap-3 lg:grid-cols-2">
                          <div className="grid gap-2">
                            <p className="text-xs uppercase text-muted">প্রধান দায়িত্বশীল</p>
                            <input
                              className="h-10 border border-line bg-white px-3 text-ink"
                              placeholder="নাম"
                              list="teacher-name-options"
                              value={lead.leadName}
                              onChange={(event) => updateGroupLead(lead.groupId, 'leadName', event.target.value)}
                            />
                            <input
                              className="h-10 border border-line bg-white px-3 text-ink"
                              placeholder="পদবী"
                              value={lead.leadTitle}
                              onChange={(event) => updateGroupLead(lead.groupId, 'leadTitle', event.target.value)}
                            />
                            <input
                              className="h-10 border border-line bg-white px-3 text-ink"
                              placeholder="ছবির লিংক"
                              value={lead.leadPhotoUrl}
                              onChange={(event) => updateGroupLead(lead.groupId, 'leadPhotoUrl', event.target.value)}
                            />
                          </div>
                          <div className="grid gap-2">
                            <p className="text-xs uppercase text-muted">সহকারী দায়িত্বশীল</p>
                            <input
                              className="h-10 border border-line bg-white px-3 text-ink"
                              placeholder="নাম"
                              list="teacher-name-options"
                              value={lead.assistantName}
                              onChange={(event) => updateGroupLead(lead.groupId, 'assistantName', event.target.value)}
                            />
                            <input
                              className="h-10 border border-line bg-white px-3 text-ink"
                              placeholder="পদবী"
                              value={lead.assistantTitle}
                              onChange={(event) => updateGroupLead(lead.groupId, 'assistantTitle', event.target.value)}
                            />
                            <input
                              className="h-10 border border-line bg-white px-3 text-ink"
                              placeholder="ছবির লিংক"
                              value={lead.assistantPhotoUrl}
                              onChange={(event) => updateGroupLead(lead.groupId, 'assistantPhotoUrl', event.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-xs uppercase text-muted">বিষয় দায়িত্বশীল (২টি)</p>
                <p className="mt-1 text-sm text-ink">দুটি বিষয়ের জন্য প্রধান দায়িত্বশীল দিন।</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {form.subjectLeads.map((lead, index) => (
                  <div key={`subject-lead-${index}`} className="grid gap-2 border border-line bg-white p-4">
                    <p className="text-xs uppercase text-muted">বিষয় {index + 1}</p>
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
                      onChange={(event) => updateSubjectLead(index, 'name', event.target.value)}
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
              <div>
                <p className="text-xs uppercase text-muted">ক্লাস দায়িত্বশীল (২টি)</p>
                <p className="mt-1 text-sm text-ink">শুধু দুইটি শ্রেণির জন্য অতিরিক্ত দায়িত্বশীল দিন।</p>
              </div>
              <div className="grid gap-3 lg:grid-cols-2">
                {form.classLeads.map((lead, index) => (
                  <div key={`class-lead-${index}`} className="grid gap-2 border border-line bg-white p-4">
                    <p className="text-xs uppercase text-muted">শ্রেণি {index + 1}</p>
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
                      onChange={(event) => updateClassLead(index, 'name', event.target.value)}
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
