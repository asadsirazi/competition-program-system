import AppShell from '../components/AppShell.jsx'
import SectionCard from '../components/SectionCard.jsx'

function PublicHome() {
  return (
    <AppShell>
      <div className="grid gap-6">
        <section className="border border-line bg-white p-8">
          <p className="font-impact text-xs uppercase tracking-[0.3em] text-muted">
            তথ্য কেন্দ্র
          </p>
          <h2 className="mt-2 font-bangla text-3xl text-ink">
            সাংস্কৃতিক প্রতিযোগিতা তথ্য কেন্দ্র
          </h2>
          <p className="mt-4 max-w-2xl text-sm text-muted">
            শিক্ষক ও দায়িত্বপ্রাপ্ত সদস্যদের জন্য বিভাগভিত্তিক দায়িত্ব, সিলেবাস এবং
            নিবন্ধিত শিক্ষার্থীদের তালিকা এখানে প্রকাশিত থাকবে।
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <SectionCard
            title="দায়িত্ব বণ্টন"
            subtitle="লিড ও সহকারী শিক্ষকের দায়িত্ব"
          >
            <div className="space-y-3 text-sm text-muted">
              <div className="flex items-center justify-between border border-line px-4 py-3">
                <span>গ্রুপ এ • আলিম</span>
                <span>লিড: অপেক্ষমাণ</span>
              </div>
              <div className="flex items-center justify-between border border-line px-4 py-3">
                <span>গ্রুপ বি • ফাযিল</span>
                <span>লিড: অপেক্ষমাণ</span>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="সিলেবাস" subtitle="বিষয়ভিত্তিক টপিকস">
            <div className="space-y-3 text-sm text-muted">
              <div className="border border-line px-4 py-3">
                কোরআন তিলাওয়াত • প্রস্তুত টপিকস এখানে থাকবে।
              </div>
              <div className="border border-line px-4 py-3">
                হামদ ও নাত • প্রস্তুত টপিকস এখানে থাকবে।
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          title="নিবন্ধিত শিক্ষার্থী"
          subtitle="গ্রুপ, শ্রেণি ও বিষয় অনুযায়ী তালিকা"
        >
          <div className="grid gap-4 text-sm text-muted lg:grid-cols-3">
            {['গ্রুপ এ', 'গ্রুপ বি', 'গ্রুপ সি'].map((group) => (
              <div key={group} className="border border-line px-4 py-3">
                <p className="font-semibold text-ink">{group}</p>
                <p className="mt-2">এখনো নিবন্ধন হয়নি।</p>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  )
}

export default PublicHome
