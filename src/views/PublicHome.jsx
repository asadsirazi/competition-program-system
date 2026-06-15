import { useEffect, useMemo, useState } from 'react'
import AppShell from '../components/AppShell.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { getActiveYearId } from '../services/activeYear.js'
import { getGroups } from '../services/groups.js'
import { getSubjects } from '../services/subjects.js'
import { getClasses } from '../services/classes.js'
import { getSystemSettings } from '../services/systemSettings.js'
import { getRegistrations } from '../services/registrations.js'

function normalizePerson(person = {}) {
  return {
    name: person.name || '',
    title: person.title || '',
    photoUrl: person.photoUrl || '',
  }
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasPersonData(person = {}) {
  return Boolean(person.name || person.title || person.title2 || person.photoUrl)
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

function normalizeGroupLeads(groupLeads = []) {
  if (!Array.isArray(groupLeads)) {
    return []
  }
  return groupLeads.map((item) => {
    let lead = { name: '', title: '', photoUrl: '' }
    let assistants = []

    // Backward compatibility check for old format flat fields
    if (item.leadName || item.leadTitle || item.leadPhotoUrl) {
      lead = {
        name: item.leadName || '',
        title: item.leadTitle || '',
        photoUrl: item.leadPhotoUrl || '',
      }
    } else if (item.lead) {
      lead = normalizePerson(item.lead)
    }

    if (Array.isArray(item.assistants)) {
      assistants = item.assistants.map(normalizePerson)
    } else if (item.assistantName || item.assistantTitle || item.assistantPhotoUrl) {
      assistants = [
        {
          name: item.assistantName || '',
          title: item.assistantTitle || '',
          photoUrl: item.assistantPhotoUrl || '',
        },
      ]
    }

    return {
      groupId: item.groupId,
      lead,
      assistants,
    }
  })
}

function PersonCard({ person, label }) {
  if (!hasPersonData(person)) {
    return null
  }

  return (
    <div className="flex gap-4 border border-line bg-white px-4 py-4">
      <div className="h-16 w-16 overflow-hidden rounded-full border border-line bg-[var(--surface-alt)]">
        {person.photoUrl ? (
          <img
            src={person.photoUrl}
            alt={person.name || 'দায়িত্বশীল'}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : null}
      </div>
      <div>
        {label ? <p className="text-xs uppercase text-muted">{label}</p> : null}
        <p className="text-sm font-semibold text-ink">{person.name || 'নাম নেই'}</p>
        <p className="text-xs text-muted">{person.title || 'পদবী নেই'}</p>
        {person.title2 ? <p className="text-xs text-muted mt-0.5">{person.title2}</p> : null}
      </div>
    </div>
  )
}

function PublicHome() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [subjects, setSubjects] = useState([])
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [expandedSubjects, setExpandedSubjects] = useState({})

  const classMap = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, item.name])),
    [classes],
  )
  const groupMap = useMemo(
    () => Object.fromEntries(groups.map((item) => [item.id, item.name])),
    [groups],
  )
  const subjectMap = useMemo(
    () => Object.fromEntries(subjects.map((item) => [item.id, item.name])),
    [subjects],
  )

  useEffect(() => {
    let active = true

    const loadHome = async () => {
      setStatus('loading')
      setError('')
      try {
        const yearId = await getActiveYearId()
        const [groupList, rawSubjectList, classList, settings, registrationList] = await Promise.all([
          getGroups(yearId),
          getSubjects(yearId),
          getClasses(yearId),
          getSystemSettings(),
          getRegistrations(yearId),
        ])
        if (!active) {
          return
        }
        
        const subjectList = [...rawSubjectList].sort((a, b) => {
          const orderA = Number(a.sortOrder ?? 0)
          const orderB = Number(b.sortOrder ?? 0)
          if (orderA !== orderB) return orderA - orderB
          return String(a.name || '').localeCompare(String(b.name || ''), 'bn')
        })

        const saved = settings?.assignmentsByYear?.[yearId] || {}
        setActiveYearId(yearId)
        setGroups(groupList)
        setSubjects(subjectList)
        setClasses(classList)
        setAssignments(saved)
        setRegistrations(registrationList)
        setStatus('ready')
      } catch (err) {
        if (active) {
          setError(err.message || 'তথ্য লোড করা যায়নি।')
          setStatus('error')
        }
      }
    }

    loadHome()
    return () => {
      active = false
    }
  }, [])

  const noticeHtml = assignments?.noticeHtml || assignments?.notice || ''
  const noticeText = stripHtml(noticeHtml)
  const committee = normalizeCommittee(assignments?.committee)
  const groupLeads = normalizeGroupLeads(assignments?.groupLeads)
  const subjectLeads = normalizeSubjectLeads(assignments?.subjectLeads)
  const classLeads = normalizeClassLeads(assignments?.classLeads)

  const committeeFilled = committee.filter((member) => hasPersonData(member))

  const groupLeadsFilled = groupLeads.filter((lead) => {
    return hasPersonData(lead.lead) || lead.assistants.some(hasPersonData)
  })

  const subjectLeadsFilled = subjectLeads.filter(
    (lead) => lead.subjectId && hasPersonData(lead),
  )
  const classLeadsFilled = classLeads.filter(
    (lead) => lead.classId && hasPersonData(lead),
  )


  const registrationsByGroup = useMemo(() => {
    const grouped = {}
    registrations.forEach((item) => {
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

    Object.values(grouped).forEach((subjectsMap) => {
      Object.values(subjectsMap).forEach((list) => {
        list.sort((a, b) => {
          const serialA = Number(a.serialNumber ?? 0)
          const serialB = Number(b.serialNumber ?? 0)
          if (serialA !== serialB) {
            return serialA - serialB
          }
          return String(a.studentName || '').localeCompare(String(b.studentName || ''), 'bn')
        })
      })
    })

    return grouped
  }, [registrations])

  const toggleSubject = (key) => {
    setExpandedSubjects((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="border border-line bg-white p-8">
          <p className="font-impact text-xs uppercase tracking-[0.3em] text-muted">
            তথ্য কেন্দ্র
          </p>
          <h2 className="mt-2 font-bangla text-3xl text-ink">
            সাংস্কৃতিক প্রতিযোগিতা তথ্য কেন্দ্র
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            শিক্ষক ও দায়িত্বপ্রাপ্ত সদস্যদের জন্য বিভাগভিত্তিক দায়িত্ব, সিলেবাস এবং
            নিবন্ধিত শিক্ষার্থীদের তালিকা এখানে প্রকাশিত থাকবে।
          </p>
        </section>
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}

        {noticeText ? (
          <SectionCard title="সাংস্কৃতিক প্রতিযোগিতার বিজ্ঞপ্তি" subtitle="সর্বশেষ নির্দেশনা">
            <div
              className="text-sm text-ink prose max-w-none"
              style={{ fontFamily: 'SulaimanLipi, sans-serif' }}
              dangerouslySetInnerHTML={{ __html: noticeHtml }}
            />
          </SectionCard>
        ) : null}

        <SectionCard title="প্রতিযোগিতা সারাংশ" subtitle="গ্রুপ, শ্রেণি ও বিষয়">
          <div className="grid gap-4 text-sm text-muted lg:grid-cols-3">
            <div className="border border-line px-4 py-3">
              <p className="text-xs uppercase text-muted">মোট গ্রুপ</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {activeYearId ? `${groups.length}টি` : '০টি'}
              </p>
            </div>
            <div className="border border-line px-4 py-3">
              <p className="text-xs uppercase text-muted">মোট বিষয়</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {activeYearId ? `${subjects.length}টি` : '০টি'}
              </p>
            </div>
            <div className="border border-line px-4 py-3">
              <p className="text-xs uppercase text-muted">সক্রিয় বছর</p>
              <p className="mt-2 text-lg font-semibold text-ink">
                {activeYearId || 'নির্ধারিত নয়'}
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {groups.length === 0 ? (
              <p className="text-sm text-muted">গ্রুপের তথ্য পাওয়া যায়নি।</p>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="border border-line px-4 py-3">
                  <p className="font-semibold text-ink">{group.name}</p>
                  <p className="mt-2 text-xs text-muted">শ্রেণি তালিকা</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted">
                    {(group.classes || []).length ? (
                      group.classes.map((item) => (
                        <span key={item.id} className="border border-line px-2 py-1">
                          {item.name}
                        </span>
                      ))
                    ) : (
                      <span className="border border-line px-2 py-1">শ্রেণি নেই</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </SectionCard>

        <SectionCard title="রেজিস্টারকৃত প্রতিযোগীর তালিকা" subtitle="গ্রুপ ও বিষয় অনুযায়ী">
          {groups.length === 0 ? (
            <p className="text-sm text-muted">গ্রুপের তথ্য পাওয়া যায়নি।</p>
          ) : (
            <div className="grid gap-4">
              {groups.map((group) => {
                const subjectsMap = registrationsByGroup[group.id] || {}
                const subjectIds = Object.keys(subjectsMap)
                const sortedSubjectIds = subjectIds.sort((a, b) => {
                  const idxA = subjects.findIndex((s) => s.id === a)
                  const idxB = subjects.findIndex((s) => s.id === b)
                  return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB)
                })

                return (
                  <div key={group.id} className="border border-line bg-white px-4 py-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{group.name}</p>
                      <span className="text-xs text-muted">
                        বিষয়: {sortedSubjectIds.length || 0}টি
                      </span>
                    </div>
                    {sortedSubjectIds.length === 0 ? (
                      <p className="mt-3 text-sm text-muted">এখনো কোনো নিবন্ধন নেই।</p>
                    ) : (
                      <div className="mt-4 grid gap-3 lg:grid-cols-2">
                        {sortedSubjectIds.map((subjectId) => {
                          const list = subjectsMap[subjectId] || []
                          const topThree = list.slice(0, 3)
                          const extra = list.slice(3)
                          const toggleKey = `${group.id}-${subjectId}`
                          const isExpanded = Boolean(expandedSubjects[toggleKey])

                          return (
                            <div key={subjectId} className="border border-line px-4 py-3">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-ink">
                                  {subjectMap[subjectId] || 'বিষয়'}
                                </p>
                                <span className="text-xs text-muted">{list.length} জন</span>
                              </div>
                              <div className="mt-3 grid gap-2 text-sm text-muted">
                                {topThree.map((student) => (
                                  <div key={student.id} className="flex items-center justify-between border border-line px-3 py-2">
                                    <span>{student.studentName || 'নাম নেই'}</span>
                                    <span className="text-xs text-muted">{student.className || ''}</span>
                                  </div>
                                ))}
                                {extra.length > 0 ? (
                                  <div className={`extra-list ${isExpanded ? 'is-expanded' : ''}`}>
                                    <div className="grid gap-2 pt-2">
                                      {extra.map((student) => (
                                        <div key={student.id} className="flex items-center justify-between border border-line px-3 py-2">
                                          <span>{student.studentName || 'নাম নেই'}</span>
                                          <span className="text-xs text-muted">{student.className || ''}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                              {extra.length > 0 ? (
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
              })}
            </div>
          )}
        </SectionCard>

        {committeeFilled.length ? (
          <SectionCard title="প্রতিযোগিতা পরিচালনা পর্ষদ" subtitle="সদস্য তালিকা">
            <div className="grid gap-3 lg:grid-cols-2">
              {committeeFilled.map((member, index) => (
                <PersonCard
                  key={`committee-${index}`}
                  person={member}
                  label={`সদস্য ${index + 1}`}
                />
              ))}
            </div>
          </SectionCard>
        ) : null}

        {groupLeadsFilled.length ? (
          <SectionCard title="গ্রুপ দায়িত্বশীল" subtitle="প্রধান ও সহকারী">
            <div className="grid gap-3">
              {groupLeadsFilled.map((lead) => (
                <div key={lead.groupId} className="border border-line px-4 py-4">
                  <p className="text-sm font-semibold text-ink">
                    {groupMap[lead.groupId] || 'গ্রুপ'}
                  </p>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {hasPersonData(lead.lead) ? (
                      <PersonCard
                        person={lead.lead}
                        label="প্রধান দায়িত্বশীল"
                      />
                    ) : null}
                    {lead.assistants.map((assistant, idx) => (
                      hasPersonData(assistant) ? (
                        <PersonCard
                          key={`assistant-${idx}`}
                          person={assistant}
                          label={`সহকারী দায়িত্বশীল ${lead.assistants.length > 1 ? idx + 1 : ''}`}
                        />
                      ) : null
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {subjectLeadsFilled.length ? (
          <SectionCard title="বিষয় দায়িত্বশীল" subtitle="দায়িত্বপ্রাপ্ত শিক্ষক তালিকা">
            <div className="grid gap-3 lg:grid-cols-2">
              {subjectLeadsFilled.map((lead, index) => (
                <div key={`subject-lead-${index}`} className="border border-line px-4 py-4">
                  <p className="text-xs uppercase text-muted">
                    {subjectMap[lead.subjectId] || 'বিষয় নির্ধারিত নয়'}
                  </p>
                  <PersonCard person={lead} />
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}

        {classLeadsFilled.length ? (
          <SectionCard title="ক্লাস দায়িত্বশীল" subtitle="শ্রেণি দায়িত্বশীল শিক্ষক তালিকা">
            <div className="grid gap-3 lg:grid-cols-2">
              {classLeadsFilled.map((lead, index) => (
                <div key={`class-lead-${index}`} className="border border-line px-4 py-4">
                  <p className="text-xs uppercase text-muted">
                    {classMap[lead.classId] || 'শ্রেণি নির্ধারিত নয়'}
                  </p>
                  <PersonCard person={lead} />
                </div>
              ))}
            </div>
          </SectionCard>
        ) : null}
      </div>
    </AppShell>
  )
}

export default PublicHome
