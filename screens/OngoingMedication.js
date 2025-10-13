import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const OngoingMedication = ({ navigation }) => {
  const [medications, setMedications] = useState([
    {
      id: 1,
      name: 'Lisinopril 10mg',
      purpose: 'Blood pressure control',
      dosage: '1 tablet',
      frequency: 'Once daily',
      time: 'Morning',
      startDate: '01/01/2024',
    },
    {
      id: 2,
      name: 'Metformin 500mg',
      purpose: 'Diabetes management',
      dosage: '2 tablets',
      frequency: 'Twice daily',
      time: 'After meals',
      startDate: '15/02/2024',
    },
    {
      id: 3,
      name: 'Albuterol Inhaler',
      purpose: 'Asthma relief',
      dosage: '2 puffs',
      frequency: 'As needed',
      time: 'When required',
      startDate: '10/03/2024',
    },
  ]);

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
    setMedications(medications.filter(med => med.id !== id));
  };

  const handleSaveMedication = () => {
    if (editingMed) {
      setMedications(medications.map(med =>
        med.id === editingMed.id ? { ...med, ...formData } : med
      ));
    } else {
      setMedications([...medications, { id: Date.now(), ...formData }]);
    }
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ongoing Medication</Text>
        <TouchableOpacity onPress={handleAddMedication}>
          <Icon name="plus" size={24} color="#2d7a6e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Keep track of your current medications and dosage schedules
        </Text>

        {medications.map((med) => (
          <View key={med.id} style={styles.medicationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrapper}>
                <Icon name="pill" size={24} color="#2d7a6e" />
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
                  <Icon name="pencil" size={18} color="#2d7a6e" />
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
        ))}
      </ScrollView>

      {/* Add/Edit Medication Modal */}
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
                placeholder="Medication Name"
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
                placeholder="Dosage (e.g., 1 tablet, 2 puffs)"
                value={formData.dosage}
                onChangeText={(text) => setFormData({ ...formData, dosage: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Frequency (e.g., Once daily)"
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
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
    color: '#333',
    marginBottom: 4,
  },
  purpose: {
    fontSize: 14,
    color: '#666',
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
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
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
    color: '#333',
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
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2d7a6e',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OngoingMedication;