import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { SharedHeader } from './SharedHeader.jsx'
import { rankResults } from '../../../utils/resultScoring.js'
import { abbreviateClassName } from '../../../utils/classDisplay.js'

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'SulaimanLipi',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
  },
  cellHeader: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  cellText: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 10,
  },
  cellCenter: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 10,
    textAlign: 'center',
  },
  merit1: { backgroundColor: '#ecfdf5' },
  merit2: { backgroundColor: '#fffbeb' },
  merit3: { backgroundColor: '#f0f9ff' },
})

const widths = {
  sl: '8%',
  name: '26%',
  class: '12%',
  judge: '9%',
  total: '9%',
  percentage: '9%',
  merit: '9%',
}

export function DetailedPdf({
  year,
  institution,
  groupName,
  subjectName,
  items,
  criteriaLabels = ['বিচার ১', 'বিচার ২', 'বিচার ৩']
}) {
  const ranked = rankResults(items)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SharedHeader
          title="ফলাফল তালিকা"
          year={year}
          institution={institution}
          groupName={groupName}
          subjectName={subjectName}
        />
        
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cellHeader, { width: widths.sl }]}><Text>ক্রমিক</Text></View>
            <View style={[styles.cellHeader, { width: widths.name, textAlign: 'left' }]}><Text>প্রতিযোগীর নাম</Text></View>
            <View style={[styles.cellHeader, { width: widths.class, textAlign: 'left' }]}><Text>শ্রেণি</Text></View>
            {criteriaLabels.map((label, i) => (
              <View key={i} style={[styles.cellHeader, { width: widths.judge }]}><Text>{label}</Text></View>
            ))}
            <View style={[styles.cellHeader, { width: widths.total }]}><Text>মোট</Text></View>
            <View style={[styles.cellHeader, { width: widths.percentage }]}><Text>পার্সেন্টেজ</Text></View>
            <View style={[styles.cellHeader, { width: widths.merit }]}><Text>মেধাক্রম</Text></View>
          </View>

          {ranked.map((item, index) => {
            let rowStyle = {}
            if (item.merit === 1) rowStyle = styles.merit1
            else if (item.merit === 2) rowStyle = styles.merit2
            else if (item.merit === 3) rowStyle = styles.merit3

            return (
              <View key={item.id} style={[styles.row, rowStyle]} wrap={false}>
                <View style={[styles.cellCenter, { width: widths.sl }]}><Text>{index + 1}</Text></View>
                <View style={[styles.cellText, { width: widths.name }]}><Text>{item.studentName}</Text></View>
                <View style={[styles.cellText, { width: widths.class }]}><Text>{abbreviateClassName(item.className || '')}</Text></View>
                <View style={[styles.cellCenter, { width: widths.judge }]}><Text>{item.judge1 ?? '-'}</Text></View>
                <View style={[styles.cellCenter, { width: widths.judge }]}><Text>{item.judge2 ?? '-'}</Text></View>
                <View style={[styles.cellCenter, { width: widths.judge }]}><Text>{item.judge3 ?? '-'}</Text></View>
                <View style={[styles.cellCenter, { width: widths.total }]}><Text>{item.total ?? '-'}</Text></View>
                <View style={[styles.cellCenter, { width: widths.percentage }]}><Text>{Number.isFinite(item.percentage) ? `${item.percentage}%` : '-'}</Text></View>
                <View style={[styles.cellCenter, { width: widths.merit, fontWeight: 'bold' }]}><Text>{item.merit || '-'}</Text></View>
              </View>
            )
          })}
        </View>
      </Page>
    </Document>
  )
}
