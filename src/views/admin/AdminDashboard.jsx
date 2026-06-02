import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SectionCard from '../../components/SectionCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { getSystemSettings } from '../../services/systemSettings.js'
import { getGroups } from '../../services/groups.js'
import { getRegistrations } from '../../services/registrations.js'

const quickLinks = [
  {
    label: 'একাডেমিক বছর',
    hint: 'সক্রিয় বা আর্কাইভ নির্ধারণ',
    to: '/admin/academic-years',
  },
  { label: 'শ্রেণি', hint: 'শ্রেণির তালিকা', to: '/admin/classes' },
  { label: 'বিষয়', hint: 'সিলেবাসসহ বিষয়', to: '/admin/subjects' },
  { label: 'গ্রুপ', hint: 'শ্রেণি ও বিষয় ম্যাপিং', to: '/admin/groups' },
  { label: 'শিক্ষক', hint: 'লিড ও সহকারী', to: '/admin/teachers' },
  { label: 'রেজিস্ট্রেশন', hint: 'শিক্ষার্থী নিবন্ধন', to: '/admin/registrations' },
  { label: 'দায়িত্ব বণ্টন', hint: 'হোম পেজ তথ্য', to: '/admin/assignments' },
  { label: 'মার্কশিট', hint: 'প্রিন্ট শিট', to: '/admin/marksheets' },
  { label: 'মার্কস এন্ট্রি', hint: 'বিচারকের নম্বর', to: '/admin/marks-entry' },
  { label: 'ফলাফল', hint: 'মেধা তালিকা', to: '/admin/results' },
]

function AdminDashboard() {
  const { user, signOut } = useAuth()
  const [settingsStatus, setSettingsStatus] = useState('idle')
  const [settingsError, setSettingsError] = useState('')
  const [settingsSnapshot, setSettingsSnapshot] = useState(null)
  const [activeYearId, setActiveYearId] = useState('')
  const [registrationCount, setRegistrationCount] = useState(0)
  const [groupCount, setGroupCount] = useState(0)

  useEffect(() => {
    let active = true

    const loadSettings = async () => {
      setSettingsStatus('loading')
      setSettingsError('')
      try {
        const data = await getSystemSettings()
        if (active) {
          setSettingsSnapshot(data)
          setSettingsStatus('ready')
          setActiveYearId(data.activeYearId || '')
        }
      } catch (error) {
        if (active) {
          setSettingsError('settings/system পড়া যায়নি।')
          setSettingsStatus('error')
        }
      }
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true

    const loadCounts = async () => {
      if (!activeYearId) {
        return
      }
      try {
        const [groups, registrations] = await Promise.all([
          getGroups(activeYearId),
          getRegistrations(activeYearId),
        ])
        if (active) {
          setGroupCount(groups.length)
          setRegistrationCount(registrations.length)
        }
      } catch (error) {
        if (active) {
          setGroupCount(0)
          setRegistrationCount(0)
        }
      }
    }

    loadCounts()
    return () => {
      active = false
    }
  }, [activeYearId])

  return (
    <div className="grid gap-6">
      <section className="border border-line bg-white px-4 py-4 text-sm text-muted sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em]">সাইন ইন</p>
            <p className="mt-1 text-sm text-ink">{user?.email || 'অ্যাডমিন'}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="h-9 border border-ink bg-white px-4 text-xs font-semibold text-ink"
          >
            সাইন আউট
          </button>
        </div>
      </section>
      <SectionCard
        title="সিস্টেম ওভারভিউ"
        subtitle="সিঙ্গেল অ্যাডমিন কন্ট্রোল প্যানেল"
      >
        <div className="grid gap-4 text-sm text-muted lg:grid-cols-3">
          <div className="border border-line px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em]">সক্রিয় বছর</p>
            <p className="mt-2 font-semibold text-ink">
              {activeYearId || 'নির্ধারিত নয়'}
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em]">রেজিস্ট্রেশন</p>
            <p className="mt-2 font-semibold text-ink">
              {activeYearId ? `${registrationCount} জন` : '০ জন'}
            </p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em]">গ্রুপ</p>
            <p className="mt-2 font-semibold text-ink">
              {activeYearId ? `${groupCount}টি` : '০টি'}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="কানেক্টিভিটি চেক"
        subtitle="অথ ও ফায়ারস্টোর যাচাই"
      >
        <div className="grid gap-4 text-sm text-muted lg:grid-cols-3">
          <div className="border border-line px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em]">অথ</p>
            <p className="mt-2 font-semibold text-ink">
              {user ? 'সাইন ইন' : 'সাইন ইন নেই'}
            </p>
            <p className="mt-1 text-xs">ইউআইডি: {user?.uid || 'নেই'}</p>
          </div>
          <div className="border border-line px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em]">ফায়ারস্টোর</p>
            <p className="mt-2 font-semibold text-ink">
              {settingsStatus === 'loading' && 'চেক হচ্ছে...'}
              {settingsStatus === 'ready' && 'সংযুক্ত'}
              {settingsStatus === 'error' && 'সমস্যা'}
              {settingsStatus === 'idle' && 'অপেক্ষা'}
            </p>
            {settingsError ? (
              <p className="mt-1 text-xs text-muted">{settingsError}</p>
            ) : null}
          </div>
          <div className="border border-line px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em]">সেটিংস</p>
            <p className="mt-2 font-semibold text-ink">
              {settingsSnapshot ? 'লোড হয়েছে' : 'পাওয়া যায়নি'}
            </p>
            <p className="mt-1 text-xs">
              অ্যাডমিন ইউআইডি: {settingsSnapshot?.adminUids?.length || 0}
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="দ্রুত লিংক" subtitle="সাধারণ কাজ">
        <div className="grid gap-3 text-sm text-muted lg:grid-cols-2">
          {quickLinks.map((item) => (
            <div key={item.label} className="border border-line px-4 py-3">
              {item.to ? (
                <Link className="font-semibold text-ink" to={item.to}>
                  {item.label}
                </Link>
              ) : (
                <p className="font-semibold text-ink">{item.label}</p>
              )}
              <p className="mt-1 text-xs text-muted">{item.hint}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

export default AdminDashboard
