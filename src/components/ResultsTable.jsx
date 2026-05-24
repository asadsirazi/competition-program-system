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
            <th className="border border-line px-3 py-2 text-center">মেধাক্রম</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((item) => (
            <tr key={item.id} className="border border-line">
              <td className="border border-line px-3 py-2 text-center">{item.serialNumber ?? '-'}</td>
              <td className="border border-line px-3 py-2">{item.studentName}</td>
              <td className="border border-line px-3 py-2">{abbreviateClassName(item.className || '')}</td>
              <td className="border border-line px-3 py-2 text-center">{item.judge1 ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.judge2 ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.judge3 ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.total ?? '-'}</td>
              <td className="border border-line px-3 py-2 text-center">{item.merit || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResultsTable
