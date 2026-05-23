import { rankResults } from '../utils/resultScoring.js'

function ResultsTable({ items, criteriaLabels = ['বিচার ১', 'বিচার ২', 'বিচার ৩'] }) {
  const ranked = rankResults(items)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="border border-line bg-white">
            <th className="border border-line px-3 py-2 text-left">ক্রমিক</th>
            <th className="border border-line px-3 py-2 text-left">রোল</th>
            <th className="border border-line px-3 py-2 text-left">নাম</th>
            <th className="border border-line px-3 py-2 text-left">শ্রেণি</th>
            {criteriaLabels.map((label) => (
              <th key={label} className="border border-line px-3 py-2">
                {label}
              </th>
            ))}
            <th className="border border-line px-3 py-2">মোট</th>
            <th className="border border-line px-3 py-2">মেধাক্রম</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((item) => (
            <tr key={item.id} className="border border-line">
              <td className="border border-line px-3 py-2">#{item.serialNumber ?? '-'}</td>
              <td className="border border-line px-3 py-2">{item.rollNumber}</td>
              <td className="border border-line px-3 py-2">{item.studentName}</td>
              <td className="border border-line px-3 py-2">{item.className || '-'}</td>
              <td className="border border-line px-3 py-2">{item.judge1 ?? '-'}</td>
              <td className="border border-line px-3 py-2">{item.judge2 ?? '-'}</td>
              <td className="border border-line px-3 py-2">{item.judge3 ?? '-'}</td>
              <td className="border border-line px-3 py-2">{item.total ?? '-'}</td>
              <td className="border border-line px-3 py-2">{item.merit || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ResultsTable
