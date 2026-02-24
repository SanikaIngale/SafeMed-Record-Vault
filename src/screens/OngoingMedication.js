import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL, apiCall } from '../config/api';

const API_BASE_URL = `${API_URL}/api`;

const OngoingMedication = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [patientId, setPatientId] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    purpose: '',
    dosage: '',
    frequency: '',
    time: '',
    startDate: '',
  });

  useEffect(() => {
    loadMedications();
  }, []);

  const loadMedications = async () => {
    try {
      setLoading(true);

      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      console.log('📧 Retrieved email from storage:', email);
      
      if (!email) {
        Alert.alert('Error', 'Please login again');
        navigation.replace('SignIn');
        return;
      }

      // Step 1: Get patient_id from users table
      const encodedEmail = encodeURIComponent(email);
      const userUrl = `${API_BASE_URL}/user/email/${encodedEmail}`;
      console.log('🔗 Calling user endpoint:', userUrl);
      
      const userResponse = await fetch(userUrl);
      console.log('📊 User response status:', userResponse.status);
      
      if (!userResponse.ok) {
        throw new Error(`User fetch failed: ${userResponse.status} ${userResponse.statusText}`);
      }
      const userData = await userResponse.json();
      console.log('👤 User data received:', userData);

      if (!userData.success) {
        throw new Error('Failed to fetch user data: ' + (userData.message || 'Unknown error'));
      }

      const patId = userData.patient_id;
      setPatientId(patId);
      console.log('🏥 Patient ID:', patId);

      // Step 2: Get medications from patients table
      const medsUrl = `${API_BASE_URL}/medications/${patId}`;
      console.log('🔗 Calling medications endpoint:', medsUrl);
      
      const medsResponse = await fetch(medsUrl);
      console.log('📊 Medications response status:', medsResponse.status);
      
      if (!medsResponse.ok) {
        throw new Error(`Medications fetch failed: ${medsResponse.status} ${medsResponse.statusText}`);
      }
      const medsData = await medsResponse.json();

      if (medsData.success) {
        setMedications(medsData.medications || []);
        console.log('✅ Medications loaded:', medsData.medications?.length || 0);
      } else {
        throw new Error(medsData.message || 'Failed to load medications');
      }

    } catch (error) {
      console.error('❌ Error loading medications:', error);
      Alert.alert('Error', error.message || 'Failed to load medications. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMedications();
  };

  const handleAddMedication = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      purpose: '',
      dosage: '',
      frequency: '',
      time: '',
      startDate: '',
    });
    setModalVisible(true);
  };

  const handleEditMedication = (med) => {
    setEditingMed(med);
    setFormData({ ...med });
    setModalVisible(true);
  };

  const handleDeleteMedication = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this medication?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/medications/${patientId}/${id}`, {
              method: 'DELETE',
            });

            const data = await response.json();

            if (data.success) {
              setMedications(medications.filter(med => med.id !== id));
              Alert.alert('Success', 'Medication deleted successfully');
            } else {
              throw new Error(data.message);
            }
          } catch (error) {
            console.error('❌ Error deleting medication:', error);
            Alert.alert('Error', 'Failed to delete medication');
          }
        },
      },
    ]);
  };

  const handleSaveMedication = async () => {
    if (!formData.name || !formData.dosage || !formData.frequency) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      if (editingMed) {
        // Update existing medication
        const response = await fetch(`${API_BASE_URL}/medications/${patientId}/${editingMed.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          setMedications(medications.map(med =>
            med.id === editingMed.id ? { ...editingMed, ...formData } : med
          ));
          Alert.alert('Success', 'Medication updated successfully');
        } else {
          throw new Error(data.message);
        }
      } else {
        // Add new medication
        const response = await fetch(`${API_BASE_URL}/medications/${patientId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (data.success) {
          setMedications([...medications, data.medication]);
          Alert.alert('Success', 'Medication added successfully');
        } else {
          throw new Error(data.message);
        }
      }
      setModalVisible(false);
    } catch (error) {
      console.error('❌ Error saving medication:', error);
      Alert.alert('Error', 'Failed to save medication');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading medications...</Text>
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
        <Text style={styles.headerTitle}>Ongoing Medication</Text>
        <TouchableOpacity onPress={handleAddMedication}>
          <Icon name="plus" size={24} color="#1E4B46" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E4B46']} />
        }
      >
        <Text style={styles.description}>
          Keep track of your current medications and dosage schedules
        </Text>

        {medications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="pill-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No medications added yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to add your first medication</Text>
          </View>
        ) : (
          medications.map((med) => (
            <View key={med.id} style={styles.medicationCard}>
              <View style={styles.cardHeader}>
                <View style={styles.iconWrapper}>
                  <Icon name="pill" size={24} color="#1E4B46" />
                </View>
                <View style={styles.headerInfo}>
                  <Text style={styles.medicationName}>{med.name}</Text>
                  <Text style={styles.purpose}>{med.purpose}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => handleEditMedication(med)}
                  >
                    <Icon name="pencil" size={18} color="#1E4B46" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionIcon}
                    onPress={() => handleDeleteMedication(med.id)}
                  >
                    <Icon name="delete" size={18} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Dosage</Text>
                  <Text style={styles.detailValue}>{med.dosage}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Frequency</Text>
                  <Text style={styles.detailValue}>{med.frequency}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>{med.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Start Date</Text>
                  <Text style={styles.detailValue}>{med.startDate}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {editingMed ? 'Edit Medication' : 'Add New Medication'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Medication Name *"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Purpose"
                value={formData.purpose}
                onChangeText={(text) => setFormData({ ...formData, purpose: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Dosage (e.g., 1 tablet, 2 puffs) *"
                value={formData.dosage}
                onChangeText={(text) => setFormData({ ...formData, dosage: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Frequency (e.g., Once daily) *"
                value={formData.frequency}
                onChangeText={(text) => setFormData({ ...formData, frequency: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Time (e.g., Morning, After meals)"
                value={formData.time}
                onChangeText={(text) => setFormData({ ...formData, time: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Start Date (DD/MM/YYYY)"
                value={formData.startDate}
                onChangeText={(text) => setFormData({ ...formData, startDate: text })}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSaveMedication}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    marginTop: 10,
    fontSize: 16,
    color: '#1E4B46',
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
  description: {
    fontSize: 14,
    color: '#1E4B46',
    marginBottom: 20,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  medicationCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e8f5f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 4,
  },
  purpose: {
    fontSize: 14,
    color: '#1E4B46',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIcon: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 15,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#1E4B46',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '500',
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
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OngoingMedication;