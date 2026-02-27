import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { API_URL, apiCall } from '../config/api';

const EditPersonalInfo = ({ navigation }) => {
  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const genders = ['Male', 'Female', 'Other'];

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [patientId, setPatientId] = useState(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    bloodGroup: '',
    height: '',
    weight: '',
    gender: '',
  });

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    fetchDemographics();
  }, []);

  const fetchDemographics = async () => {
  try {
    setLoading(true);

    const patId = await AsyncStorage.getItem('patient_id');
    const userEmail = await AsyncStorage.getItem('userEmail');

    if (!patId) {
      Alert.alert('Error', 'Patient ID not found');
      navigation.goBack();
      return;
    }

    setPatientId(patId);

    const apiUrl = API_URL;

    // Fetch patient basic info (patients table)
    const patientResponse = await fetch(
      `${apiUrl}/api/patients/${patId}`
    );
    const patientData = await patientResponse.json();

    if (!patientData || patientData.success === false) {
      Alert.alert('Error', 'Failed to fetch patient data');
      setLoading(false);
      return;
    }

    // Fetch user info (users table) to get phone number
    const userResponse = await fetch(
      `${apiUrl}/api/user/email/${userEmail}`
    );
    const userData = await userResponse.json();

    if (!userData || userData.success === false) {
      Alert.alert('Error', 'Failed to fetch user details');
      setLoading(false);
      return;
    }

    // Fetch demographics
    const demographicsResponse = await fetch(
      `${apiUrl}/api/patients/${patId}/demographics`
    );
    const demographicsData = await demographicsResponse.json();

    const demographics = demographicsData.success
      ? demographicsData.demographics
      : {};

    const formattedDate = demographics.dob
      ? new Date(demographics.dob).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : '';

    setFormData({
      fullName: patientData.name || '',
      email: userEmail || '',
      phone: userData.mobileNumber || '',
      dateOfBirth: formattedDate,
      bloodGroup: demographics.bloodType || '',
      height: demographics.height?.toString() || '',
      weight: demographics.weight?.toString() || '',
      gender: demographics.gender || '',
    });

    if (demographics.dob) {
      setSelectedDate(new Date(demographics.dob));
    }

    setLoading(false);
  } catch (error) {
    console.error('Error fetching demographics:', error);
    Alert.alert('Error', 'Failed to load your information');
    setLoading(false);
  }
};


  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setSelectedDate(selectedDate);
      setFormData({ ...formData, dateOfBirth: formatDate(selectedDate) });
    }
  };

  const validateInputs = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('Missing Field', 'Please enter your full name');
      return false;
    }
    if (!formData.email.trim()) {
      Alert.alert('Missing Field', 'Please enter your email');
      return false;
    }
    if (!formData.phone.trim()) {
      Alert.alert('Missing Field', 'Please enter your phone number');
      return false;
    }
    if (!formData.dateOfBirth.trim()) {
      Alert.alert('Missing Field', 'Please select your date of birth');
      return false;
    }
    if (!formData.bloodGroup.trim()) {
      Alert.alert('Missing Field', 'Please select your blood group');
      return false;
    }
    if (!formData.gender.trim()) {
      Alert.alert('Missing Field', 'Please select your gender');
      return false;
    }
    if (!formData.height.trim()) {
      Alert.alert('Missing Field', 'Please enter your height');
      return false;
    }
    if (!formData.weight.trim()) {
      Alert.alert('Missing Field', 'Please enter your weight');
      return false;
    }
    if (isNaN(formData.height) || isNaN(formData.weight)) {
      Alert.alert('Invalid Input', 'Height and weight must be numbers');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateInputs()) return;

    setSaving(true);
    try {
      const apiUrl = API_URL;
      
      const updateData = {
        email: formData.email,
        name: formData.fullName,
        dob: selectedDate.toISOString().split('T')[0],
        gender: formData.gender,
        bloodType: formData.bloodGroup,
        height: parseFloat(formData.height),
        weight: parseFloat(formData.weight),
      };

      const response = await fetch(`${apiUrl}/api/patient/demographics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Personal information updated successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        Alert.alert('Error', data.message || 'Failed to update information');
      }
    } catch (error) {
      console.error('Error saving demographics:', error);
      Alert.alert('Connection Error', 'Unable to save information. Please check your connection and try again.');
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
          <Text style={styles.headerTitle}>Edit Personal Info</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.headerTitle}>Edit Personal Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Enter your full name"
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            editable={false}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => setShowDatePicker(true)}
          >
            <Icon name="calendar" size={20} color="#1E4B46" style={styles.dateIcon} />
            <Text style={styles.dateText}>{formData.dateOfBirth || 'Select date'}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.dropdownContainer}>
            {genders.map((gen) => (
              <TouchableOpacity
                key={gen}
                style={[
                  styles.dropdownOption,
                  formData.gender === gen && styles.dropdownOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, gender: gen })}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  formData.gender === gen && styles.dropdownOptionTextSelected,
                ]}>
                  {gen}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Group</Text>
          <View style={styles.dropdownContainer}>
            {bloodTypes.map((blood) => (
              <TouchableOpacity
                key={blood}
                style={[
                  styles.dropdownOption,
                  formData.bloodGroup === blood && styles.dropdownOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, bloodGroup: blood })}
              >
                <Text style={[
                  styles.dropdownOptionText,
                  formData.bloodGroup === blood && styles.dropdownOptionTextSelected,
                ]}>
                  {blood}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput
              style={styles.input}
              value={formData.height}
              onChangeText={(text) => setFormData({ ...formData, height: text })}
              placeholder="Height"
              keyboardType="numeric"
            />
          </View>

          <View style={[styles.inputGroup, styles.halfWidth]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput
              style={styles.input}
              value={formData.weight}
              onChangeText={(text) => setFormData({ ...formData, weight: text })}
              placeholder="Weight"
              keyboardType="numeric"
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#999',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIcon: {
    marginRight: 10,
  },
  dateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dropdownOption: {
    width: '32%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: '#1E4B46',
    borderColor: '#1E4B46',
  },
  dropdownOptionText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#fff',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#1E4B46',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginVertical: 30,
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

export default EditPersonalInfo;