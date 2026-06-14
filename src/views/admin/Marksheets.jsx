import { useEffect, useMemo, useRef, useState } from 'react'
import { downloadMarksheetPdf } from '../../services/pdf/pdfService.jsx'
import { toPng } from 'html-to-image'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import { getClasses } from '../../services/classes.js'
import { getSubjects } from '../../services/subjects.js'
import { getGroups } from '../../services/groups.js'
import { getRegistrations } from '../../services/registrations.js'
import { getSystemSettings } from '../../services/systemSettings.js'
import { getGroupSubjectOptions } from '../../utils/groupSubjects.js'
import { sortRegistrationsByClass } from '../../utils/registrationOrdering.js'
import { getMarkCriteria } from '../../utils/markCriteria.js'

const emptyFilters = { groupId: '', subjectId: '' }
const pageWidthIn = 11.69
const pageHeightIn = 8.27
const sheetCopies = [1, 2, 3]

const digitMap = {
  0: '০',
  1: '১',
  2: '২',
  3: '৩',
  4: '৪',
  5: '৫',
  6: '৬',
  7: '৭',
  8: '৮',
  9: '৯',
}

const ordinalClassLabels = {
  1: '১ম',
  2: '২য়',
  3: '৩য়',
  4: '৪র্থ',
  5: '৫ম',
  6: '৬ষ্ট',
  7: '৭ম',
  8: '৮ম',
  9: '৯ম',
  10: '১০ম',
  11: '১১শ',
  12: '১২শ',
}

function toBengaliDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => digitMap[digit] || digit)
}

function matchesAny(text, patterns) {
  return patterns.some((pattern) => pattern.test(text))
}

