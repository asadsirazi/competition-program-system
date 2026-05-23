import { useEffect, useMemo, useRef, useState } from 'react'
import html2pdf from 'html2pdf.js'
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
const pageWidthIn = 8.27
const pageHeightIn = 3.9

function Marksheets() {
  const [activeYearId, setActiveYearId] = useState('')
  const [groups, setGroups] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
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
  const criteriaLabels = useMemo(
    () => getMarkCriteria(selectedSubject?.name || ''),
    [selectedSubject?.name],
  )

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

  useEffect(() => {
    loadReferenceData()
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

    await html2pdf()
      .set({
        margin: 0,
        filename: `${safeName}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: 'in',
          format: [pageWidthIn, pageHeightIn],
          orientation: 'landscape',
        },
        pagebreak: { mode: ['avoid-all'] },
      })
      .from(printRef.current)
      .save()
  }

  const showMetadata = filters.groupId && filters.subjectId

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
            ডাউনলোড
          </button>
        </div>
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="মার্কশিট তালিকা" subtitle="৩ জন বিচারকের কলাম">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">মার্কশিটের জন্য কোনো তথ্য নেই।</p>
        ) : null}
        {items.length > 0 ? (
          <div ref={printRef} className="print-area border border-line bg-white p-4">
            <div className="marksheet-sheet flex min-h-[3.9in] flex-col border border-line bg-white px-4 py-3">
              <div className="text-center">
                <p className="text-lg font-semibold text-ink">{institutionName}</p>
                <p className="mt-1 text-sm text-muted">মার্কশিট</p>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted sm:grid-cols-2">
                <p>গ্রুপ: {groupMap[filters.groupId] || 'নির্বাচন করুন'}</p>
                <p>বিষয়: {subjectMap[filters.subjectId] || 'নির্বাচন করুন'}</p>
                <p className="sm:col-span-2">
                  বিচারকের নাম: ১) ________ ২) ________ ৩) ________
                </p>
              </div>
              {showMetadata ? (
                <div className="mt-3 border-t border-dashed border-line pt-2 text-xs text-muted">
                  <p>বিষয়ভিত্তিক মানদণ্ড: {criteriaLabels.join(' / ')}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs">গ্রুপ ও বিষয় নির্ধারণ করুন।</p>
              )}
              <div className="mt-3 flex-1 overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border border-line bg-white">
                      <th className="border border-line px-3 py-2 text-left">ক্রমিক</th>
                      <th className="border border-line px-3 py-2 text-left">রোল</th>
                      <th className="border border-line px-3 py-2 text-left">নাম</th>
                      {criteriaLabels.map((label) => (
                        <th key={label} className="border border-line px-3 py-2 text-left">
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border border-line">
                        <td className="border border-line px-3 py-2">
                          #{item.serialNumber ?? '-'}
                        </td>
                        <td className="border border-line px-3 py-2">
                          {item.rollNumber}
                        </td>
                        <td className="border border-line px-3 py-2">
                          {item.studentName}
                        </td>
                        <td className="border border-line px-3 py-2">&nbsp;</td>
                        <td className="border border-line px-3 py-2">&nbsp;</td>
                        <td className="border border-line px-3 py-2">&nbsp;</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex items-end justify-between gap-4 text-xs text-muted">
                <p>বিচারকের স্বাক্ষর ও তারিখ</p>
                <p>পৃষ্ঠা সাইজ: ৮.২৭ × ৩.৯ ইঞ্চি</p>
              </div>
            </div>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Marksheets
