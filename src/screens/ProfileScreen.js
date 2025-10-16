import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';

const ProfileScreen = ({ navigation }) => {
  const [activeNav, setActiveNav] = useState('Profile');

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
    {
      section: 'Health Records',
      items: [
        {
          id: 'consultation',
          icon: 'hospital-box',
          title: 'Consultation History',
          screen: 'ConsultationHistory',
        },
        {
          id: 'requests',
          icon: 'file-document-outline',
          title: 'Data Access Requests',
          screen: 'Request',
        },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: () => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'SignIn' }],
            });
          },
        },
      ]
    );
  };

  const handleNavigation = (navName) => {
    setActiveNav(navName);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Arrow */}
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

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: 'https://via.placeholder.com/120' }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>Ruchita Sharma</Text>
          <TouchableOpacity style={styles.editProfileButton}>
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Sections */}
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

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

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
    fontWeight: '600',
    color: '#1E4B46',
  },
  headerSpacer: {
    width: 34, // Match the back button width for centering
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
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E4B46',
    marginBottom: 10,
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
    marginHorizontal: 20,
    marginTop: 30,
    marginBottom: 20,
    backgroundColor: '#1E4B46',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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