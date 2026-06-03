import { rankResults } from '../utils/resultScoring.js'
import { abbreviateClassName } from '../utils/classDisplay.js'

function ResultsTable({ items, criteriaLabels = ['বিচার ১', 'বিচার ২', 'বিচার ৩'] }) {
  const ranked = rankResults(items)

  return (
    <div className="table-scroll">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border border-line bg-white">
            <th className="border border-line px-3 py-2 text-center">ক্রমিক</th>
            <th className="border border-line px-3 py-2 text-left">প্রতিযোগীর নাম</th>
            <th className="border border-line px-3 py-2 text-left">শ্রেণি</th>
            {criteriaLabels.map((label) => (
              <th key={label} className="border border-line px-3 py-2 text-center">
                {label}
              </th>
            ))}
            <th className="border border-line px-3 py-2 text-center">মোট</th>
            <th className="border border-line px-3 py-2 text-center">পার্সেন্টেজ</th>
            <th className="border border-line px-3 py-2 text-center">মেধাক্রম</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((item, index) => {
            const meritTone = item.merit === 1
              ? 'bg-emerald-50'
              : item.merit === 2
                ? 'bg-amber-50'
                : item.merit === 3
                  ? 'bg-sky-50'
                  : ''
            return (
            <tr key={item.id} className={`border border-line ${meritTone}`}>
              <td className="border border-line px-3 py-2 text-center">{index + 1}</td>
              <td className="border border-line px-3 py-2">{item.studentName}</td>
              <td className="border border-line px-3 py-2">{abbreviateClassName(item.className || '')}</td>
              <td className="border border-line px-3 py-2 text-center">{item.judge1 ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.judge2 ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.judge3 ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.total ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">
                {Number.isFinite(item.percentage) ? `${item.percentage}%` : '-'}
              </td>
              <td className="border border-line px-3 py-2 text-center font-semibold">{item.merit || '-'}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default ResultsTable
