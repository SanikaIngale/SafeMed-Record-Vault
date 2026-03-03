import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { API_URL } from '../config/api';

const API_BASE_URL = API_URL;

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${day} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const getPrimaryDiagnosis = (consultation) => {
  if (consultation.primary_diagnosis) return consultation.primary_diagnosis;
  const raw = consultation.diagnosis || '';
  if (!raw) return null;
  return raw.split(' | ')[0].split(';')[0].trim() || null;
};

// ── Consultation Card ─────────────────────────────────────────────────────────
const ConsultationCard = ({ consultation, onPress }) => {
  const primaryDiagnosis = getPrimaryDiagnosis(consultation);
  const doctorName       = consultation.doctor?.name || consultation.doctor || 'N/A';
  const reasonForVisit   = consultation.reason_for_visit || consultation.notes || 'N/A';
  const hospital         = consultation.hospital || null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Date strip */}
      <View style={styles.cardDateStrip}>
        <Icon name="calendar" size={13} color="#1E4B46" />
        <Text style={styles.cardDate}>{formatDate(consultation.date || consultation.created_at)}</Text>
        {hospital ? <Text style={styles.cardHospital}> · {hospital}</Text> : null}
      </View>

      <View style={styles.cardBody}>
        {/* Doctor */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldIcon}>
            <Icon name="doctor" size={14} color="#1E4B46" />
          </View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Doctor</Text>
            <Text style={styles.fieldValue}>{doctorName}</Text>
          </View>
        </View>

        {/* Reason for Visit */}
        <View style={styles.fieldRow}>
          <View style={styles.fieldIcon}>
            <Icon name="clipboard-text-outline" size={14} color="#1E4B46" />
          </View>
          <View style={styles.fieldContent}>
            <Text style={styles.fieldLabel}>Reason for Visit</Text>
            <Text style={styles.fieldValue} numberOfLines={2}>{reasonForVisit}</Text>
          </View>
        </View>

        {/* Primary Diagnosis */}
        {primaryDiagnosis ? (
          <View style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <Icon name="stethoscope" size={14} color="#1E4B46" />
            </View>
            <View style={styles.fieldContent}>
              <Text style={styles.fieldLabel}>Primary Diagnosis</Text>
              <Text style={styles.fieldValue} numberOfLines={2}>{primaryDiagnosis}</Text>
            </View>
          </View>
        ) : null}
      </View>

      {/* View Details */}
      <TouchableOpacity style={styles.detailsButton} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.detailsButtonText}>View Details</Text>
        <Icon name="arrow-right" size={14} color="#fff" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const ConsultationHistoryScreen = ({ navigation }) => {
  const [activeNav,     setActiveNav]     = useState('Home');
  const [consultations, setConsultations] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);

  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold });

  useEffect(() => { loadConsultations(); }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      let patientId = await AsyncStorage.getItem('patient_id');

      if (!patientId) {
        const email = await AsyncStorage.getItem('userEmail');
        if (!email) { Alert.alert('Error', 'Please login again'); navigation.replace('SignIn'); return; }
        const userResponse = await fetch(`${API_BASE_URL}/api/user/email/${email}`);
        const userData = await userResponse.json();
        if (!userData.success || !userData.patient_id) throw new Error('Failed to fetch user data');
        patientId = userData.patient_id;
        await AsyncStorage.setItem('patient_id', patientId);
      }

      const patientResponse = await fetch(`${API_BASE_URL}/api/patients/${patientId}`);
      const patientData = await patientResponse.json();

      if (patientData.success) {
        let raw = patientData.consultations || [];
        if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
        if (!Array.isArray(raw)) raw = [];
        setConsultations(
          raw.sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at))
        );
      } else {
        throw new Error(patientData.message || 'Failed to load consultations');
      }
    } catch (error) {
      console.error('❌ Error loading consultations:', error);
      Alert.alert('Error', 'Failed to load consultation history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadConsultations(); };

  if (!fontsLoaded) return null;

  const headerEl = (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Icon name="arrow-left" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Consultation History</Text>
      <View style={{ width: 34 }} />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        {headerEl}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      {headerEl}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E4B46']} />}
      >
        {consultations.length > 0 ? (
          <Text style={styles.countLabel}>
            {consultations.length} consultation{consultations.length !== 1 ? 's' : ''} found
          </Text>
        ) : null}

        {consultations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No consultation records yet</Text>
            <Text style={styles.emptySubtext}>Your consultation history will appear here</Text>
          </View>
        ) : (
          consultations.map((consultation, index) => (
            <ConsultationCard
              key={consultation.consultation_id || index}
              consultation={consultation}
              onPress={() => navigation.navigate('VisitSummary', { consultation })}
            />
          ))
        )}
      </ScrollView>

      <BottomNavigation activeNav={activeNav} onNavigate={setActiveNav} navigation={navigation} />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 55, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  backBtn:          { padding: 5 },
  headerTitle:      { fontSize: 18, fontFamily: 'Poppins_700Bold', fontWeight: '600', color: '#1e4b46' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText:      { marginTop: 12, fontSize: 14, color: '#1E4B46', fontFamily: 'Poppins_400Regular' },
  emptyContainer:   { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: 40 },
  emptyText:        { fontSize: 17, fontWeight: '600', color: '#666', marginTop: 16, textAlign: 'center', fontFamily: 'Poppins_600SemiBold' },
  emptySubtext:     { fontSize: 13, color: '#999', marginTop: 6, textAlign: 'center', fontFamily: 'Poppins_400Regular' },
  scrollView:       { flex: 1 },
  scrollContent:    { padding: 16, paddingBottom: 24 },
  countLabel:       { fontSize: 12, color: '#999', fontFamily: 'Poppins_400Regular', marginBottom: 12, paddingHorizontal: 4 },

  // Card
  card:          { backgroundColor: '#FFFFFF', borderRadius: 14, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, overflow: 'hidden' },
  cardDateStrip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F8F6', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E8F5F3', gap: 6 },
  cardDate:      { fontSize: 13, fontWeight: '600', color: '#1E4B46', fontFamily: 'Poppins_600SemiBold' },
  cardHospital:  { fontSize: 12, color: '#6B9E96', fontFamily: 'Poppins_400Regular', flex: 1 },
  cardBody:      { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },

  // Field rows
  fieldRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  fieldIcon:    { width: 28, height: 28, borderRadius: 8, backgroundColor: '#E8F5F3', justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1 },
  fieldContent: { flex: 1 },
  fieldLabel:   { fontSize: 11, color: '#999', fontFamily: 'Poppins_600SemiBold', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  fieldValue:   { fontSize: 14, color: '#1e4b46', fontFamily: 'Poppins_400Regular', lineHeight: 20 },

  // Button
  detailsButton:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E4B46', marginHorizontal: 16, marginBottom: 16, marginTop: 8, paddingVertical: 10, borderRadius: 10, gap: 6 },
  detailsButtonText: { color: '#fff', fontSize: 13, fontWeight: '600', fontFamily: 'Poppins_600SemiBold' },
});

export default ConsultationHistoryScreen;