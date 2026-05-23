import { useEffect, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getSystemSettings } from '../../services/systemSettings.js'
import {
  createAcademicYear,
  getAcademicYears,
  setActiveAcademicYear,
} from '../../services/academicYears.js'

function AcademicYears() {
  const [years, setYears] = useState([])
  const [activeYearId, setActiveYearId] = useState('')
  const [newYear, setNewYear] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [actionMessage, setActionMessage] = useState('')
  const [cloneMessage, setCloneMessage] = useState('')
  const [cloneStatus, setCloneStatus] = useState('idle')
  const [cloneLogs, setCloneLogs] = useState([])

  const loadYears = async () => {
    setStatus('loading')
    setError('')
    try {
      const [yearList, settings] = await Promise.all([
        getAcademicYears(),
        getSystemSettings(),
      ])
      setYears(yearList)
      setActiveYearId(settings.activeYearId || '')
      setCloneLogs(settings.cloneLogs || [])
      setStatus('ready')
    } catch (err) {
      setError('একাডেমিক বছরের তথ্য আনা যায়নি।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadYears()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    setActionMessage('')
    try {
      await createAcademicYear(newYear)
      setNewYear('')
      setActionMessage('একাডেমিক বছর তৈরি হয়েছে।')
      await loadYears()
    } catch (err) {
      setError(err.message || 'একাডেমিক বছর তৈরি করা যায়নি।')
    }
  }

  const handleSetActive = async (yearId) => {
    setError('')
    setActionMessage('')
    setCloneMessage('')
    setCloneStatus('running')
    try {
      const result = await setActiveAcademicYear(yearId)
      setActionMessage(`সক্রিয় বছর ${yearId} নির্ধারণ হয়েছে।`)
      if (result?.cloned) {
        const { summary } = result
        setCloneMessage(
          `কপি সম্পন্ন: শ্রেণি ${summary.classes}, বিষয় ${summary.subjects}, গ্রুপ ${summary.groups}, শিক্ষক ${summary.teachers}`,
        )
      } else {
        setCloneMessage('কপি করার মতো পূর্ববর্তী বছর নেই।')
      }
      setCloneStatus('done')
      await loadYears()
    } catch (err) {
      setError(err.message || 'সক্রিয় করা যায়নি।')
      setCloneStatus('error')
    }
  }

  const statusLabels = {
    draft: 'খসড়া',
    active: 'সক্রিয়',
    archived: 'আর্কাইভ',
  }

  const formatTimestamp = (value) => {
    if (!value) {
      return 'সময় নেই'
    }
    if (typeof value.toDate === 'function') {
      return value.toDate().toLocaleString('bn-BD')
    }
    return String(value)
  }

  return (
    <div className="grid gap-6">
      <SectionCard
        title="একাডেমিক বছর"
        subtitle="নতুন বছর তৈরি, সক্রিয় ও আর্কাইভ"
      >
        <p className="mb-3 text-xs text-muted">
          নতুন বছর সক্রিয় করলে আগের বছরের শ্রেণি, গ্রুপ, বিষয় ও শিক্ষক ডেটা কপি হবে।
        </p>
        {cloneStatus === 'running' ? (
          <p className="mb-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            কপি চলছে, অপেক্ষা করুন...
          </p>
        ) : null}
        {cloneMessage ? (
          <p className="mb-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {cloneMessage}
          </p>
        ) : null}
        <form className="grid gap-3 lg:grid-cols-[1fr_auto]" onSubmit={handleCreate}>
          <label className="grid gap-2 text-sm text-muted">
            নতুন একাডেমিক বছর
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={newYear}
              onChange={(event) => setNewYear(event.target.value)}
              placeholder="2026"
              inputMode="numeric"
            />
          </label>
          <button
            type="submit"
            className="mt-auto h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white"
          >
            যোগ করুন
          </button>
        </form>
        {actionMessage ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {actionMessage}
          </p>
        ) : null}
        {error ? (
          <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
            {error}
          </p>
        ) : null}
      </SectionCard>

      <SectionCard title="বছরের তালিকা" subtitle="স্ট্যাটাস দেখুন">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && years.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো বছর তৈরি হয়নি।</p>
        ) : null}
        {years.length > 0 ? (
          <div className="grid gap-3 text-sm text-muted">
            {years.map((year) => {
              const isActive = year.id === activeYearId
              return (
                <div
                  key={year.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em]">{year.id}</p>
                    <p className="mt-1 text-xs text-muted">
                      স্ট্যাটাস: {statusLabels[year.status] || 'খসড়া'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    {isActive ? (
                      <span className="border border-ink px-3 py-2 text-ink">
                        সক্রিয়
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="h-9 border border-ink bg-white px-4 font-semibold text-ink"
                        onClick={() => handleSetActive(year.id)}
                      >
                        সক্রিয় করুন
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </SectionCard>

      <SectionCard title="ক্লোন লগ" subtitle="সর্বশেষ কপি ইতিহাস">
        {cloneLogs.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো ক্লোন লগ নেই।</p>
        ) : (
          <div className="grid gap-2 text-xs text-muted">
            {cloneLogs
              .slice()
              .sort((a, b) => {
                const aTime = a?.createdAt?.seconds || 0
                const bTime = b?.createdAt?.seconds || 0
                return bTime - aTime
              })
              .slice(0, 6)
              .map((log, index) => (
                <div
                  key={`${log.toYearId || 'log'}-${index}`}
                  className="border border-line bg-white px-3 py-2"
                >
                  <p>
                    {log.fromYearId || 'নির্দিষ্ট নয়'} → {log.toYearId || 'নির্দিষ্ট নয়'}
                  </p>
                  <p>
                    শ্রেণি {log.summary?.classes ?? 0}, বিষয় {log.summary?.subjects ?? 0}, গ্রুপ {log.summary?.groups ?? 0}, শিক্ষক {log.summary?.teachers ?? 0}
                  </p>
                  <p>{formatTimestamp(log.createdAt)}</p>
                </div>
              ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

export default AcademicYears
