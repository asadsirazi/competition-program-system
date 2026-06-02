import { NavLink, Outlet } from 'react-router-dom'
import AppShell from '../../components/AppShell.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

function AdminLayout() {
  const { isAdmin } = useAuth()

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="border border-line bg-white px-6 py-4">
          <p className="text-xs uppercase text-muted">অ্যাডমিন কনসোল</p>
          <h2 className="mt-2 text-2xl text-ink">প্রশাসনিক ড্যাশবোর্ড</h2>
        </div>
        <nav className="hidden w-full justify-center gap-2 overflow-x-auto border border-line bg-white px-4 py-3 text-xs uppercase text-muted sm:flex">
          {[
            { to: '/admin/dashboard', label: 'ড্যাশবোর্ড' },
            { to: '/admin/academic-years', label: 'একাডেমিক বছর' },
            { to: '/admin/classes', label: 'শ্রেণি' },
            { to: '/admin/subjects', label: 'বিষয়' },
            { to: '/admin/groups', label: 'গ্রুপ' },
            { to: '/admin/teachers', label: 'শিক্ষক' },
            { to: '/admin/registrations', label: 'রেজিস্ট্রেশন' },
            { to: '/admin/assignments', label: 'দায়িত্ব বণ্টন' },
            { to: '/admin/marksheets', label: 'মার্কশিট' },
            { to: '/admin/marks-entry', label: 'মার্কস এন্ট্রি' },
            { to: '/admin/results', label: 'ফলাফল' },
          ].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap border px-3 py-2 transition ${
                  isActive ? 'border-ink text-ink' : 'border-line text-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className={isAdmin ? 'pb-20 sm:pb-0' : 'pb-0'}>
          <Outlet />
        </div>
        {isAdmin ? (
          <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-line bg-white sm:hidden">
            <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-3 py-3 text-[11px] uppercase text-muted">
              {[
                { to: '/admin/dashboard', label: 'ড্যাশবোর্ড' },
                { to: '/admin/academic-years', label: 'একাডেমিক বছর' },
                { to: '/admin/classes', label: 'শ্রেণি' },
                { to: '/admin/subjects', label: 'বিষয়' },
                { to: '/admin/groups', label: 'গ্রুপ' },
                { to: '/admin/teachers', label: 'শিক্ষক' },
                { to: '/admin/registrations', label: 'রেজিস্ট্রেশন' },
                { to: '/admin/assignments', label: 'দায়িত্ব বণ্টন' },
                { to: '/admin/marksheets', label: 'মার্কশিট' },
                { to: '/admin/marks-entry', label: 'মার্কস এন্ট্রি' },
                { to: '/admin/results', label: 'ফলাফল' },
              ].map((item) => (
                <NavLink
                  key={`mobile-${item.to}`}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap border px-3 py-2 transition ${
                      isActive ? 'border-ink text-ink' : 'border-line text-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        ) : null}
      </div>
    </AppShell>
  )
}

export default AdminLayout
