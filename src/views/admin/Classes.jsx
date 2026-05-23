import { useEffect, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import {
  createClass,
  deleteClass,
  getClasses,
  updateClass,
} from '../../services/classes.js'

function Classes() {
  const [activeYearId, setActiveYearId] = useState('')
  const [items, setItems] = useState([])
  const [newName, setNewName] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingName, setEditingName] = useState('')

  const loadClasses = async () => {
    setStatus('loading')
    setError('')
    try {
      const yearId = await getActiveYearId()
      const list = await getClasses(yearId)
      setActiveYearId(yearId)
      setItems(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'শ্রেণির তথ্য আনতে সমস্যা হয়েছে।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadClasses()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await createClass(activeYearId, newName)
      setNewName('')
      await loadClasses()
    } catch (err) {
      setError(err.message || 'শ্রেণি যোগ করা যায়নি।')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditingName(item.name)
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingName('')
  }

  const saveEdit = async (itemId) => {
    setError('')
    try {
      await updateClass(activeYearId, itemId, editingName)
      cancelEdit()
      await loadClasses()
    } catch (err) {
      setError(err.message || 'শ্রেণি আপডেট করা যায়নি।')
    }
  }

  const handleDelete = async (itemId) => {
    setError('')
    try {
      await deleteClass(activeYearId, itemId)
      await loadClasses()
    } catch (err) {
      setError(err.message || 'শ্রেণি মুছে ফেলা যায়নি।')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="শ্রেণি" subtitle="সক্রিয় বছরের শ্রেণি ব্যবস্থাপনা">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <form className="grid gap-3 lg:grid-cols-[1fr_auto]" onSubmit={handleCreate}>
          <label className="grid gap-2 text-sm text-muted">
            নতুন শ্রেণির নাম
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="আলিম ১ম বর্ষ"
            />
          </label>
          <button
            type="submit"
            className="mt-auto h-11 border border-ink bg-ink px-4 text-sm font-semibold text-white"
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

      <SectionCard title="শ্রেণির তালিকা" subtitle="সম্পাদনা বা মুছুন">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো শ্রেণি যোগ হয়নি।</p>
        ) : null}
        {items.length > 0 ? (
          <div className="grid gap-3 text-sm text-muted">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 border border-line px-4 py-3"
              >
                {editingId === item.id ? (
                  <input
                    className="h-10 w-full max-w-xs border border-line bg-white px-3 text-ink"
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                  />
                ) : (
                  <p className="font-semibold text-ink">{item.name}</p>
                )}
                <p className="text-xs text-muted">
                  ক্রমিক: {item.sortOrder ?? '-'}
                </p>
                <div className="flex items-center gap-2 text-xs">
                  {editingId === item.id ? (
                    <>
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
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Classes
