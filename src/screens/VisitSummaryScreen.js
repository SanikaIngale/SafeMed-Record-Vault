import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const AttachmentCard = ({ attachment, type }) => {
  const getIconName = () => {
    if (type === 'prescription') return 'file-document';
    if (type === 'lab_report') return 'file-chart';
    return 'file-document';
  };

  return (
    <TouchableOpacity style={styles.attachmentCard}>
      <View style={styles.attachmentIcon}>
        <Icon name={getIconName()} size={32} color="#1E4B46" />
      </View>
      <Text style={styles.attachmentText}>{attachment}</Text>
    </TouchableOpacity>
  );
};

const VisitSummaryScreen = ({ navigation, route }) => {
  const { consultation } = route.params || {};

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { day: '2-digit', month: 'long', year: '2-digit' };
    return date.toLocaleDateString('en-GB', options).replace(/ /g, ' ');
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

  // Extract data from consultation object
  const doctorName = consultation?.doctor?.name || 'N/A';
  const doctorSpecialization = consultation?.doctor?.specialization || '';
  const hospital = consultation?.hospital || 'N/A';
  const department = consultation?.department || '';
  const date = formatDate(consultation?.date);
  const reasonForVisit = consultation?.reason_for_visit || 'N/A';
  const diagnosis = consultation?.diagnosis || 'N/A';
  const doctorNotes = consultation?.doctor_notes || 'No additional notes';
  const nextSteps = consultation?.next_steps || '';
  const followUpDate = consultation?.follow_up_date ? formatDate(consultation.follow_up_date) : null;

  // Parse lab reports (format: "Test Name, File Path")
  const labReports = consultation?.lab_reports 
    ? consultation.lab_reports.split(',').filter(item => item.trim() && !item.includes('/uploads/'))
    : [];

  const hasAttachments = consultation?.prescriptions || labReports.length > 0;

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
                {doctorName.charAt(4) || 'D'}
              </Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              {doctorSpecialization && (
                <Text style={styles.specializationText}>{doctorSpecialization}</Text>
              )}
              <Text style={styles.clinicName}>{hospital}</Text>
              {department && (
                <Text style={styles.departmentText}>{department}</Text>
              )}
              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason for Visit</Text>
            <Text style={styles.sectionText}>{reasonForVisit}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diagnosis</Text>
            <Text style={styles.sectionText}>{diagnosis}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Doctor's Notes</Text>
            <Text style={styles.sectionText}>{doctorNotes}</Text>
          </View>

          {nextSteps && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Next Steps</Text>
                <Text style={styles.sectionText}>{nextSteps}</Text>
              </View>
            </>
          )}

          {followUpDate && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Follow-up Date</Text>
                <Text style={styles.sectionText}>{followUpDate}</Text>
              </View>
            </>
          )}

          {hasAttachments && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Attachments</Text>
                <View style={styles.attachmentsContainer}>
                  {consultation?.prescriptions && (
                    <AttachmentCard 
                      attachment="Prescription" 
                      type="prescription"
                    />
                  )}
                  {labReports.map((report, index) => (
                    <AttachmentCard 
                      key={index}
                      attachment={report.trim()} 
                      type="lab_report"
                    />
                  ))}
                </View>
              </View>
            </>
          )}
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
    paddingTop: 45,
    paddingBottom: 15,
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
    marginBottom: 2,
    fontWeight: '700',
  },
  specializationText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginBottom: 2,
  },
  clinicName: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#1e4b46',
    marginBottom: 2,
  },
  departmentText: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
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
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 10,
  },
  attachmentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#e8f5f3',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
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