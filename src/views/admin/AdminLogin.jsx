import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SectionCard from '../../components/SectionCard.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const { signIn, isAdmin, authError } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/dashboard')
    }
  }, [isAdmin, navigate])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    try {
      await signIn(email, password)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SectionCard title="অ্যাডমিন লগইন" subtitle="শুধু সুপার অ্যাডমিন">
      <form className="grid gap-4" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm text-muted">
          ইমেইল
          <input
            className="h-11 border border-line bg-white px-3 text-ink"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@domain.com"
            type="email"
          />
        </label>
        <label className="grid gap-2 text-sm text-muted">
          পাসওয়ার্ড
          <input
            className="h-11 border border-line bg-white px-3 text-ink"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="********"
            type="password"
          />
        </label>
        <button
          type="submit"
          className="h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={busy}
        >
          {busy ? 'সাইন ইন হচ্ছে...' : 'সাইন ইন'}
        </button>
      </form>
      {authError ? (
        <p className="mt-3 border border-line bg-white px-3 py-2 text-xs text-muted">
          {authError}
        </p>
      ) : null}
      <div className="mt-4 text-xs text-muted">
        <p>
          Firebase Auth অ্যাকাউন্ট ব্যবহার করুন। অনুমোদিত UID না থাকলে প্রবেশ
          নিষিদ্ধ হবে।
        </p>
      </div>
    </SectionCard>
  )
}

export default AdminLogin
