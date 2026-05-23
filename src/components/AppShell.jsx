import { useState } from 'react'
import { NavLink } from 'react-router-dom'

function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="print-hidden border-b border-line bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <div className="grid grid-cols-[1fr_auto] items-start gap-3">
            <div className="text-center">
              <p className="text-sm leading-[1.25] text-muted sm:text-base">
                বার্ষিক ইসলামী সাংস্কৃতিক প্রতিযোগিতা ব্যবস্থাপনা সিস্টেম
              </p>
              <p className="mt-1 text-sm leading-[1.25] text-muted sm:text-base">
                তত্ত্বাবধানে : ইসলামিক সাংস্কৃতিক ফোরাম
              </p>
              <h1 className="mt-2 text-2xl leading-[1.35] text-ink sm:text-3xl">
                আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা
              </h1>
              <p className="mt-2 text-sm leading-[1.25] text-muted sm:text-base">
                উত্তর ঝাপুয়া, কালারমারছড়া, মহেশখালী, কক্সবাজার।
              </p>
              <p className="mt-1 text-sm leading-[1.25] text-muted sm:text-base">
                স্থাপিত : ২০০৫ ইং | EIIN : 138140
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="flex h-11 w-11 items-center justify-center border border-line text-ink sm:hidden"
              aria-label="মেনু"
              aria-expanded={menuOpen}
            >
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>
        <div className="border-t border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
            <nav className="hidden w-full flex-wrap items-center justify-center gap-2 text-xs font-semibold text-muted sm:flex">
              {[
                { to: '/', label: 'তথ্য কেন্দ্র' },
                { to: '/results', label: 'ফলাফল' },
                { to: '/admin', label: 'অ্যাডমিন' },
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `whitespace-nowrap border border-line px-3 py-2 transition ${
                      isActive
                        ? 'border-ink text-ink'
                        : 'border-line text-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-line bg-white sm:hidden">
            <div className="mx-auto grid w-full max-w-6xl gap-2 px-4 py-3 text-xs text-muted">
              {[
                { to: '/', label: 'তথ্য কেন্দ্র' },
                { to: '/results', label: 'ফলাফল' },
                { to: '/admin', label: 'অ্যাডমিন' },
              ].map((item) => (
                <NavLink
                  key={`mobile-main-${item.to}`}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `border border-line px-3 py-2 transition ${
                      isActive ? 'border-ink text-ink' : 'text-muted'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
      <footer className="print-hidden border-t border-line bg-paper">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-center px-4 py-4 text-xs text-muted sm:px-6">
          <span>
            আল-ঈমান আদর্শ মহিলা আলিম মাদ্রাসা • সাংস্কৃতিক প্রতিযোগিতা ব্যবস্থাপনা
          </span>
        </div>
      </footer>
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-line bg-white sm:hidden">
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-3 py-3 text-[11px] uppercase text-muted">
          {[
            { to: '/', label: 'তথ্য কেন্দ্র' },
            { to: '/results', label: 'ফলাফল' },
            { to: '/admin', label: 'অ্যাডমিন' },
          ].map((item) => (
            <NavLink
              key={`bottom-main-${item.to}`}
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
    </div>
  )
}

export default AppShell
