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

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name || name === 'N/A') return 'DR';
  const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
};

const parsePrescription = (raw) => {
  if (!raw) return [];
  return raw.split('\n').map(l => l.trim()).filter(Boolean);
};

// ── Sub-components ────────────────────────────────────────────────────────────
const SectionDivider = () => <View style={styles.divider} />;

const InfoSection = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {children}
  </View>
);

const AttachmentCard = ({ attachment, type }) => (
  <TouchableOpacity style={styles.attachmentCard}>
    <View style={styles.attachmentIcon}>
      <Icon name={type === 'lab_report' ? 'file-chart' : 'file-document'} size={32} color="#1E4B46" />
    </View>
    <Text style={styles.attachmentText}>{attachment}</Text>
  </TouchableOpacity>
);

const MedicationRow = ({ line, index }) => {
  const dashIdx = line.indexOf(' — ');
  let name = line, details = null;
  if (dashIdx > -1) {
    name    = line.slice(0, dashIdx);
    details = line.slice(dashIdx + 3);
  }
  return (
    <View style={[styles.medRow, { borderBottomWidth: 1, borderBottomColor: '#EEF8F6' }]}>
      <View style={styles.medBullet}>
        <Text style={styles.medBulletText}>{index + 1}</Text>
      </View>
      <View style={styles.medContent}>
        <Text style={styles.medName}>{name}</Text>
        {details ? <Text style={styles.medDetails}>{details}</Text> : null}
      </View>
    </View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const VisitSummaryScreen = ({ navigation, route }) => {
  const { consultation } = route.params || {};

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });
  if (!fontsLoaded) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  // ── Extract fields ────────────────────────────────────────────────────────
  const doctorName           = consultation?.doctor?.name || consultation?.doctor || 'N/A';
  const doctorSpecialization = consultation?.doctor?.specialization || '';
  const hospital             = consultation?.hospital || 'N/A';
  const department           = consultation?.department || '';
  const date                 = formatDate(consultation?.date);

  // Reason for visit — doctor webapp saves to reason_for_visit; fallback to notes
  const reasonForVisit = consultation?.reason_for_visit || consultation?.notes || 'N/A';

  // Diagnosis — prefer explicit primary_diagnosis field, fallback to parsing combined string
  const rawDiagnosis     = consultation?.diagnosis || '';
  const primaryDiagnosis = consultation?.primary_diagnosis
    || (rawDiagnosis ? rawDiagnosis.split(' | ')[0].split(';')[0].trim() : 'N/A');
  const secondaryDiagnosis = consultation?.secondary_diagnosis
    || (rawDiagnosis.includes(';') ? rawDiagnosis.split(';').slice(1).join(';').trim() : '');

  const icdCode  = consultation?.icd_code  || '';
  const severity = consultation?.severity  || '';

  // Clinical findings saved by doctor webapp
  const clinicalFindings = consultation?.clinical_findings || consultation?.doctor_notes || '';

  // Prescription as structured text lines
  const prescriptionLines = parsePrescription(consultation?.prescription || consultation?.prescriptions || '');

  const nextSteps    = consultation?.next_steps || '';
  const followUpDate = consultation?.follow_up_date ? formatDate(consultation.follow_up_date) : null;

  // Lab reports — skip file paths, keep names only
  const labReports = consultation?.lab_reports
    ? consultation.lab_reports.split(',').filter(item => item.trim() && !item.includes('/uploads/'))
    : [];

  const severityColors = {
    Mild:     { bg: '#E8F5E9', border: '#A5D6A7', text: '#2E7D32' },
    Moderate: { bg: '#FFF8E1', border: '#FFE082', text: '#E65100' },
    Severe:   { bg: '#FBE9E7', border: '#FFAB91', text: '#BF360C' },
    Critical: { bg: '#FFEBEE', border: '#EF9A9A', text: '#C62828' },
  };
  const sevStyle = severityColors[severity] || severityColors.Mild;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visit Summary</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>

          {/* ── Doctor header ── */}
          <View style={styles.doctorHeader}>
            <View style={styles.doctorAvatar}>
              <Text style={styles.doctorInitial}>{getInitials(doctorName)}</Text>
            </View>
            <View style={styles.doctorInfo}>
              <Text style={styles.doctorName}>{doctorName}</Text>
              {doctorSpecialization ? <Text style={styles.specializationText}>{doctorSpecialization}</Text> : null}
              <Text style={styles.clinicName}>{hospital}</Text>
              {department ? <Text style={styles.departmentText}>{department}</Text> : null}
              <Text style={styles.dateText}>{date}</Text>
            </View>
          </View>

          {/* ── Reason for Visit ── */}
          <InfoSection title="Reason for Visit">
            <Text style={styles.sectionText}>{reasonForVisit}</Text>
          </InfoSection>

          <SectionDivider />

          {/* ── Diagnosis ── */}
          <InfoSection title="Diagnosis">
            <Text style={styles.sectionText}>{primaryDiagnosis}</Text>
            {secondaryDiagnosis ? (
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>Secondary: </Text>
                <Text style={styles.subValue}>{secondaryDiagnosis}</Text>
              </View>
            ) : null}
            {icdCode ? (
              <View style={styles.subRow}>
                <Text style={styles.subLabel}>ICD Code: </Text>
                <Text style={[styles.subValue, { color: '#888' }]}>{icdCode}</Text>
              </View>
            ) : null}
          </InfoSection>

          {/* ── Severity ── */}
          {severity ? (
            <>
              <SectionDivider />
              <InfoSection title="Severity">
                <View style={[styles.severityBadge, { backgroundColor: sevStyle.bg, borderColor: sevStyle.border }]}>
                  <Text style={[styles.severityText, { color: sevStyle.text }]}>{severity}</Text>
                </View>
              </InfoSection>
            </>
          ) : null}

          {/* ── Clinical Findings / Doctor's Notes ── */}
          {clinicalFindings ? (
            <>
              <SectionDivider />
              <InfoSection title="Doctor's Notes">
                <Text style={styles.sectionText}>{clinicalFindings}</Text>
              </InfoSection>
            </>
          ) : null}

          {/* ── Prescription — structured medication list ── */}
          {prescriptionLines.length > 0 ? (
            <>
              <SectionDivider />
              <InfoSection title="Prescription">
                <View style={styles.prescriptionContainer}>
                  {prescriptionLines.map((line, index) => (
                    <MedicationRow key={index} line={line} index={index} />
                  ))}
                </View>
              </InfoSection>
            </>
          ) : null}

          {/* ── Next Steps ── */}
          {nextSteps ? (
            <>
              <SectionDivider />
              <InfoSection title="Next Steps">
                <Text style={styles.sectionText}>{nextSteps}</Text>
              </InfoSection>
            </>
          ) : null}

          {/* ── Follow-up Date ── */}
          {followUpDate ? (
            <>
              <SectionDivider />
              <InfoSection title="Follow-up Date">
                <View style={styles.followUpRow}>
                  <Icon name="calendar-clock" size={16} color="#1E4B46" />
                  <Text style={[styles.sectionText, { marginLeft: 8 }]}>{followUpDate}</Text>
                </View>
              </InfoSection>
            </>
          ) : null}

          {/* ── Lab Reports — as attachment cards ── */}
          {labReports.length > 0 ? (
            <>
              <SectionDivider />
              <InfoSection title="Lab Reports">
                <View style={styles.attachmentsContainer}>
                  {labReports.map((report, index) => (
                    <AttachmentCard key={index} attachment={report.trim()} type="lab_report" />
                  ))}
                </View>
              </InfoSection>
            </>
          ) : null}

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f5f5f5' },
  header:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backButton:    { padding: 5 },
  headerTitle:   { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#1e4b46', fontWeight: '700' },
  scrollView:    { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },

  summaryCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },

  // Doctor header
  doctorHeader:      { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E8F5F3' },
  doctorAvatar:      { width: 60, height: 60, borderRadius: 30, backgroundColor: '#1E4B46', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  doctorInitial:     { color: '#FFFFFF', fontSize: 20, fontFamily: 'Poppins_700Bold', fontWeight: '700' },
  doctorInfo:        { flex: 1 },
  doctorName:        { fontSize: 16, fontFamily: 'Poppins_700Bold', color: '#1e4b46', marginBottom: 2, fontWeight: '700' },
  specializationText:{ fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#666', marginBottom: 2 },
  clinicName:        { fontSize: 13, fontFamily: 'Poppins_400Regular', color: '#1e4b46', marginBottom: 2 },
  departmentText:    { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#666', marginBottom: 2 },
  dateText:          { fontSize: 12, fontFamily: 'Poppins_400Regular', color: '#999' },

  // Sections
  section:      { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontFamily: 'Poppins_600SemiBold', color: '#999', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionText:  { fontSize: 14, color: '#1e4b46', lineHeight: 22, fontFamily: 'Poppins_400Regular' },
  divider:      { height: 1, backgroundColor: '#F0F0F0', marginBottom: 20 },

  // Diagnosis sub-fields
  subRow:   { flexDirection: 'row', marginTop: 6, flexWrap: 'wrap' },
  subLabel: { fontSize: 13, color: '#999', fontFamily: 'Poppins_600SemiBold', fontWeight: '600' },
  subValue: { fontSize: 13, color: '#555', fontFamily: 'Poppins_400Regular', flex: 1 },

  // Severity
  severityBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1 },
  severityText:  { fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },

  // Prescription
  prescriptionContainer: { backgroundColor: '#F8FFFE', borderRadius: 12, borderWidth: 1, borderColor: '#E8F5F3', overflow: 'hidden' },
  medRow:       { flexDirection: 'row', alignItems: 'flex-start', padding: 14 },
  medBullet:    { width: 24, height: 24, borderRadius: 12, backgroundColor: '#1E4B46', justifyContent: 'center', alignItems: 'center', marginRight: 12, marginTop: 1, flexShrink: 0 },
  medBulletText:{ color: '#fff', fontSize: 11, fontWeight: '700', fontFamily: 'Poppins_700Bold' },
  medContent:   { flex: 1 },
  medName:      { fontSize: 14, fontWeight: '600', color: '#1e4b46', fontFamily: 'Poppins_600SemiBold', marginBottom: 2 },
  medDetails:   { fontSize: 12, color: '#666', fontFamily: 'Poppins_400Regular', lineHeight: 18 },

  // Follow-up
  followUpRow: { flexDirection: 'row', alignItems: 'center' },

  // Lab attachments
  attachmentsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  attachmentCard:  { flex: 1, minWidth: '45%', backgroundColor: '#E8F5F3', borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center', minHeight: 100 },
  attachmentIcon:  { marginBottom: 8 },
  attachmentText:  { fontSize: 12, fontWeight: '600', color: '#1e4b46', textAlign: 'center', fontFamily: 'Poppins_600SemiBold' },
});

export default VisitSummaryScreen;