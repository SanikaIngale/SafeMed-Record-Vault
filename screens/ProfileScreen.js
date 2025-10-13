import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const ProfileScreen = ({ navigation }) => {
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
          title: 'On going Medication',
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
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  editProfileText: {
    color: '#666',
    fontSize: 14,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
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
    marginVertical: 30,
    backgroundColor: '#2d7a6e',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;