function abbreviateClassName(className = '') {
  const normalized = className.trim()
  if (!normalized) {
    return '-'
  }

  const lower = normalized.toLowerCase()
  const isBoyBranch = /বালক|ছাত্র|boy/.test(lower)
  const stripped = normalized
    .replace(/\bবালক\b/g, '')
    .replace(/\bছাত্র\b/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/[-–—]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const shortLabels = [
    { label: 'শিশু', patterns: [/শিশু/i, /nursery/i, /kg1/i, /kg/i] },
    { label: '১২শ', patterns: [/দ্বাদশ/i, /12/i, /১২/i, /twelve/i] },
    { label: '১১শ', patterns: [/একাদশ/i, /11/i, /১১/i, /eleven/i] },
    { label: '১০ম', patterns: [/দশম/i, /10/i, /১০/i, /tenth/i] },
    { label: '৯ম', patterns: [/নবম/i, /9/i, /৯/i, /ninth/i] },
    { label: '৮ম', patterns: [/অষ্টম/i, /8/i, /৮/i, /eighth/i] },
    { label: '৭ম', patterns: [/সপ্তম/i, /7/i, /৭/i, /seventh/i] },
    { label: '৬ষ্ট', patterns: [/ষষ্ঠ/i, /6/i, /৬/i, /sixth/i] },
    { label: '৫ম', patterns: [/পঞ্চম/i, /5/i, /৫/i, /fifth/i] },
    { label: '৪র্থ', patterns: [/চতুর্থ/i, /4/i, /৪/i, /fourth/i] },
    { label: '৩য়', patterns: [/তৃতীয়/i, /3/i, /৩/i, /third/i] },
    { label: '২য়', patterns: [/দ্বিতীয়/i, /2/i, /২/i, /second/i] },
    { label: '১ম', patterns: [/প্রথম/i, /1/i, /১/i, /first/i] },
  ]

  const matchedShortLabel = shortLabels.find(({ patterns }) => matchesAny(stripped, patterns))?.label
  if (matchedShortLabel) {
    return isBoyBranch ? `${matchedShortLabel}-বা` : matchedShortLabel
  }

  const numericMatch = stripped.match(/(\d+|[০-৯]+)/)
  if (numericMatch) {
    const numericValue = Number(String(numericMatch[1]).replace(/[০-৯]/g, (digit) => '০১২৩৪৫৬৭৮৯'.indexOf(digit)))
    const label = ordinalClassLabels[numericValue] || `${toBengaliDigits(numericMatch[1])}ম`
    return isBoyBranch ? `${label}-বা` : label
  }

  return isBoyBranch ? `${stripped}-বা` : stripped
}

function Marksheets() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [criteriaText, setCriteriaText] = useState('')
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [institutionName, setInstitutionName] = useState('আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা')
  const printRef = useRef(null)

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
  const defaultCriteriaText = useMemo(
    () => getMarkCriteria(selectedSubject?.name || '').join(' / '),
    [selectedSubject?.name],
  )

  useEffect(() => {
    const loadReferenceData = async () => {
      setStatus('loading')
      setError('')
      try {
        const yearId = await getActiveYearId()
        const [groupList, classList, subjectList, settings] = await Promise.all([
          getGroups(yearId),
          getClasses(yearId),
          getSubjects(yearId),
          getSystemSettings(),
        ])
        setActiveYearId(yearId)
        setGroups(groupList)
        setClasses(classList)
        setSubjects(subjectList)
        setInstitutionName(settings?.institutionName || 'আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা')
        setStatus('ready')
      } catch (err) {
        setError(err.message || 'রেফারেন্স ডাটা আনা যায়নি।')
        setStatus('error')
      }
    }

    void loadReferenceData()
  }, [])

  const loadMarksheets = async () => {
    if (!activeYearId) {
      return
    }
    setStatus('loading')
    setError('')
    try {
      const list = await getRegistrations(activeYearId, filters)
      setItems(sortRegistrationsByClass(list, classes))
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'মার্কশিট লোড করা যায়নি।')
      setStatus('error')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    if (!printRef.current) {
      return
    }

    const safeName = [
      institutionName,
      groupMap[filters.groupId] || 'group',
      subjectMap[filters.subjectId] || 'subject',
    ]
      .join('-')
      .replace(/\s+/g, '-')

    await downloadMarksheetPdf({
      year: activeYearId,
      institution: institutionName,
      groupName: groupMap[filters.groupId] || 'নির্বাচন করুন',
      subjectName: subjectMap[filters.subjectId] || 'নির্বাচন করুন',
      criteriaText: criteriaText || defaultCriteriaText,
      items: items
    }, `${safeName}.pdf`)
  }

  const handleDownloadImage = async () => {
    if (!printRef.current) {
      return
    }

    const safeName = [
      institutionName,
      groupMap[filters.groupId] || 'group',
      subjectMap[filters.subjectId] || 'subject',
    ]
      .join('-')
      .replace(/\s+/g, '-')

    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 1.0,
        pixelRatio: 3,
        backgroundColor: '#ffffff',
      })
      const link = document.createElement('a')
      link.download = `${safeName}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      setError(err.message || 'ছবি ডাউনলোড করা যায়নি।')
    }
  }

  const showMetadata = filters.groupId && filters.subjectId

  const criteriaValue = criteriaText || defaultCriteriaText

  const updateCriteriaForSubject = (subjectId) => {
    const nextSubject = subjects.find((item) => item.id === subjectId)
    setCriteriaText(getMarkCriteria(nextSubject?.name || '').join(' / '))
  }

  const renderSheetHeader = () => (
    <div className="px-3 pt-2 text-center text-black">
      <p className="text-base font-semibold tracking-[0.18em] text-black">মার্কশিট</p>
      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-black">
        বার্ষিক ইসলামী সাংস্কৃতিক প্রতিযোগিতা {activeYearId || 'বর্তমান শিক্ষাবর্ষ'}
      </p>
      <p className="mt-1 text-sm font-semibold text-black">{institutionName}</p>
      <p className="text-[10px] text-black">উত্তর ঝাপুয়া, কালারমারছড়া, মহেশখালী, কক্সবাজার</p>
      <p className="mt-2 text-xs font-semibold text-black">
        গ্রুপ : {groupMap[filters.groupId] || 'নির্বাচন করুন'}
      </p>
    </div>
  )

  const renderCriteriaEditor = () => (
    <div className="flex min-w-0 flex-1 justify-end">
      {selectedSubject ? (
        <div
          key={selectedSubject.id}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-label="বিষয় ভিত্তিক মানদণ্ড"
          spellCheck={false}
          className="inline-block min-h-8 rounded border border-dashed border-line bg-white px-2 py-1 text-[11px] font-medium text-black outline-none"
          style={{ width: 'fit-content', maxWidth: '100%', whiteSpace: 'nowrap' }}
          onInput={(event) => setCriteriaText(event.currentTarget.textContent || '')}
          onBlur={(event) => setCriteriaText(event.currentTarget.textContent || '')}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
            }
          }}
        >
          {criteriaValue}
        </div>
      ) : (
        <p className="text-[11px] text-black">মানদণ্ড লিখুন</p>
      )}
    </div>
  )

  const renderSheet = (copyNumber) => (
    <div
      key={copyNumber}
      className="marksheet-sheet flex min-h-[2.25in] flex-col bg-white text-black"
    >
      {renderSheetHeader()}
      <div className="mt-1 flex items-center gap-2 px-3 text-[11px] font-semibold text-black">
        <p className="shrink-0 text-left">বিষয়: {subjectMap[filters.subjectId] || 'নির্বাচন করুন'}</p>
        {showMetadata ? renderCriteriaEditor() : <p className="ml-auto text-[11px] text-black">গ্রুপ ও বিষয় নির্ধারণ করুন।</p>}
      </div>
      <div className="px-3 text-[11px] font-semibold text-black">
        <p className="text-left">বিচারক :</p>
      </div>
      <div className="marksheet-table-scroll table-scroll mt-1 flex-1 px-3 pb-2">
        <table className="w-full table-fixed border-collapse text-[10px]">
          <thead>
            <tr className="border border-line bg-white">
              <th className="border border-line px-2 py-2 text-left" style={{ width: '10%' }}>
                ক্র:
              </th>
              <th className="border border-line px-2 py-2 text-left" style={{ width: '50%' }}>
                প্রতিযোগীর নাম
              </th>
              <th className="border border-line px-2 py-2 text-left" style={{ width: '15%' }}>
                শ্রেণি
              </th>
              <th className="border border-line px-2 py-2 text-left" style={{ width: '25%' }}>
                প্রাপ্ত নম্বর (৩৩)
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={item.id} className="border border-line">
                <td className="border border-line px-2 py-2">{toBengaliDigits(index + 1)}</td>
                <td className="border border-line px-2 py-2">{item.studentName}</td>
                <td className="border border-line px-2 py-2">
                  {abbreviateClassName(item.className || '')}
                </td>
                <td className="border border-line px-2 py-2">&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-dashed border-line px-3 py-1 text-center text-[10px] text-black">
        <p>বিচারকের স্বাক্ষর ও তারিখ</p>
      </div>
    </div>
  )

  return (
    <div className="grid gap-6">
      <SectionCard title="মার্কশিট" subtitle="প্রিন্টের জন্য তালিকা প্রস্তুত">
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
              onChange={(event) => {
                const nextSubjectId = event.target.value
                setFilters((prev) => ({ ...prev, subjectId: nextSubjectId }))
                updateCriteriaForSubject(nextSubjectId)
              }}
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
            onClick={loadMarksheets}
          >
            তালিকা লোড করুন
          </button>
          <button
            type="button"
            className="h-10 border border-ink bg-ink px-4 text-xs font-semibold text-white"
            onClick={handlePrint}
            disabled={!items.length}
          >
            প্রিন্ট
          </button>
          <button
            type="button"
            className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink"
            onClick={handleDownload}
            disabled={!items.length}
          >
            পিডিএফ ডাউনলোড
          </button>
          <button
            type="button"
            className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink"
            onClick={handleDownloadImage}
            disabled={!items.length}
          >
            ছবি ডাউনলোড
          </button>
        </div>
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
      </SectionCard>

      <section className="space-y-3">
        <div>
          <h2 className="text-xs uppercase text-ink">মার্কশিট তালিকা</h2>
          <p className="mt-1 text-sm text-muted">৩ জন বিচারকের কলাম</p>
        </div>
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-black">মার্কশিটের জন্য কোনো তথ্য নেই।</p>
        ) : null}
        {items.length > 0 ? (
          <div ref={printRef} className="print-area mx-auto grid max-w-[11.69in] grid-cols-1 gap-3 bg-white p-3 lg:grid-cols-3 print:grid-cols-3">
            {sheetCopies.map((copyNumber) => renderSheet(copyNumber))}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default Marksheets
