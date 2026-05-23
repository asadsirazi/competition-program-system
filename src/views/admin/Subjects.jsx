import { useEffect, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import {
  createSubject,
  deleteSubject,
  getSubjects,
  updateSubject,
} from '../../services/subjects.js'

const emptyForm = { name: '' }

function Subjects() {
  const [activeYearId, setActiveYearId] = useState('')
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingForm, setEditingForm] = useState(emptyForm)

  const loadSubjects = async () => {
    setStatus('loading')
    setError('')
    try {
      const yearId = await getActiveYearId()
      const list = await getSubjects(yearId)
      setActiveYearId(yearId)
      setItems(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'বিষয় তালিকা আনতে সমস্যা হয়েছে।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadSubjects()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await createSubject(activeYearId, form)
      setForm(emptyForm)
      await loadSubjects()
    } catch (err) {
      setError(err.message || 'বিষয় যোগ করা যায়নি।')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditingForm({ name: item.name || '' })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingForm(emptyForm)
  }

  const saveEdit = async (itemId) => {
    setError('')
    try {
      await updateSubject(activeYearId, itemId, editingForm)
      cancelEdit()
      await loadSubjects()
    } catch (err) {
      setError(err.message || 'বিষয় আপডেট করা যায়নি।')
    }
  }

  const handleDelete = async (itemId) => {
    setError('')
    try {
      await deleteSubject(activeYearId, itemId)
      await loadSubjects()
    } catch (err) {
      setError(err.message || 'বিষয় মুছে ফেলা যায়নি।')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="বিষয়" subtitle="সক্রিয় বছরের বিষয় ব্যবস্থাপনা">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <form className="grid gap-3" onSubmit={handleCreate}>
          <label className="grid gap-2 text-sm text-muted">
            বিষয়ের নাম
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="হামদ ও নাত"
            />
          </label>
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

      <SectionCard title="বিষয় তালিকা" subtitle="সম্পাদনা বা মুছুন">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো বিষয় যোগ হয়নি।</p>
        ) : null}
        {items.length > 0 ? (
          <div className="grid gap-3 text-sm text-muted">
            {items.map((item) => (
              <div
                key={item.id}
                className="border border-line px-4 py-3"
              >
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
                    <textarea
                      className="min-h-[100px] border border-line bg-white px-3 py-2 text-ink"
                      value={editingForm.syllabus}
                      onChange={(event) =>
                        setEditingForm((prev) => ({
                          ...prev,
                          syllabus: event.target.value,
                        }))
                      }
                    />
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
                  <div className="grid gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{item.name}</p>
                      <p className="text-xs text-muted">
                        ক্রমিক: {item.sortOrder ?? '-'}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
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

export default Subjects
