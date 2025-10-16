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
import { MaterialCommunityIcons as Icon, Ionicons } from '@expo/vector-icons';

const AllergiesConditions = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('allergies');
  const [modalVisible, setModalVisible] = useState(false);
  const [itemText, setItemText] = useState('');

  const [allergies, setAllergies] = useState([
    { id: 1, name: 'Peanuts', severity: 'Severe', notes: 'Anaphylactic reaction' },
    { id: 2, name: 'Penicillin', severity: 'Moderate', notes: 'Skin rash' },
    { id: 3, name: 'Dust mites', severity: 'Mild', notes: 'Sneezing, runny nose' },
  ]);

  const [conditions, setConditions] = useState([
    { id: 1, name: 'Asthma', diagnosed: '2018', status: 'Controlled' },
    { id: 2, name: 'Hypertension', diagnosed: '2020', status: 'Under treatment' },
  ]);

  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    severity: '',
    notes: '',
    diagnosed: '',
    status: '',
  });

  const handleAddItem = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      severity: '',
      notes: '',
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
        notes: item.notes,
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
          a.id === editingItem.id ? { ...editingItem, ...formData } : a
        ));
      } else {
        setAllergies([...allergies, { id: Date.now(), ...formData }]);
      }
    } else {
      if (!formData.diagnosed || !formData.status) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
      if (editingItem) {
        setConditions(conditions.map(c =>
          c.id === editingItem.id ? { ...editingItem, ...formData } : c
        ));
      } else {
        setConditions([...conditions, { id: Date.now(), ...formData }]);
      }
    }
    setModalVisible(false);
  };

  const handleDeleteAllergy = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this allergy?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => setAllergies(allergies.filter(item => item.id !== id)),
      },
    ]);
  };

  const handleDeleteCondition = (id) => {
    Alert.alert('Confirm Delete', 'Are you sure you want to delete this condition?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        onPress: () => setConditions(conditions.filter(item => item.id !== id)),
      },
    ]);
  };

  const getSeverityColor = (severity) => {
    switch (severity.toLowerCase()) {
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
            Allergies
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'conditions' && styles.activeTab]}
          onPress={() => setActiveTab('conditions')}
        >
          <Text style={[styles.tabText, activeTab === 'conditions' && styles.activeTabText]}>
            Conditions
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'allergies' ? (
          <>
            {allergies.map((allergy) => (
              <View key={allergy.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Icon name="alert-circle" size={20} color="#e74c3c" />
                    <Text style={styles.cardTitle}>{allergy.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteAllergy(allergy.id)}>
                    <Icon name="delete" size={20} color="#e74c3c" />
                  </TouchableOpacity>
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
                    <Text style={styles.infoLabel}>Notes:</Text>
                    <Text style={styles.infoValue}>{allergy.notes}</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <>
            {conditions.map((condition) => (
              <View key={condition.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleRow}>
                    <Icon name="medical-bag" size={20} color="#3498db" />
                    <Text style={styles.cardTitle}>{condition.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleDeleteCondition(condition.id)}>
                    <Icon name="delete" size={20} color="#e74c3c" />
                  </TouchableOpacity>
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
            ))}
          </>
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
            <Text style={styles.modalTitle}>
              {editingItem ? 'Edit' : 'Add'} {activeTab === 'allergies' ? 'Allergy' : 'Condition'}
            </Text>

            <TextInput
              style={styles.input}
              placeholder={activeTab === 'allergies' ? 'Allergy name' : 'Condition name'}
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
                  placeholder="Notes"
                  value={formData.notes}
                  onChangeText={(text) => setFormData({ ...formData, notes: text })}
                  multiline
                  numberOfLines={3}
                />
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Year diagnosed"
                  value={formData.diagnosed}
                  onChangeText={(text) => setFormData({ ...formData, diagnosed: text })}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Current status"
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
    color: '#1E4B46',
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
    color: '#1E4B46',
    width: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#1E4B46',
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