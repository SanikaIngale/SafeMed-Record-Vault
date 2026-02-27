import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { API_URL, apiCall } from '../config/api';
import {
  ActivityIndicator,
  Alert,
  Platform,
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
  const [userData, setUserData] = useState({
    name: 'Loading...',
    age: '-',
    gender: '-',
    patient_id: '-',
    initials: 'NA'
  });
  const [consultationTimeline, setConsultationTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Check if user is new
      const newUserFlag = await AsyncStorage.getItem('isNewUser');
      setIsNewUser(newUserFlag === 'true');
      
      // API URL based on platform
      const apiUrl = API_URL;
      
      // Try to get email from AsyncStorage first
      let userEmail = await AsyncStorage.getItem('userEmail');
      
      // If no email, try to get patient_id directly (fallback)
      if (!userEmail) {
        const patientId = await AsyncStorage.getItem('patient_id');
        
        if (!patientId) {
          console.error('No user email or patient_id found in storage');
          Alert.alert('Error', 'Please login again');
          setLoading(false);
          return;
        }
        
        // If we have patient_id, skip step 1 and go directly to step 2
        const patientResponse = await fetch(`${apiUrl}/api/patients/${patientId}`);
        const patientData = await patientResponse.json();
        
        if (patientData) {
          // Extract demographics from JSONB or use defaults
          const demographics = patientData.demographics || {};
          const dob = demographics.dob || patientData.dob;
          const gender = demographics.gender || patientData.gender || 'N/A';
          
          setUserData({
            name: patientData.name || 'User',
            age: calculateAge(dob) || 'N/A',
            gender: gender,
            patient_id: patientData.patient_id || 'N/A',
            initials: getInitials(patientData.name)
          });

          if (patientData.consultations && patientData.consultations.length > 0) {
            const formattedConsultations = patientData.consultations
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 2)
              .map(consultation => ({
                id: consultation.consultation_id,
                date: formatDate(consultation.date),
                hospital: consultation.hospital,
                doctor: consultation.doctor.name,
                type: consultation.reason_for_visit,
                time: extractTime(consultation.date),
                fullConsultation: consultation
              }));
            
            setConsultationTimeline(formattedConsultations);
          }
        }
        
        setLoading(false);
        return;
      }

      // Step 1: Get patient_id from user table using email
      const userResponse = await fetch(`${apiUrl}/api/user/email/${userEmail}`);
      const userInfo = await userResponse.json();
      
      if (!userInfo.success || !userInfo.patient_id) {
        console.error('User not found');
        Alert.alert('Error', 'User data not found');
        setLoading(false);
        return;
      }

      const patientId = userInfo.patient_id;
      
      // Store patient_id for future use
      await AsyncStorage.setItem('patient_id', patientId);

      // Step 2: Get full patient data from patients table
      const patientResponse = await fetch(`${apiUrl}/api/patients/${patientId}`);
      const patientData = await patientResponse.json();
      
      if (patientData) {
        // Extract demographics from JSONB or use defaults
        const demographics = patientData.demographics || {};
        const dob = demographics.dob || patientData.dob;
        const gender = demographics.gender || patientData.gender || 'N/A';
        
        // Set user data
        setUserData({
          name: patientData.name || 'User',
          age: calculateAge(dob) || 'N/A',
          gender: gender,
          patient_id: patientData.patient_id || 'N/A',
          initials: getInitials(patientData.name)
        });

        // Format consultation timeline from consultations array
        if (patientData.consultations && patientData.consultations.length > 0) {
          const formattedConsultations = patientData.consultations
            .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
            .slice(0, 2) // Get only the 2 most recent
            .map(consultation => ({
              id: consultation.consultation_id,
              date: formatDate(consultation.date),
              hospital: consultation.hospital,
              doctor: consultation.doctor.name,
              type: consultation.reason_for_visit,
              time: extractTime(consultation.date),
              fullConsultation: consultation // Store full data for detail view
            }));
          
          setConsultationTimeline(formattedConsultations);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const calculateAge = (dob) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const extractTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const handleNavigation = (navName) => {
    setActiveNav(navName);
  };

  // Static data for recent reports (you can replace this later with actual data)
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header - Teal Background */}
        <View style={styles.headerSection}>
          {/* Welcome Section */}
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeText}>
              <Text style={styles.welcomeLabel}>Welcome</Text>
              <Text style={styles.userName}>{userData.name}</Text>
            </View>
            <View style={styles.profileImageContainer}>
              <View style={styles.profileImage}>
                <Text style={styles.profileInitial}>{userData.initials}</Text>
              </View>
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfoContainer}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Age</Text>
              <Text style={styles.infoValue}>{userData.age} yrs</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>{userData.gender}</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>User ID</Text>
              <Text style={styles.infoValue}>{userData.patient_id}</Text>
            </View>
          </View>
        </View>

        {/* Consultation Timeline - Hidden for new users */}
        
        <View style={styles.timelineSection}>
          <View style={styles.timelineHeader}>
            <Text style={styles.sectionTitle}>Consultation Timeline</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ConsultationHistory')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>

          {consultationTimeline.length > 0 ? (
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
                      <Ionicons name="medkit" size={14} color="#FFF" />
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
                      onPress={() => navigation.navigate('VisitSummary', {
                        consultation: consultation.fullConsultation
                      })}
                    >
                      <Text style={styles.viewButtonText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color="#CCC" />
              <Text style={styles.emptyStateText}>No consultations yet</Text>
            </View>
          )}
        </View>
      

        {/* New User Welcome Section */}
        {isNewUser && (
          <View style={styles.newUserSection}>
            <View style={styles.welcomeCard}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
              <Text style={styles.welcomeCardTitle}>Profile Complete!</Text>
              <Text style={styles.welcomeCardText}>
                Your profile is all set. Here's what you can do next:
              </Text>
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={20} color="#1E4B46" />
                  <Text style={styles.featureText}>View your health records</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={20} color="#1E4B46" />
                  <Text style={styles.featureText}>Track your medications</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons name="checkmark" size={20} color="#1E4B46" />
                  <Text style={styles.featureText}>Manage emergency contacts</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.exploreButton}
                onPress={() => navigation.navigate('Profile')}
              >
                <Text style={styles.exploreButtonText}>Explore Your Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Recent Reports - Hidden for new users */}
        {!isNewUser && (
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
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  headerSection: {
    backgroundColor: '#1E4B46',
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 80,
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
    fontSize: 25,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
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
  newUserSection: {
    paddingHorizontal: 16,
    marginVertical: 24,
  },
  welcomeCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E4B46',
    marginTop: 12,
    marginBottom: 8,
  },
  welcomeCardText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  featureList: {
    width: '100%',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
    fontWeight: '500',
  },
  exploreButton: {
    backgroundColor: '#1E4B46',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});