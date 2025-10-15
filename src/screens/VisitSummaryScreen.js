import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

const AttachmentCard = ({ attachment }) => (
  <View style={styles.attachmentCard}>
    <View style={styles.attachmentIcon}>
      <Icon name={attachment.icon} size={32} color="#1E4B46" />
    </View>
    <Text style={styles.attachmentText}>{attachment.type}</Text>
  </View>
);

const VisitSummaryScreen = ({ navigation, route }) => {
  const { consultation } = route.params || {};

  const visitDetails = {
    doctor: consultation?.doctor || 'Dr. Anya Sharma',
    clinic: consultation?.clinic || 'General Hospital',
    date: consultation?.date || '05 July 25',
    reasonForVisit: consultation?.reason || 'Ongoing tiredness and periodic throbbing headaches',
    diagnosis: 'Indicative of migraine episodes aggravated by exhaustion',
    additionalNotes: 'Maintain a regular sleep schedule\nIf symptoms persist or worsen, follow-up required',
    attachments: [
      { id: '1', type: 'Prescription', icon: 'file-document' },
      { id: '2', type: 'Blood Test\nReport', icon: 'file-chart' },
    ],
  };

  const handleBack = () => {
    navigation.goBack();
  };

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Summary</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorImage}>
              <Text style={styles.doctorInitial}>
                {visitDetails.doctor.charAt(4)}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{visitDetails.doctor}</Text>
              <Text style={styles.clinicName}>{visitDetails.clinic}</Text>
              <Text style={styles.dateText}>{visitDetails.date}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Visit</Text>
            <Text style={styles.sectionText}>{visitDetails.reasonForVisit}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <Text style={styles.sectionText}>{visitDetails.diagnosis}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Additional Notes</Text>
            <Text style={styles.sectionText}>{visitDetails.additionalNotes}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            <View style={styles.attachmentsContainer}>
              {visitDetails.attachments.map((attachment) => (
                <AttachmentCard key={attachment.id} attachment={attachment} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1e4b46',
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  doctorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E4B46',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  doctorInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#1e4b46',
    marginBottom: 4,
    fontWeight: '700',
  },
  clinicName: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#1e4b46',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1e4b46',
    marginBottom: 8,
    fontWeight: '600',
  },
  sectionText: {
    fontSize: 14,
    color: '#1e4b46',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginBottom: 20,
  },
  attachmentsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'Poppins_600SemiBold',
    marginTop: 10,
  },
  attachmentCard: {
    flex: 1,
    backgroundColor: '#e8f5f3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginHorizontal: 5,
  },
  attachmentIcon: {
    marginBottom: 10,
  },
  attachmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e4b46',
    textAlign: 'center',
  },
});

export default VisitSummaryScreen;