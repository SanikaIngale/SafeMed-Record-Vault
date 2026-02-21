import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useContext, useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../../navigation/AppNavigator';
import BottomNavigation from '../components/BottomNavigation';

const ProfileScreen = ({ navigation }) => {
  const [activeNav, setActiveNav] = useState('Profile');
  const [userData, setUserData] = useState({
    name: 'Loading...',
    initials: 'NA',
    patient_id: '-'
  });
  const [loading, setLoading] = useState(true);
  const authContext = useContext(AuthContext);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
    }, [])
  );

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      const apiUrl = Platform.OS === 'android' ? 'http://10.215.134.89:5000' : 'http://localhost:5000';
      
      // Get patient_id and userEmail from AsyncStorage
      let patientId = await AsyncStorage.getItem('patient_id');
      let userEmail = await AsyncStorage.getItem('userEmail');
      
      if (!patientId) {
        console.error('No patient_id found in storage');
        setLoading(false);
        return;
      }

      // Fetch patient basic data
      const patientResponse = await fetch(`${apiUrl}/api/patients/${patientId}`);
      const patientData = await patientResponse.json();
      
      if (!patientData || patientData.success === false) {
        console.error('Patient not found');
        setLoading(false);
        return;
      }

      // Fetch demographics data
      const demographicsResponse = await fetch(`${apiUrl}/api/patients/${patientId}/demographics`);
      const demographicsData = await demographicsResponse.json();
      
      const demographics = demographicsData.success ? demographicsData.demographics : {};
      
      setUserData({
        name: patientData.name || 'User',
        initials: getInitials(patientData.name),
        patient_id: patientData.patient_id || '-',
        email: userEmail || '-',
        phone: patientData.phone || '-',
        dob: demographics.dob || null,
        gender: demographics.gender || '-',
        blood_group: demographics.bloodType || '-',
        height: demographics.height || '-',
        weight: demographics.weight || '-'
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'NA';
    const names = name.split(' ');
    return names.length > 1 
      ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
      : names[0][0].toUpperCase();
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              if (authContext && authContext.signOut) {
                await authContext.signOut();
              } else {
                console.warn('AuthContext not available');
                // Fallback: manually clear storage and navigate
                await AsyncStorage.multiRemove([
                  'userToken',
                  'userData',
                  'userEmail',
                  'patient_id',
                  'userPhone',
                  'userName',
                  'userDemographics',
                  'isNewUser',
                ]);
              }
              
              console.log('✅ User logged out successfully');
            } catch (error) {
              console.error('Error during logout:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleNavigation = (navName) => {
    setActiveNav(navName);
  };

  const menuItems = [
    {
      section: 'Account',
      items: [
        {
          id: 'personal',
          icon: 'account-circle-outline',
          title: 'Edit Personal Info',
          screen: 'EditPersonalInfo',
        },
        {
          id: 'emergency',
          icon: 'phone-alert',
          title: 'Emergency Contacts',
          screen: 'EmergencyContacts',
        },
        {
          id: 'qr',
          icon: 'qrcode',
          title: 'My Unique QR Code',
          screen: 'QRCode',
        },
      ],
    },
    {
      section: 'Medical Information',
      items: [
        {
          id: 'allergies',
          icon: 'heart-pulse',
          title: 'Allergies & Conditions',
          screen: 'AllergiesConditions',
        },
        {
          id: 'medication',
          icon: 'pill',
          title: 'Ongoing Medication',
          screen: 'OngoingMedication',
        },
        {
          id: 'vaccination',
          icon: 'needle',
          title: 'Vaccination History',
          screen: 'VaccinationHistory',
        },
      ],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon name="arrow-left" size={24} color="#1E4B46" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.profileHeader}>
            <View style={styles.profileImage}>
              <Text style={styles.profileInitial}>{userData.initials}</Text>
            </View>
            <Text style={styles.profileName}>{userData.name}</Text>
            <View style={styles.profileDetails}>
              <View style={styles.detailRow}>
                <Icon name="email-outline" size={16} color="#666" />
                <Text style={styles.detailText}>{userData.email}</Text>
              </View>
              {userData.phone && userData.phone !== '-' && (
                <View style={styles.detailRow}>
                  <Icon name="phone-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>{userData.phone}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <Icon name="card-account-details-outline" size={16} color="#666" />
                <Text style={styles.detailText}>ID: {userData.patient_id}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editProfileButton}
              onPress={() => navigation.navigate('EditPersonalInfo')}
            >
              <Text style={styles.editProfileText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Stats Card */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Icon name="water" size={24} color="#1E4B46" />
              <Text style={styles.statLabel}>Blood Group</Text>
              <Text style={styles.statValue}>{userData.blood_group}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="gender-male-female" size={24} color="#1E4B46" />
              <Text style={styles.statLabel}>Gender</Text>
              <Text style={styles.statValue}>{userData.gender}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Icon name="calendar" size={24} color="#1E4B46" />
              <Text style={styles.statLabel}>DOB</Text>
              <Text style={styles.statValue}>
                {userData.dob ? new Date(userData.dob).toLocaleDateString('en-GB', { 
                  day: '2-digit', 
                  month: 'short', 
                  year: 'numeric' 
                }) : '-'}
              </Text>
            </View>
          </View>

          {menuItems.map((section, index) => (
            <View key={index} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.section}</Text>
              <View style={styles.menuCard}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      itemIndex !== section.items.length - 1 && styles.menuItemBorder,
                    ]}
                    onPress={() => navigation.navigate(item.screen)}
                  >
                    <Icon name={item.icon} size={24} color="#333" />
                    <Text style={styles.menuItemText}>{item.title}</Text>
                    <Icon name="chevron-right" size={24} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      <BottomNavigation 
        activeNav={activeNav} 
        onNavigate={handleNavigation}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E4B46',
  },
  headerSpacer: {
    width: 34,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#C8A2D0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileInitial: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E4B46',
    marginBottom: 12,
  },
  profileDetails: {
    alignItems: 'center',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  editProfileText: {
    color: '#1E4B46',
    fontSize: 14,
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#333',
  },
  logoutButton: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: '#D32F2F',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutIcon: {
    marginRight: 8,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});

export default ProfileScreen;