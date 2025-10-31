import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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

const AllergiesConditions = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('allergies');
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);

  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    severity: '',
    effect: '',
    diagnosed: '',
    status: '',
  });

  useEffect(() => {
    fetchPatientData();
  }, []);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      const apiUrl = Platform.OS === 'android' ? 'http://10.185.77.5:5000' : 'http://localhost:5000';
      
      // Get patient_id from AsyncStorage
      const patientId = await AsyncStorage.getItem('patient_id');
      
      if (!patientId) {
        Alert.alert('Error', 'Patient ID not found. Please login again.');
        setLoading(false);
        return;
      }

      // Fetch patient data
      const response = await fetch(`${apiUrl}/api/patients/${patientId}`);
      const patientData = await response.json();

      if (patientData && patientData.success !== false) {
        // Set allergies
        if (patientData.allergies && Array.isArray(patientData.allergies)) {
          const formattedAllergies = patientData.allergies.map((allergy, index) => ({
            id: index + 1,
            name: allergy.name,
            severity: allergy.severity,
            notes: allergy.effect || 'No notes'
          }));
          setAllergies(formattedAllergies);
        }

        // Set conditions
        if (patientData.conditions && Array.isArray(patientData.conditions)) {
          const formattedConditions = patientData.conditions.map((condition, index) => ({
            id: index + 1,
            name: condition.name,
            diagnosed: condition.diagnosed_year?.toString() || 'N/A',
            status: condition.status || 'Unknown'
          }));
          setConditions(formattedConditions);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching patient data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      severity: '',
      effect: '',
      diagnosed: '',
      status: '',
    });
    setModalVisible(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    if (activeTab === 'allergies') {
      setFormData({
        name: item.name,
        severity: item.severity,
        effect: item.notes,
      });
    } else {
      setFormData({
        name: item.name,
        diagnosed: item.diagnosed,
        status: item.status,
      });
    }
    setModalVisible(true);
  };

  const handleSaveItem = () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (activeTab === 'allergies') {
      if (!formData.severity) {
        Alert.alert('Error', 'Please enter severity');
        return;
      }
      if (editingItem) {
        setAllergies(allergies.map(a =>
          a.id === editingItem.id ? { ...editingItem, name: formData.name, severity: formData.severity, notes: formData.effect } : a
        ));
        Alert.alert('Success', 'Allergy updated successfully!');
      } else {
        setAllergies([...allergies, { id: Date.now(), name: formData.name, severity: formData.severity, notes: formData.effect }]);
        Alert.alert('Success', 'Allergy added successfully!');
      }
    } else {
      if (!formData.diagnosed || !formData.status) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (editingItem) {
        setConditions(conditions.map(c =>
          c.id === editingItem.id ? { ...editingItem, name: formData.name, diagnosed: formData.diagnosed, status: formData.status } : c
        ));
        Alert.alert('Success', 'Condition updated successfully!');
      } else {
        setConditions([...conditions, { id: Date.now(), name: formData.name, diagnosed: formData.diagnosed, status: formData.status }]);
        Alert.alert('Success', 'Condition added successfully!');
      }
    }
    setModalVisible(false);
  };

  const handleDeleteAllergy = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this allergy?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          setAllergies(allergies.filter(item => item.id !== id));
          Alert.alert('Success', 'Allergy deleted successfully!');
        },
      },
    ]);
  };

  const handleDeleteCondition = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this condition?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => {
          setConditions(conditions.filter(item => item.id !== id));
          Alert.alert('Success', 'Condition deleted successfully!');
        },
      },
    ]);
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'severe':
        return '#e74c3c';
      case 'moderate':
        return '#f39c12';
      case 'mild':
        return '#2ecc71';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Allergies & Conditions</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading your data...</Text>
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
        <Text style={styles.headerTitle}>Allergies & Conditions</Text>
        <TouchableOpacity onPress={handleAddItem}>
          <Icon name="plus" size={24} color="#1E4B46" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'allergies' && styles.activeTab]}
          onPress={() => setActiveTab('allergies')}
        >
          <Text style={[styles.tabText, activeTab === 'allergies' && styles.activeTabText]}>
            Allergies ({allergies.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conditions' && styles.activeTab]}
          onPress={() => setActiveTab('conditions')}
        >
          <Text style={[styles.tabText, activeTab === 'conditions' && styles.activeTabText]}>
            Conditions ({conditions.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'allergies' ? (
          <>
            {allergies.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="alert-circle-outline" size={64} color="#CCC" />
                <Text style={styles.emptyStateText}>No allergies recorded</Text>
                <Text style={styles.emptyStateSubtext}>Tap + to add your allergies</Text>
              </View>
            ) : (
              allergies.map((allergy) => (
                <View key={allergy.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Icon name="alert-circle" size={20} color="#e74c3c" />
                      <Text style={styles.cardTitle}>{allergy.name}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => handleEditItem(allergy)} style={styles.actionBtn}>
                        <Icon name="pencil" size={18} color="#1E4B46" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteAllergy(allergy.id)} style={styles.actionBtn}>
                        <Icon name="delete" size={18} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Severity:</Text>
                      <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(allergy.severity) + '20' }]}>
                        <Text style={[styles.severityText, { color: getSeverityColor(allergy.severity) }]}>
                          {allergy.severity}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Effect:</Text>
                      <Text style={styles.infoValue}>{allergy.notes}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {conditions.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="medical-bag" size={64} color="#CCC" />
                <Text style={styles.emptyStateText}>No conditions recorded</Text>
                <Text style={styles.emptyStateSubtext}>Tap + to add your conditions</Text>
              </View>
            ) : (
              conditions.map((condition) => (
                <View key={condition.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.cardTitleRow}>
                      <Icon name="medical-bag" size={20} color="#3498db" />
                      <Text style={styles.cardTitle}>{condition.name}</Text>
                    </View>
                    <View style={styles.cardActions}>
                      <TouchableOpacity onPress={() => handleEditItem(condition)} style={styles.actionBtn}>
                        <Icon name="pencil" size={18} color="#1E4B46" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteCondition(condition.id)} style={styles.actionBtn}>
                        <Icon name="delete" size={18} color="#e74c3c" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.cardContent}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Diagnosed:</Text>
                      <Text style={styles.infoValue}>{condition.diagnosed}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Status:</Text>
                      <Text style={styles.infoValue}>{condition.status}</Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
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
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'allergies' ? 'Allergy' : 'Condition'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={activeTab === 'allergies' ? 'Allergy name (e.g., Peanuts)' : 'Condition name (e.g., Diabetes)'}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            {activeTab === 'allergies' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Severity (Mild/Moderate/Severe)"
                  value={formData.severity}
                  onChangeText={(text) => setFormData({ ...formData, severity: text })}
                />
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Effect (e.g., Skin rash, Difficulty breathing)"
                  value={formData.effect}
                  onChangeText={(text) => setFormData({ ...formData, effect: text })}
                  multiline
                  numberOfLines={3}
                />
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Year diagnosed (e.g., 2020)"
                  value={formData.diagnosed}
                  onChangeText={(text) => setFormData({ ...formData, diagnosed: text })}
                  keyboardType="numeric"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Current status (e.g., Under treatment)"
                  value={formData.status}
                  onChangeText={(text) => setFormData({ ...formData, status: text })}
                />
              </>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveItem}
              >
                <Text style={styles.saveButtonText}>{editingItem ? 'Update' : 'Add'}</Text>
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#1E4B46',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#1E4B46',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
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
  card: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
    marginLeft: 10,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  cardContent: {
    paddingLeft: 30,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
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
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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

export default AllergiesConditions;