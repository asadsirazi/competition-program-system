import { Text, View, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  headerContainer: {
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontFamily: 'SulaimanLipi',
    fontSize: 16,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: 'SulaimanLipi',
    fontSize: 10,
    marginBottom: 2,
  },
  institution: {
    fontFamily: 'SulaimanLipi',
    fontSize: 14,
    marginBottom: 2,
  },
  address: {
    fontFamily: 'SulaimanLipi',
    fontSize: 10,
    marginBottom: 4,
  },
  metadata: {
    fontFamily: 'SulaimanLipi',
    fontSize: 11,
    marginTop: 2,
  }
})

export function SharedHeader({ title, year, institution, groupName, subjectName }) {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>বার্ষিক ইসলামী সাংস্কৃতিক প্রতিযোগিতা {year || ''}</Text>
      <Text style={styles.institution}>{institution}</Text>
      <Text style={styles.address}>উত্তর ঝাপুয়া, কালারমারছড়া, মহেশখালী, কক্সবাজার</Text>
      {groupName && <Text style={styles.metadata}>গ্রুপ : {groupName}</Text>}
      {subjectName && <Text style={styles.metadata}>বিষয় : {subjectName}</Text>}
    </View>
  )
}
