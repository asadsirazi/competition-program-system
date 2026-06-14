import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer'
import { SharedHeader } from './SharedHeader.jsx'
import { rankResults } from '../../../utils/resultScoring.js'

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: 'SulaimanLipi',
  },
  columnsContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  columnWrapper: {
    width: '48%',
    display: 'flex',
    flexDirection: 'column',
  },
  subjectCard: {
    width: '100%',
    marginBottom: 16,
  },
  cardHeader: {
    marginBottom: 6,
  },
  groupName: {
    fontSize: 10,
    color: '#4b5563',
    marginBottom: 2,
  },
  subjectName: {
    fontSize: 12,
    fontWeight: 'bold',
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
  studentRow: {
    display: 'flex',
    flexDirection: 'row',
  },
  cellText: {
    padding: 4,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000000',
    borderStyle: 'solid',
    fontSize: 10,
  },
  merit1: { backgroundColor: '#ecfdf5' },
  merit2: { backgroundColor: '#fffbeb' },
  merit3: { backgroundColor: '#f0f9ff' },
})

const isMarksComplete = (item) =>
  [item.judge1, item.judge2, item.judge3].every(
    (value) => value !== '' && value !== null && value !== undefined
  )

export function SummaryPdf({ year, institution, groups, summaryByGroup, subjectMap }) {
  const getSubjectList = (group) => {
    const list = (group?.subjects || []).map(s => ({ id: s.id, name: s.name }))
    if (list.length) return list
    const groupMap = summaryByGroup[group.id] || {}
    return Object.keys(groupMap).map(sid => ({ id: sid, name: subjectMap[sid] || 'বিষয়' }))
  }

  const getTop3 = (list) => {
    const completed = list.filter(isMarksComplete)
    if (!completed.length) return []
    const ranked = rankResults(completed)
    return ranked.filter(item => item.merit <= 3)
  }

  const allSubjectCards = []
  groups.forEach(group => {
    const subjectList = getSubjectList(group)
    if (subjectList.length === 0) {
      allSubjectCards.push({ group, subject: null, top: [] })
    } else {
      subjectList.forEach(subject => {
        const list = summaryByGroup[group.id]?.[subject.id] || []
        const top = getTop3(list)
        if (top.length > 0) {
          allSubjectCards.push({ group, subject, top })
        }
      })
    }
  })

  // Split cards evenly into left and right columns
  const leftCards = []
  const rightCards = []

  allSubjectCards.forEach((card, idx) => {
    if (idx % 2 === 0) {
      leftCards.push(card)
    } else {
      rightCards.push(card)
    }
  })

  const renderCard = (card, keyPrefix) => {
    if (!card.subject) {
      return (
        <View key={keyPrefix} style={styles.subjectCard} wrap={false}>
          <View style={styles.cardHeader}>
            <Text style={styles.groupName}>{card.group.name}</Text>
          </View>
          <Text style={{ fontSize: 10, color: '#6b7280' }}>এই গ্রুপে কোনো বিষয় নেই।</Text>
        </View>
      )
    }

    return (
      <View key={keyPrefix} style={styles.subjectCard} wrap={false}>
        <View style={styles.cardHeader}>
          <Text style={styles.groupName}>{card.group.name}</Text>
          <Text style={styles.subjectName}>{card.subject.name}</Text>
        </View>
        
        <View style={styles.table}>
          {card.top.map((student) => {
            let rowStyle = {}
            if (student.merit === 1) rowStyle = styles.merit1
            else if (student.merit === 2) rowStyle = styles.merit2
            else if (student.merit === 3) rowStyle = styles.merit3
            
            return (
              <View key={student.id} style={[styles.studentRow, rowStyle]}>
                <View style={[styles.cellText, { flex: 1 }]}><Text>{student.studentName || 'নাম নেই'}</Text></View>
                <View style={[styles.cellText, { width: 50, textAlign: 'center' }]}><Text>মেধা: {student.merit}</Text></View>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <SharedHeader
          title="ফলাফল সারাংশ"
          year={year}
          institution={institution}
        />
        
        <View style={styles.columnsContainer}>
          <View style={styles.columnWrapper}>
            {leftCards.map((card, idx) => renderCard(card, `left-${idx}`))}
          </View>
          <View style={styles.columnWrapper}>
            {rightCards.map((card, idx) => renderCard(card, `right-${idx}`))}
          </View>
        </View>
      </Page>
    </Document>
  )
}
