import { useEffect, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from '../../services/teachers.js'

const emptyForm = { name: '', designation: '', phone: '', email: '' }

function Teachers() {
  const [activeYearId, setActiveYearId] = useState('')
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingForm, setEditingForm] = useState(emptyForm)

  const loadTeachers = async () => {
    setStatus('loading')
    setError('')
    try {
      const yearId = await getActiveYearId()
      const list = await getTeachers(yearId)
      setActiveYearId(yearId)
      setItems(list)
      setStatus('ready')
    } catch (err) {
      setError(err.message || 'শিক্ষকের তথ্য আনতে সমস্যা হয়েছে।')
      setStatus('error')
    }
  }

  useEffect(() => {
    loadTeachers()
  }, [])

  const orderedItems = [...items].sort((a, b) => {
    const orderA = Number(a.sortOrder ?? 0)
    const orderB = Number(b.sortOrder ?? 0)

    if (orderA !== orderB) {
      return orderA - orderB
    }

    return String(a.name || '').localeCompare(String(b.name || ''), 'bn')
  })

  const handleCreate = async (event) => {
    event.preventDefault()
    setError('')
    try {
      await createTeacher(activeYearId, form)
      setForm(emptyForm)
      await loadTeachers()
    } catch (err) {
      setError(err.message || 'শিক্ষক যোগ করা যায়নি।')
    }
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditingForm({
      name: item.name || '',
      designation: item.designation || '',
      phone: item.phone || '',
      email: item.email || '',
    })
  }

  const cancelEdit = () => {
    setEditingId('')
    setEditingForm(emptyForm)
  }

  const saveEdit = async (itemId) => {
    setError('')
    try {
      await updateTeacher(activeYearId, itemId, editingForm)
      cancelEdit()
      await loadTeachers()
    } catch (err) {
      setError(err.message || 'শিক্ষক আপডেট করা যায়নি।')
    }
  }

  const handleDelete = async (itemId) => {
    setError('')
    try {
      await deleteTeacher(activeYearId, itemId)
      await loadTeachers()
    } catch (err) {
      setError(err.message || 'শিক্ষক মুছে ফেলা যায়নি।')
    }
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="শিক্ষক" subtitle="সক্রিয় বছরের শিক্ষক তালিকা">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <form className="grid gap-3" onSubmit={handleCreate}>
          <label className="grid gap-2 text-sm text-muted">
            শিক্ষকের নাম
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="শিক্ষকের নাম"
            />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            পদবি / দায়িত্ব
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={form.designation}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, designation: event.target.value }))
              }
              placeholder="সহকারী শিক্ষক"
            />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            মোবাইল
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={form.phone}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, phone: event.target.value }))
              }
              placeholder="01XXXXXXXXX"
            />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            ইমেইল (ঐচ্ছিক)
            <input
              className="h-11 border border-line bg-white px-3 text-ink"
              value={form.email}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, email: event.target.value }))
              }
              placeholder="teacher@domain.com"
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

      <SectionCard title="শিক্ষক তালিকা" subtitle="সম্পাদনা বা মুছুন">
        {status === 'loading' ? (
          <p className="text-sm text-muted">লোড হচ্ছে...</p>
        ) : null}
        {status === 'error' ? (
          <p className="text-sm text-muted">{error}</p>
        ) : null}
        {status === 'ready' && items.length === 0 ? (
          <p className="text-sm text-muted">এখনো কোনো শিক্ষক যোগ হয়নি।</p>
        ) : null}
        {orderedItems.length > 0 ? (
          <div className="table-scroll">
            <table className="w-full min-w-[980px] border-collapse text-sm text-muted">
              <thead>
                <tr className="bg-[var(--surface-alt)] text-xs uppercase text-muted">
                  <th className="border border-line px-3 py-2 text-center">ক্রমিক</th>
                  <th className="border border-line px-3 py-2 text-center">শিক্ষকের নাম</th>
                  <th className="border border-line px-3 py-2 text-center">পদবী</th>
                  <th className="border border-line px-3 py-2 text-center">মোবাইল নং</th>
                  <th className="border border-line px-3 py-2 text-center">ইমেইল</th>
                  <th className="border border-line px-3 py-2 text-center">একশন</th>
                </tr>
              </thead>
              <tbody>
                {orderedItems.map((item, index) => (
                  <tr key={item.id} className="align-top">
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">{index + 1}</td>
                    <td className="border border-line px-3 py-2 text-ink">
                      {editingId === item.id ? (
                        <input
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.name}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p className="font-semibold text-ink">{item.name}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">
                      {editingId === item.id ? (
                        <input
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.designation}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              designation: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p>{item.designation || 'পদবি নেই'}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">
                      {editingId === item.id ? (
                        <input
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.phone}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              phone: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p>{item.phone || 'মোবাইল নেই'}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-center align-middle text-ink">
                      {editingId === item.id ? (
                        <input
                          className="h-10 w-full border border-line bg-white px-3 text-ink"
                          value={editingForm.email}
                          onChange={(event) =>
                            setEditingForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                        />
                      ) : (
                        <p>{item.email || 'ইমেইল নেই'}</p>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2 text-center align-middle">
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Teachers
