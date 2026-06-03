import { useEffect, useState } from 'react'
import SectionCard from '../../components/SectionCard.jsx'
import { getActiveYearId } from '../../services/activeYear.js'
import {
  createTeacher,
  deleteTeacher,
  getTeachers,
  updateTeacher,
} from '../../services/teachers.js'

const emptyForm = { name: '', designation: '', phone: '', email: '', photoUrl: '' }

function Teachers() {
  const [activeYearId, setActiveYearId] = useState('')
  const [items, setItems] = useState([])
  const [form, setForm] = useState(emptyForm)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [editingId, setEditingId] = useState('')
  const [editingForm, setEditingForm] = useState(emptyForm)
  const [formOpen, setFormOpen] = useState(false)

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
    setTimeout(() => {
      void loadTeachers()
    }, 0)
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
      photoUrl: item.photoUrl || '',
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

  const exportToExcel = () => {
    const headers = ['ক্রমিক', 'শিক্ষকের নাম', 'পদবী', 'মোবাইল নং', 'ইমেইল', 'ছবির লিংক']
    const rows = orderedItems.map((item, index) => [
      index + 1,
      item.name || '',
      item.designation || '',
      item.phone || '',
      item.email || '',
      item.photoUrl || '',
    ])
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => {
        const str = String(val).replace(/"/g, '""')
        return str.includes(',') || str.includes('\n') || str.includes('"') ? `"${str}"` : str
      }).join(','))
    ].join('\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `শিক্ষক_তালিকা_${activeYearId || 'তথ্যাদি'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="grid gap-6">
      <SectionCard title="শিক্ষক" subtitle="সক্রিয় বছরের শিক্ষক তালিকা">
        <div className="mb-4 text-xs text-muted">
          সক্রিয় বছর: {activeYearId || 'নির্ধারিত নয়'}
        </div>
        <button
          type="button"
          onClick={() => setFormOpen((prev) => !prev)}
          className="mb-4 flex items-center justify-between w-full border border-line bg-[var(--surface-alt)] px-4 py-3 text-sm font-semibold text-ink hover:opacity-80 transition"
        >
          <span>{formOpen ? '✕ ফর্মটি বন্ধ করুন' : '+ নতুন শিক্ষক যুক্ত করুন'}</span>
          <span>{formOpen ? '▲' : '▼'}</span>
        </button>

        {formOpen ? (
          <form className="grid gap-3 animate-fadeIn" onSubmit={handleCreate}>
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
            <label className="grid gap-2 text-sm text-muted">
              ছবির লিংক (ঐচ্ছিক)
              <input
                className="h-11 border border-line bg-white px-3 text-ink"
                value={form.photoUrl}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, photoUrl: event.target.value }))
                }
                placeholder="https://example.com/photo.jpg"
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
        ) : null}
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
          <div className="grid gap-3">
            <div className="flex justify-end">
              <button
                type="button"
                onClick={exportToExcel}
                className="h-10 border border-ink bg-white px-4 text-xs font-semibold text-ink hover:bg-gray-50 transition"
              >
                📥 এক্সেল ডাউনলোড করুন
              </button>
            </div>
            <div className="table-scroll">
              <table className="w-full min-w-[980px] border-collapse text-sm text-muted">
                <thead>
                  <tr className="bg-[var(--surface-alt)] text-xs uppercase text-muted">
                    <th className="border border-line px-3 py-2 text-center">ক্রমিক</th>
                    <th className="border border-line px-3 py-2 text-center">ছবি</th>
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
                      <td className="border border-line px-3 py-2 text-center align-middle">
                        {editingId === item.id ? (
                          <input
                            className="h-10 w-full border border-line bg-white px-3 text-ink text-xs"
                            value={editingForm.photoUrl}
                            onChange={(event) =>
                              setEditingForm((prev) => ({
                                ...prev,
                                photoUrl: event.target.value,
                              }))
                            }
                            placeholder="ছবির লিংক (URL)"
                          />
                        ) : (
                          <div className="flex justify-center">
                            {item.photoUrl ? (
                              <img
                                src={item.photoUrl}
                                alt={item.name}
                                className="h-10 w-10 rounded-full object-cover border border-line"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'block';
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="h-10 w-10 rounded-full aurora-glow border border-line"
                              style={{ display: item.photoUrl ? 'none' : 'block' }}
                            />
                          </div>
                        )}
                      </td>
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
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}

export default Teachers
