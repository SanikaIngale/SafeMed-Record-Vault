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
import { 
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

// Mock visit details
const visitDetails = {
  doctor: 'Dr. Anya Sharma',
  clinic: 'General Hospital',
  reasonForVisit: 'Ongoing tiredness and periodic throbbing headaches.',
  diagnosis: 'Indicative of migraine episodes aggravated by exhaustion.',
  additionalNotes:
    'Maintain a regular sleep schedule\nIf symptoms persist or worsen, follow-up required',
  attachments: [
    { id: '1', type: 'Prescription', icon: '💊' },
    { id: '2', type: 'Blood Test\nReport', icon: '📄' },
  ],
};

const AttachmentCard = ({ attachment }) => (
  <View style={styles.attachmentCard}>
    <View style={styles.attachmentIcon}>
      <Text style={styles.attachmentEmoji}>{attachment.icon}</Text>
    </View>
    <Text style={styles.attachmentText}>{attachment.type}</Text>
  </View>
);

const VisitSummaryScreen = ({ navigation, route }) => {
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
      <StatusBar barStyle="dark-content" backgroundColor="#9bd7cd" />
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Summary</Text>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.summaryCard}>
          <View style={styles.doctorHeader}>
            <View style={styles.doctorImage}>
              <Text style={styles.doctorInitial}>A</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{visitDetails.doctor}</Text>
              <Text style={styles.clinicName}>{visitDetails.clinic}</Text>
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
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#9bd7cd',
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  backButtonText: {
    fontSize: 32,
    color: '#1e4b46',
    fontFamily: 'Poppins_400Regular',
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#1e4b46',
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
    backgroundColor: '#E91E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  doctorInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
  },
  doctorInfo: {
    flex: 1,
  },
  doctorName: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: '#1e4b46',
    marginBottom: 4,
  },
  clinicName: {
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#1e4b46',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#1e4b46',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    color: '#1e4b46',
    lineHeight: 20,
    fontFamily: 'Poppins_400Regular',
  },
  divider: {
    height: 1,
    backgroundColor: '#D0DCE3',
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
    backgroundColor: '#B8E0D8',
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
  attachmentEmoji: {
    fontSize: 40,
  },
  attachmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e4b46',
    textAlign: 'center',
  },
});

export default VisitSummaryScreen;