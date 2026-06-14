import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { abbreviateClassName } from '../../../utils/classDisplay.js'

const digitMap = {
  0: '০', 1: '১', 2: '২', 3: '৩', 4: '৪',
  5: '৫', 6: '৬', 7: '৭', 8: '৮', 9: '৯',
}

function toBengaliDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => digitMap[digit] || digit)
}

const styles = StyleSheet.create({
  page: {
    padding: 20,
    fontFamily: 'SulaimanLipi',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sheetContainer: {
    width: '32%',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  header: {
    textAlign: 'center',
    paddingTop: 10,
    paddingHorizontal: 10,
  },
  marksheetTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 4,
  },
  competitionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  institution: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  address: {
    fontSize: 8,
    marginBottom: 8,
  },
  groupInfo: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  metaContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 4,
  },
  subjectText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  criteriaText: {
    fontSize: 9,
    borderWidth: 1,
    borderColor: '#000000',
    borderStyle: 'dashed',
    padding: 2,
    borderRadius: 2,
  },
  judgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 10,
    marginBottom: 4,
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
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'left',
  },
  cellText: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 9,
  },
  footerText: {
    fontSize: 9,
    textAlign: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#000000',
    borderStyle: 'dashed',
    marginTop: 'auto',
  }
})

const widths = {
  sl: '10%',
  name: '50%',
  class: '15%',
  marks: '25%',
}

export function MarksheetPdf({
  year,
  institution,
  groupName,
  subjectName,
  criteriaText,
  items
}) {
  const renderSheet = (copyIndex) => (
    <View style={styles.sheetContainer} key={copyIndex}>
      <View style={styles.header}>
        <Text style={styles.marksheetTitle}>মার্কশিট</Text>
        <Text style={styles.competitionTitle}>বার্ষিক ইসলামী সাংস্কৃতিক প্রতিযোগিতা {year || ''}</Text>
        <Text style={styles.institution}>{institution}</Text>
        <Text style={styles.address}>উত্তর ঝাপুয়া, কালারমারছড়া, মহেশখালী, কক্সবাজার</Text>
        <Text style={styles.groupInfo}>গ্রুপ : {groupName}</Text>
      </View>
      
      <View style={styles.metaContainer}>
        <Text style={styles.subjectText}>বিষয়: {subjectName}</Text>
        {criteriaText && <Text style={styles.criteriaText}>{criteriaText}</Text>}
      </View>
      
      <Text style={styles.judgeText}>বিচারক :</Text>
      
      <View style={{ paddingHorizontal: 10, flex: 1, marginBottom: 10 }}>
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cellHeader, { width: widths.sl }]}><Text>ক্র:</Text></View>
            <View style={[styles.cellHeader, { width: widths.name }]}><Text>প্রতিযোগীর নাম</Text></View>
            <View style={[styles.cellHeader, { width: widths.class }]}><Text>শ্রেণি</Text></View>
            <View style={[styles.cellHeader, { width: widths.marks }]}><Text>প্রাপ্ত নম্বর (৩৩)</Text></View>
          </View>
          
          {items.map((item, index) => (
            <View style={styles.row} key={item.id} wrap={false}>
              <View style={[styles.cellText, { width: widths.sl }]}><Text>{toBengaliDigits(index + 1)}</Text></View>
              <View style={[styles.cellText, { width: widths.name }]}><Text>{item.studentName}</Text></View>
              <View style={[styles.cellText, { width: widths.class }]}><Text>{abbreviateClassName(item.className || '')}</Text></View>
              <View style={[styles.cellText, { width: widths.marks }]}><Text> </Text></View>
            </View>
          ))}
        </View>
      </View>
      
      <Text style={styles.footerText}>বিচারকের স্বাক্ষর ও তারিখ</Text>
    </View>
  )

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {renderSheet(1)}
        {renderSheet(2)}
        {renderSheet(3)}
      </Page>
    </Document>
  )
}
