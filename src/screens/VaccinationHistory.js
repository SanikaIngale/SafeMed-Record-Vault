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
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const VaccinationHistory = ({ navigation }) => {
  const [vaccinations, setVaccinations] = useState([
    {
      id: 1,
      name: 'COVID-19 (Pfizer)',
      date: '15/03/2024',
      location: 'City Hospital',
      doseNumber: 'Booster',
      nextDue: 'N/A',
    },
    {
      id: 2,
      name: 'Influenza',
      date: '10/10/2023',
      location: 'Community Health Center',
      doseNumber: 'Annual',
      nextDue: '10/10/2024',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingVac, setEditingVac] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    location: '',
    doseNumber: '',
    nextDue: '',
  });

  const handleAddVaccination = () => {
    setEditingVac(null);
    setFormData({
      name: '',
      date: '',
      location: '',
      doseNumber: '',
      nextDue: '',
    });
    setModalVisible(true);
  };

  const handleEditVaccination = (vac) => {
    setEditingVac(vac);
    setFormData({ ...vac });
    setModalVisible(true);
  };

  const handleDeleteVaccination = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this vaccination record?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => setVaccinations(vaccinations.filter(vac => vac.id !== id)),
      },
    ]);
  };

  const handleSaveVaccination = () => {
    if (!formData.name || !formData.date) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (editingVac) {
      setVaccinations(vaccinations.map(vac =>
        vac.id === editingVac.id ? { ...editingVac, ...formData } : vac
      ));
    } else {
      setVaccinations([...vaccinations, { id: Date.now(), ...formData }]);
    }
    setModalVisible(false);
  };

  const isUpcoming = (date) => {
    if (date === 'N/A') return false;
    const nextDue = new Date(date.split('/').reverse().join('-'));
    const today = new Date();
    const diffTime = nextDue - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 90;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vaccination History</Text>
        <TouchableOpacity onPress={handleAddVaccination}>
          <Icon name="plus" size={24} color="#1E4B46" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{vaccinations.length}</Text>
            <Text style={styles.summaryLabel}>Total Vaccines</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>
              {vaccinations.filter(v => isUpcoming(v.nextDue)).length}
            </Text>
            <Text style={styles.summaryLabel}>Upcoming</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Vaccination Records</Text>

        {vaccinations.map((vaccination) => (
          <View key={vaccination.id} style={styles.vaccinationCard}>
            <View style={styles.cardHeader}>
              <View style={styles.vaccineIcon}>
                <Icon name="needle" size={24} color="#fff" />
              </View>
              <View style={styles.vaccinationInfo}>
                <Text style={styles.vaccinationName}>{vaccination.name}</Text>
                <View style={styles.dateRow}>
                  <Icon name="calendar" size={14} color="#666" />
                  <Text style={styles.date}>{vaccination.date}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => handleDeleteVaccination(vaccination.id)}>
                <Icon name="delete" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Icon name="hospital-building" size={16} color="#666" />
                <Text style={styles.detailText}>{vaccination.location}</Text>
              </View>
              <View style={styles.detailRow}>
                <Icon name="counter" size={16} color="#666" />
                <Text style={styles.detailText}>Dose: {vaccination.doseNumber}</Text>
              </View>
              {vaccination.nextDue !== 'N/A' && (
                <View style={styles.nextDueContainer}>
                  <Icon name="clock-outline" size={16} color="#1E4B46" />
                  <Text style={styles.nextDueText}>
                    Next due: {vaccination.nextDue}
                  </Text>
                  {isUpcoming(vaccination.nextDue) && (
                    <View style={styles.upcomingBadge}>
                      <Text style={styles.upcomingText}>Upcoming</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        ))}
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
                {editingVac ? 'Edit Vaccination' : 'Add Vaccination Record'}
              </Text>

              <TextInput
                style={styles.input}
                placeholder="Vaccine Name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Date Administered (DD/MM/YYYY)"
                value={formData.date}
                onChangeText={(text) => setFormData({ ...formData, date: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Location/Facility"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Dose Number (e.g., 1st, 2nd, Booster)"
                value={formData.doseNumber}
                onChangeText={(text) => setFormData({ ...formData, doseNumber: text })}
              />

              <TextInput
                style={styles.input}
                placeholder="Next Due Date (DD/MM/YYYY or N/A)"
                value={formData.nextDue}
                onChangeText={(text) => setFormData({ ...formData, nextDue: text })}
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
                  onPress={handleSaveVaccination}
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
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E4B46',
    marginBottom: 5,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#1E4B46',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 15,
  },
  vaccinationCard: {
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
    alignItems: 'center',
    marginBottom: 15,
  },
  vaccineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1E4B46',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  vaccinationInfo: {
    flex: 1,
  },
  vaccinationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#1E4B46',
    marginLeft: 5,
  },
  detailsContainer: {
    paddingLeft: 60,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#1E4B46',
    marginLeft: 8,
  },
  nextDueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5f3',
    padding: 10,
    borderRadius: 8,
    marginTop: 5,
  },
  nextDueText: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  upcomingBadge: {
    backgroundColor: '#f39c12',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  upcomingText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
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

export default VaccinationHistory;