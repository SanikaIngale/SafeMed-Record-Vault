import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { API_URL } from '../config/api';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;

// ── Mini Bar Chart ────────────────────────────────────────────────────────────
const MiniBarChart = ({ data, color = '#1E4B46' }) => {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <View style={chartStyles.barsRow}>
      {data.map((item, i) => {
        const barH = Math.max(4, (item.value / max) * 80);
        return (
          <View key={i} style={chartStyles.barCol}>
            <Text style={chartStyles.barValue}>{item.value}</Text>
            <View style={[chartStyles.bar, { height: barH, backgroundColor: color }]} />
            <Text style={chartStyles.barX}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  );
};

// ── Stat Ring ─────────────────────────────────────────────────────────────────
const StatRing = ({ value, color, title, subtitle }) => (
  <View style={donutStyles.wrap}>
    <View style={[donutStyles.ring, { borderColor: color }]}>
      <Text style={[donutStyles.val, { color }]}>{value}</Text>
      <Text style={donutStyles.sub}>{subtitle}</Text>
    </View>
    <Text style={donutStyles.title}>{title}</Text>
  </View>
);

// ── Spark Line ────────────────────────────────────────────────────────────────
const SparkLine = ({ data, color = '#1E4B46', height = 60 }) => {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = CHART_WIDTH / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: height - ((v - min) / range) * (height - 10) - 5,
  }));

  return (
    <View style={{ height, width: CHART_WIDTH, position: 'relative' }}>
      {points.slice(0, -1).map((pt, i) => {
        const next = points[i + 1];
        const dx = next.x - pt.x;
        const dy = next.y - pt.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: pt.x,
              top: pt.y,
              width: len,
              height: 2.5,
              backgroundColor: color,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: '0 50%',
            }}
          />
        );
      })}
      {points.map((pt, i) => (
        <View
          key={`dot-${i}`}
          style={{
            position: 'absolute',
            left: pt.x - 4,
            top: pt.y - 4,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#fff',
            borderWidth: 2,
            borderColor: color,
          }}
        />
      ))}
    </View>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const calculateAge = (dob) => {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const getInitials = (name) => {
  if (!name) return 'NA';
  const parts = name.split(' ');
  return parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    : parts[0][0].toUpperCase();
};

const formatDate = (ds) => {
  if (!ds) return 'N/A';
  const d = new Date(ds);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${d.getDate().toString().padStart(2,'0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

const extractTime = (ds) => {
  if (!ds) return 'N/A';
  const d = new Date(ds);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

const buildChartData = (consultations) => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const now = new Date();
  const counts = Array(6).fill(0);
  const labels = Array(6).fill('').map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return months[d.getMonth()];
  });
  consultations.forEach((c) => {
    const d = new Date(c.date || c.created_at);
    for (let i = 0; i < 6; i++) {
      const ref = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      if (d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()) {
        counts[i]++;
      }
    }
  });
  return labels.map((label, i) => ({ label, value: counts[i] }));
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomePage({ navigation }) {
  const [activeNav, setActiveNav] = useState('Home');
  const [userData, setUserData] = useState({
    name: 'Loading...', age: '-', gender: '-', patient_id: '-', initials: 'NA',
  });
  const [consultationTimeline, setConsultationTimeline] = useState([]);
  const [allConsultations, setAllConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);

  const fetchUserData = useCallback(async () => {
    try {
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      setIsNewUser(newUserFlag === 'true');

      const apiUrl = API_URL;
      let userEmail = await AsyncStorage.getItem('userEmail');
      let patientId = await AsyncStorage.getItem('patient_id');

      if (!userEmail && !patientId) {
        Alert.alert('Error', 'Please login again');
        setLoading(false);
        setRefreshing(false);
        return;
      }

      if (!patientId && userEmail) {
        const userResponse = await fetch(`${apiUrl}/api/user/email/${userEmail}`);
        const userInfo = await userResponse.json();
        if (!userInfo.success || !userInfo.patient_id) throw new Error('User not found');
        patientId = userInfo.patient_id;
        await AsyncStorage.setItem('patient_id', patientId);
      }

      const patientResponse = await fetch(`${apiUrl}/api/patients/${patientId}`);
      const patientData = await patientResponse.json();

      if (patientData) {
        const demographics = patientData.demographics || {};
        const dob = demographics.dob || patientData.dob;
        const gender = demographics.gender || patientData.gender || 'N/A';

        setUserData({
          name: patientData.name || 'User',
          age: calculateAge(dob) || 'N/A',
          gender,
          patient_id: patientData.patient_id || 'N/A',
          initials: getInitials(patientData.name),
        });

        let raw = patientData.consultations || [];
        if (typeof raw === 'string') { try { raw = JSON.parse(raw); } catch { raw = []; } }
        if (!Array.isArray(raw)) raw = [];

        const sorted = raw.sort(
          (a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at)
        );
        setAllConsultations(sorted);

        const formatted = sorted.slice(0, 2).map((c) => ({
          id: c.consultation_id,
          date: formatDate(c.date),
          hospital: c.hospital,
          doctor: c.doctor?.name || c.doctor || 'N/A',
          type: c.reason_for_visit,
          time: extractTime(c.date),
          fullConsultation: c,
        }));
        setConsultationTimeline(formatted);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load data. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserData();
  }, [fetchUserData]);

  const chartData = buildChartData(allConsultations);
  const sparkData = chartData.map((d) => d.value);
  const thisMonth = chartData[chartData.length - 1]?.value || 0;
  const peakMonth = Math.max(...sparkData, 0);

  const recentReports = [
    { id: 1, date: 'Date: 02 Dec 2022', title: 'A Comprehensive Health Analysis Report', center: 'Inner Health Diagnostic Centre', score: '63' },
    { id: 2, date: 'Date: 22 Nov 2022', title: 'Monthly Routine Check-up', center: 'Inner Health Diagnostic Centre', score: '81' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1E4B46" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading your health data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E4B46" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1E4B46']}
            tintColor="#1E4B46"
          />
        }
      >
        {/* ── Header ── */}
        <View style={styles.headerSection}>
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeLabel}>Welcome back,</Text>
              <Text style={styles.userName}>{userData.name}</Text>
            </View>
            <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
              <Ionicons name="refresh" size={18} color="#fff" />
            </TouchableOpacity>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>{userData.initials}</Text>
            </View>
          </View>

          <View style={styles.userInfoContainer}>
            {[
              { label: 'Age', value: `${userData.age} yrs` },
              { label: 'Gender', value: userData.gender },
              { label: 'User ID', value: userData.patient_id },
            ].map((item, i) => (
              <View key={i} style={styles.infoItem}>
                <Text style={styles.infoLabel}>{item.label}</Text>
                <Text style={styles.infoValue}>{item.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          <StatRing value={allConsultations.length} color="#1E4B46" title="Total Visits" subtitle="visits" />
          <View style={styles.statDivider} />
          <StatRing value={thisMonth} color="#2E8B57" title="This Month" subtitle="visits" />
          <View style={styles.statDivider} />
          <StatRing value={peakMonth} color="#5B8DB8" title="Peak Month" subtitle="peak" />
        </View>

        {/* ── Trend Chart ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consultation Trend</Text>
            <Text style={styles.sectionSub}>Last 6 months</Text>
          </View>
          <View style={styles.chartCard}>
            <SparkLine
              data={sparkData.length >= 2 ? sparkData : [0, 0, 0, 0, 0, 0]}
              color="#1E4B46"
              height={70}
            />
            <View style={styles.chartXLabels}>
              {chartData.map((d, i) => (
                <Text key={i} style={styles.chartXLabel}>{d.label}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* ── Consultation Timeline ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Consultation Timeline</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ConsultationHistory')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {consultationTimeline.length > 0 ? (
            <View style={styles.timeline}>
              {consultationTimeline.map((consultation, index) => (
                <View key={consultation.id} style={styles.timelineItem}>
                  {index !== consultationTimeline.length - 1 && (
                    <View style={styles.timelineLine} />
                  )}
                  <View style={styles.timelineDotContainer}>
                    <View style={styles.timelineDot}>
                      <Ionicons name="medkit" size={14} color="#FFF" />
                    </View>
                  </View>
                  <View style={styles.consultationCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.dateText}>{consultation.date}</Text>
                      <Text style={styles.timeText}>{consultation.time}</Text>
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.hospitalRow}>
                        <Ionicons name="business" size={16} color="#1E4B46" />
                        <Text style={styles.hospitalName}>{consultation.hospital}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.rowLabel}>Doctor:</Text>
                        <Text style={styles.rowValue}>{consultation.doctor}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.rowLabel}>Reason:</Text>
                        <Text style={styles.rowValue}>{consultation.type}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.viewButton}
                      onPress={() =>
                        navigation.navigate('VisitSummary', {
                          consultation: consultation.fullConsultation,
                        })
                      }
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                      <Ionicons name="arrow-forward" size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No consultations yet</Text>
              <Text style={styles.emptyStateSub}>Pull down to refresh</Text>
            </View>
          )}
        </View>

        {/* ── New User Card ── */}
        {isNewUser && (
          <View style={styles.section}>
            <View style={styles.welcomeCard}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.welcomeCardTitle}>Profile Complete!</Text>
              <Text style={styles.welcomeCardText}>
                Your profile is all set. Here's what you can do next:
              </Text>
              {['View your health records', 'Track your medications', 'Manage emergency contacts'].map(
                (f, i) => (
                  <View key={i} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={20} color="#1E4B46" />
                    <Text style={styles.featureText}>{f}</Text>
                  </View>
                )
              )}
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.exploreButtonText}>Explore Your Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Recent Reports ── */}
        {!isNewUser && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Reports</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -16, paddingHorizontal: 16, marginTop: 12 }}
            >
              {recentReports.map((report) => (
                <View key={report.id} style={styles.reportCard}>
                  <Text style={styles.reportDate}>{report.date}</Text>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportCenter}>{report.center}</Text>
                  <View style={styles.reportFooter}>
                    <View>
                      <Text style={styles.reportLabel}>Health Score</Text>
                      <Text style={styles.reportScore}>{report.score}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={styles.reportIcon}>
                        <Ionicons name="share-social" size={18} color="#0288D1" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.reportIcon}>
                        <Ionicons name="download" size={18} color="#0288D1" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      <BottomNavigation activeNav={activeNav} onNavigate={setActiveNav} navigation={navigation} />
    </SafeAreaView>
  );
}

// ── Chart Styles ──────────────────────────────────────────────────────────────
const chartStyles = StyleSheet.create({
  barsRow:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 100 },
  barCol:   { alignItems: 'center', flex: 1 },
  bar:      { width: 18, borderRadius: 4, marginTop: 4 },
  barValue: { fontSize: 9, color: '#555', fontWeight: '600', marginBottom: 2 },
  barX:     { fontSize: 9, color: '#999', marginTop: 4 },
});

const donutStyles = StyleSheet.create({
  wrap:  { alignItems: 'center', flex: 1 },
  ring:  { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 5, marginBottom: 6 },
  val:   { fontSize: 20, fontWeight: '800' },
  sub:   { fontSize: 9, color: '#999', fontWeight: '500' },
  title: { fontSize: 11, color: '#555', fontWeight: '600', textAlign: 'center' },
});

// ── Main Styles ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  loadingText:      { marginTop: 16, fontSize: 16, color: '#666' },

  // Header
  headerSection:     { backgroundColor: '#1E4B46', paddingHorizontal: 16, paddingBottom: 24, paddingTop: 80 },
  welcomeSection:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  welcomeText:       { flex: 1 },
  welcomeLabel:      { fontSize: 14, color: '#A8D5CC', fontWeight: '500' },
  userName:          { fontSize: 26, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  refreshBtn:        { padding: 8, marginRight: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, alignSelf: 'flex-start' },
  profileImage:      { width: 72, height: 72, borderRadius: 36, backgroundColor: '#C8A2D0', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' },
  profileInitial:    { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  userInfoContainer: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 16 },
  infoItem:          { flex: 1, alignItems: 'center' },
  infoLabel:         { fontSize: 11, color: '#A8D5CC', marginBottom: 4, fontWeight: '500' },
  infoValue:         { fontSize: 15, color: '#FFF', fontWeight: '600' },

  // Stats
  statsRow:    { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 3, alignItems: 'center' },
  statDivider: { width: 1, height: 60, backgroundColor: '#F0F0F0' },

  // Sections
  section:       { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle:  { fontSize: 17, fontWeight: '700', color: '#222' },
  sectionSub:    { fontSize: 12, color: '#999', fontWeight: '500' },
  viewAll:       { fontSize: 13, color: '#1E4B46', fontWeight: '700' },

  // Charts
  chartCard:    { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 6, elevation: 2 },
  chartXLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  chartXLabel:  { fontSize: 9, color: '#aaa', fontWeight: '600' },

  // Timeline
  timeline:             { paddingLeft: 20 },
  timelineItem:         { marginBottom: 20, position: 'relative' },
  timelineLine:         { position: 'absolute', left: -12, top: 40, width: 2, height: 80, backgroundColor: '#1E4B46' },
  timelineDotContainer: { marginBottom: 10 },
  timelineDot:          { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E4B46', justifyContent: 'center', alignItems: 'center', marginLeft: -18 },
  consultationCard:     { backgroundColor: '#FFF', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  cardHeader:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8F5F3' },
  dateText:             { fontSize: 13, fontWeight: '700', color: '#1E4B46' },
  timeText:             { fontSize: 12, color: '#999' },
  cardContent:          { marginBottom: 12 },
  hospitalRow:          { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  hospitalName:         { fontSize: 14, fontWeight: '600', color: '#1E4B46', marginLeft: 8 },
  infoRow:              { flexDirection: 'row', marginBottom: 5 },
  rowLabel:             { fontSize: 12, fontWeight: '600', color: '#999', minWidth: 60 },
  rowValue:             { fontSize: 12, color: '#333', fontWeight: '500' },
  viewButton:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E4B46', paddingVertical: 9, borderRadius: 10, gap: 6 },
  viewButtonText:       { fontSize: 13, fontWeight: '600', color: '#fff' },
  emptyState:           { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, backgroundColor: '#fff', borderRadius: 14 },
  emptyStateText:       { marginTop: 12, fontSize: 15, color: '#999', fontWeight: '600' },
  emptyStateSub:        { fontSize: 12, color: '#bbb', marginTop: 4 },

  // New user card
  welcomeCard:       { backgroundColor: '#FFF', borderRadius: 14, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  welcomeCardTitle:  { fontSize: 18, fontWeight: '700', color: '#1E4B46', marginTop: 12, marginBottom: 8 },
  welcomeCardText:   { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 20 },
  featureItem:       { flexDirection: 'row', alignItems: 'center', marginBottom: 12, alignSelf: 'flex-start' },
  featureText:       { fontSize: 14, color: '#333', marginLeft: 12, fontWeight: '500' },
  exploreButton:     { backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10, width: '100%', alignItems: 'center', marginTop: 8 },
  exploreButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Reports
  reportCard:   { backgroundColor: '#B3E5FC', borderRadius: 12, padding: 16, width: 220, marginRight: 12 },
  reportDate:   { fontSize: 11, color: '#0277BD', fontWeight: '600', marginBottom: 8 },
  reportTitle:  { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4 },
  reportCenter: { fontSize: 12, color: '#666', marginBottom: 12 },
  reportFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  reportLabel:  { fontSize: 11, color: '#666', marginBottom: 4 },
  reportScore:  { fontSize: 20, fontWeight: 'bold', color: '#0277BD' },
  reportIcon:   { padding: 4 },
});