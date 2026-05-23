import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppShell from '../components/AppShell.jsx'
import SectionCard from '../components/SectionCard.jsx'
import { getSystemSettings } from '../services/systemSettings.js'

function PublicResultsGate() {
  const [pin, setPin] = useState('')
  const [granted, setGranted] = useState(false)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pinError, setPinError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadSettings = async () => {
      try {
        const data = await getSystemSettings()
        if (active) {
          setSettings(data)
        }
      } catch (err) {
        if (active) {
          setError('সিস্টেম সেটিংস লোড করা যায়নি।')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setPinError('')
    if (!settings?.resultsPin) {
      setPinError('পিন সেট করা হয়নি।')
      return
    }
    if (pin.trim() === settings.resultsPin) {
      setGranted(true)
      navigate('/results/view')
      return
    }

    setPinError('ভুল পিন। আবার চেষ্টা করুন।')
  }

  return (
    <AppShell>
      <div className="grid gap-6">
        <SectionCard
          title="ফলাফল অ্যাক্সেস"
          subtitle="ফলাফল দেখার জন্য পিন দিন"
        >
          {loading ? (
            <div className="text-sm text-muted">সেটিংস লোড হচ্ছে...</div>
          ) : error ? (
            <div className="text-sm text-muted">{error}</div>
          ) : !granted ? (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-muted">
                গ্লোবাল ফলাফল পিন
                <input
                  className="h-11 border border-line bg-white px-3 text-ink"
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="পিন লিখুন"
                  type="password"
                />
              </label>
              {pinError ? (
                <p className="border border-line bg-white px-3 py-2 text-xs text-muted">
                  {pinError}
                </p>
              ) : null}
              <button
                type="submit"
                className="h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white"
              >
                ফলাফল খুলুন
              </button>
            </form>
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default PublicResultsGate
