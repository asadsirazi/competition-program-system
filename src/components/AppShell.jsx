import { NavLink } from 'react-router-dom'

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-paper text-ink pb-12 sm:pb-0">
      <header className="print-hidden border-b border-line bg-paper">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col items-center justify-center">
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
          </div>
        </div>
        <div className="border-t border-line bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-3 sm:px-6">
            <nav className="flex w-full flex-wrap items-center justify-center gap-2 text-xs font-semibold text-muted">
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
    </div>
  )
}

export default AppShell
