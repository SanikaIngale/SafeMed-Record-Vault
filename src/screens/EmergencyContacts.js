import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const EmergencyContacts = ({ navigation }) => {
  const [contacts, setContacts] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientId, setPatientId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
  });

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      const apiUrl = Platform.OS === 'android' ? 'http://10.164.220.89:5000' : 'http://localhost:5000';
      
      // Get patient_id from AsyncStorage
      const patId = await AsyncStorage.getItem('patient_id');
      
      if (!patId) {
        Alert.alert('Error', 'Patient ID not found. Please login again.');
        setLoading(false);
        return;
      }

      setPatientId(patId);

      // Fetch emergency contacts
      const response = await fetch(`${apiUrl}/api/patients/${patId}/emergency-contacts`);
      const data = await response.json();

      if (data.success && data.emergency_contacts) {
        const formattedContacts = data.emergency_contacts.map((contact, index) => ({
          id: contact.id || index,
          name: contact.name,
          relation: contact.relation,
          phone: contact.phone,
          isPrimary: index === 0,
        }));
        setContacts(formattedContacts);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  const handleAddContact = () => {
    setEditingContact(null);
    setFormData({ name: '', relation: '', phone: '' });
    setModalVisible(true);
  };

  const handleEditContact = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      relation: contact.relation,
      phone: contact.phone,
    });
    setModalVisible(true);
  };

  const handleDeleteContact = (id) => {
    Alert.alert(
      'Confirm Delete', 
      'Are you sure you want to delete this contact?', 
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setSaving(true);
            try {
              const apiUrl = Platform.OS === 'android' ? 'http://10.164.220.89:5000' : 'http://localhost:5000';
              
              const updatedContacts = contacts.filter(contact => contact.id !== id);
              
              // Save to backend
              const response = await fetch(`${apiUrl}/api/patients/${patientId}/emergency-contacts`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  emergency_contacts: updatedContacts.map(({ id, isPrimary, ...rest }) => rest),
                }),
              });

              const data = await response.json();

              if (response.ok && data.success) {
                setContacts(updatedContacts);
                Alert.alert('Success', 'Contact deleted successfully!');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete contact');
              }
            } catch (error) {
              console.error('Error deleting contact:', error);
              Alert.alert('Error', 'Failed to delete contact. Please try again.');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleCallContact = (phone) => {
    const phoneNumber = phone.replace(/[^0-9+]/g, ''); // Remove non-numeric characters except +
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Unable to make a call');
    });
  };

  const handleSaveContact = async () => {
    if (!formData.name || !formData.relation || !formData.phone) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate phone number (basic validation)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (!phoneRegex.test(formData.phone)) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setSaving(true);
    try {
      const apiUrl = Platform.OS === 'android' ? 'http://10.164.220.89:5000' : 'http://localhost:5000';
      
      let updatedContacts;
      
      if (editingContact) {
        updatedContacts = contacts.map(contact =>
          contact.id === editingContact.id
            ? { ...contact, ...formData }
            : contact
        );
      } else {
        updatedContacts = [...contacts, { id: Date.now(), ...formData, isPrimary: false }];
      }

      // Save to backend
      const response = await fetch(`${apiUrl}/api/patients/${patientId}/emergency-contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emergency_contacts: updatedContacts.map(({ id, isPrimary, ...rest }) => rest),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setContacts(updatedContacts);
        Alert.alert('Success', editingContact ? 'Contact updated successfully!' : 'Contact added successfully!');
        setModalVisible(false);
      } else {
        Alert.alert('Error', data.message || 'Failed to save contact');
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      Alert.alert('Error', 'Failed to save contact. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity onPress={handleAddContact}>
          <Icon name="plus" size={24} color="#1E4B46" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Icon name="information" size={20} color="#1E4B46" />
          <Text style={styles.infoText}>
            These contacts can be reached in case of emergency. Your primary contact is synced from your medical records.
          </Text>
        </View>

        {contacts.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="account-alert-outline" size={64} color="#CCC" />
            <Text style={styles.emptyStateText}>No emergency contacts</Text>
            <Text style={styles.emptyStateSubtext}>Tap + to add a contact</Text>
          </View>
        ) : (
          contacts.map((contact) => (
            <View key={contact.id} style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <View style={[styles.iconCircle, contact.isPrimary && styles.primaryIconCircle]}>
                  <Icon name="account" size={24} color={contact.isPrimary ? '#fff' : '#1E4B46'} />
                </View>
                <View style={styles.contactDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    {contact.isPrimary && (
                      <View style={styles.primaryBadge}>
                        <Text style={styles.primaryBadgeText}>Primary</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.contactRelation}>{contact.relation}</Text>
                  <TouchableOpacity onPress={() => handleCallContact(contact.phone)}>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.contactActions}>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={() => handleCallContact(contact.phone)}
                >
                  <Icon name="phone" size={20} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditContact(contact)}
                >
                  <Icon name="pencil" size={20} color="#1E4B46" />
                </TouchableOpacity>
                {!contact.isPrimary && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteContact(contact.id)}
                  >
                    <Icon name="delete" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContact ? 'Edit Contact' : 'Add New Contact'}
            </Text>

            <View style={styles.inputContainer}>
              <Icon name="account-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="human-male-female" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Relation (e.g., Father, Mother, Spouse)"
                value={formData.relation}
                onChangeText={(text) => setFormData({ ...formData, relation: text })}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="phone-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Phone Number (e.g., +91 98765 43210)"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveContact}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : editingContact ? 'Update' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 45,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E4B46',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F5F3',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#1E4B46',
    marginLeft: 10,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#CCC',
    marginTop: 8,
  },
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e8f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  primaryIconCircle: {
    backgroundColor: '#1E4B46',
  },
  contactDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
  },
  primaryBadge: {
    backgroundColor: '#FFA000',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  contactRelation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
  callButton: {
    backgroundColor: '#2ecc71',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: '85%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#1E4B46',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#1E4B46',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EmergencyContacts;