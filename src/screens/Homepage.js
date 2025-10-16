import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';

export default function HomePage({ navigation }) {
  const [activeNav, setActiveNav] = useState('Home');

  const handleNavigation = (navName) => {
    setActiveNav(navName);
  };

  const recentReports = [
    {
      id: 1,
      date: 'Date: 02 Dec 2022',
      title: 'A Comprehensive Health Analysis Report',
      center: 'Inner Health Diagnostic Centre',
      score: '63',
    },
    {
      id: 2,
      date: 'Date: 22 Nov 2022',
      title: 'Monthly Routine Check-up',
      center: 'Inner Health Diagnostic Centre',
      score: '81',
    },
  ];

  const consultationTimeline = [
    {
      id: 1,
      date: '05 July 2025',
      hospital: 'General Hospital',
      doctor: 'Dr. Anya Sharma',
      type: 'General Checkup',
      time: '10:30 AM',
    },
    {
      id: 2,
      date: '28 June 2025',
      hospital: 'City Medical Center',
      doctor: 'Dr. John Smith',
      type: 'Cardiac Consultation',
      time: '02:00 PM',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#9BD7CD" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Teal Background */}
        <View style={styles.headerSection}>
          {/* Top Navigation */}
          <View style={styles.topNav}>
            <TouchableOpacity 
              style={styles.gridIcon}
              onPress={() => navigation.navigate('QRCode')}
            >
              <Ionicons name="scan" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeLabel}>Welcome</Text>
              <Text style={styles.userName}>Ruchita Sharma</Text>
            </View>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileInitial}>RS</Text>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>38 yrs</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>Female</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue}>USER12345</Text>
            </View>
          </View>
        </View>

        {/* Consultation Timeline */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Consultation Timeline</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ConsultationHistory')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.timeline}>
            {consultationTimeline.map((consultation, index) => (
              <View key={consultation.id} style={styles.timelineItem}>
                {/* Timeline Line */}
                {index !== consultationTimeline.length - 1 && (
                  <View style={styles.timelineLine} />
                )}

                {/* Timeline Dot */}
                <View style={styles.timelineDotContainer}>
                  <View style={styles.timelineDot}>
                    <Ionicons name="hospital" size={14} color="#FFF" />
                  </View>
                </View>

                {/* Consultation Card */}
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
                      <Text style={styles.label}>Doctor:</Text>
                      <Text style={styles.value}>{consultation.doctor}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.label}>Type:</Text>
                      <Text style={styles.value}>{consultation.type}</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => navigation.navigate('VisitSummary')}
                  >
                    <Text style={styles.viewButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Reports */}
        <View style={styles.recentReportsSection}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.reportsScroll}
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
                  <View style={styles.reportIcons}>
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

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation - Passing navigation prop */}
      <BottomNavigation 
        activeNav={activeNav} 
        onNavigate={handleNavigation}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  headerSection: {
    backgroundColor: '#9BD7CD',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  gridIcon: {
    padding: 8,
  },
  welcomeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  welcomeText: {
    flex: 1,
  },
  welcomeLabel: {
    fontSize: 14,
    color: '#E0E0E0',
    fontWeight: '500',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 4,
  },
  profileImageContainer: {
    marginLeft: 12,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#C8A2D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  userInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '#E0E0E0',
    marginBottom: 4,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: '600',
  },
  timelineSection: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  timelineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAll: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '600',
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: -12,
    top: 40,
    width: 2,
    height: 80,
    backgroundColor: '#1E4B46',
  },
  timelineDotContainer: {
    marginBottom: 12,
  },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E4B46',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -18,
  },
  consultationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginLeft: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8F5F3',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E4B46',
  },
  timeText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  cardContent: {
    marginBottom: 12,
  },
  hospitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hospitalName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E4B46',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    minWidth: 60,
  },
  value: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E4B46',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffff',
  },
  recentReportsSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  reportsScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  reportCard: {
    backgroundColor: '#B3E5FC',
    borderRadius: 12,
    padding: 16,
    width: 220,
    marginRight: 12,
  },
  reportDate: {
    fontSize: 11,
    color: '#0277BD',
    fontWeight: '600',
    marginBottom: 8,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  reportCenter: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  reportLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  reportScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  reportIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  reportIcon: {
    padding: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});