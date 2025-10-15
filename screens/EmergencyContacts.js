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

const EmergencyContacts = ({ navigation }) => {
  const [contacts, setContacts] = useState([
    { id: 1, name: 'Rajesh Sharma', relation: 'Father', phone: '+91 98765 11111' },
    { id: 2, name: 'Priya Sharma', relation: 'Mother', phone: '+91 98765 22222' },
    { id: 3, name: 'Dr. Amit Patel', relation: 'Family Doctor', phone: '+91 98765 33333' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    relation: '',
    phone: '',
  });

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
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const handleSaveContact = () => {
    if (editingContact) {
      setContacts(contacts.map(contact =>
        contact.id === editingContact.id
          ? { ...contact, ...formData }
          : contact
      ));
    } else {
      setContacts([...contacts, { id: Date.now(), ...formData }]);
    }
    setModalVisible(false);
  };

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
        <Text style={styles.description}>
          Add trusted contacts who can be reached in case of emergency
        </Text>

        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactInfo}>
              <View style={styles.iconCircle}>
                <Icon name="account" size={24} color="#1E4B46" />
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactRelation}>{contact.relation}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
            </View>
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditContact(contact)}
              >
                <Icon name="pencil" size={20} color="#1E4B46" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteContact(contact.id)}
              >
                <Icon name="delete" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Add/Edit Contact Modal */}
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

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Relation"
              value={formData.relation}
              onChangeText={(text) => setFormData({ ...formData, relation: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
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
                onPress={handleSaveContact}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  contactCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 4,
  },
  contactRelation: {
    fontSize: 14,
    color: '#1E4B46',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#1E4B46',
  },
  contactActions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    padding: 8,
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

export default EmergencyContacts;