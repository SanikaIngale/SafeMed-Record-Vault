import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { API_URL, apiCall } from '../config/api';

export default function ProfileDetailsScreen({ navigation, route }) {
  const { userId, email, name: initialName, setIsAuthenticated } = route.params || {};

  const [dateOfBirth, setDateOfBirth] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [gender, setGender] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [chronicConditions, setChronicConditions] = useState('');
  const [allergies, setAllergies] = useState('');
  const [loading, setLoading] = useState(false);

  const bloodTypes = ['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'];
  const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };

  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const validateInputs = () => {
    if (!gender.trim()) {
      Alert.alert('Missing Field', 'Please select your gender');
      return false;
    }
    if (!bloodType.trim()) {
      Alert.alert('Missing Field', 'Please select your blood type');
      return false;
    }
    if (!height.trim()) {
      Alert.alert('Missing Field', 'Please enter your height (in cm)');
      return false;
    }
    if (!weight.trim()) {
      Alert.alert('Missing Field', 'Please enter your weight (in kg)');
      return false;
    }
    if (isNaN(height) || isNaN(weight)) {
      Alert.alert('Invalid Input', 'Height and weight must be numbers');
      return false;
    }
    return true;
  };

  const handleSaveProfile = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    try {
      // Save demographics to patients table
      const demographicsData = {
        userId,
        email,
        name: initialName,
        dob: dateOfBirth.toISOString().split('T')[0],
        gender,
        bloodType,
        height: parseFloat(height),
        weight: parseFloat(weight),
        chronicConditions: chronicConditions.trim() || null,
        allergies: allergies.trim() || null,
      };

      const response = await fetch(`${API_URL}/api/patients/demographics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demographicsData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store demographics locally
        await AsyncStorage.setItem('userDemographics', JSON.stringify(demographicsData));
        await AsyncStorage.setItem('patient_id', data.patient_id || '');
        await AsyncStorage.setItem('isNewUser', 'false');

        Alert.alert(
          'Success!',
          'Your profile has been completed. Welcome to SafeMed!',
          [
            {
              text: 'Continue',
              onPress: async () => {
                // Must set authenticated BEFORE navigation.reset so Homepage is available
                if (setIsAuthenticated) setIsAuthenticated(true);
                
                // Allow state to update before resetting navigation
                setTimeout(() => {
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'Homepage' }],
                  });
                }, 100);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Connection Error', 'Unable to save profile. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Complete Your Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Personal Information</Text>
        <Text style={styles.subtitle}>These details help us provide better health insights</Text>

        {/* Date of Birth */}
        <View style={styles.fieldLabel}>
          <Text style={styles.label}>Date of Birth *</Text>
        </View>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialCommunityIcons name="calendar" size={20} color="#0066cc" />
          <Text style={styles.dateText}>{formatDate(dateOfBirth)}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={dateOfBirth}
            mode="date"
            display={Platform.OS === 'android' ? 'spinner' : 'spinner'}
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {/* Gender */}
        <View style={styles.fieldLabel}>
          <Text style={styles.label}>Gender *</Text>
        </View>
        <View style={styles.dropdownContainer}>
          {genders.map((g) => (
            <TouchableOpacity
              key={g}
              style={[
                styles.dropdownOption,
                gender === g && styles.dropdownOptionSelected,
              ]}
              onPress={() => setGender(g)}
            >
              <Text
                style={[
                  styles.dropdownOptionText,
                  gender === g && styles.dropdownOptionTextSelected,
                ]}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Blood Type */}
        <View style={styles.fieldLabel}>
          <Text style={styles.label}>Blood Type *</Text>
        </View>
        <View style={styles.bloodTypeContainer}>
          {bloodTypes.map((bt) => (
            <TouchableOpacity
              key={bt}
              style={[
                styles.bloodTypeButton,
                bloodType === bt && styles.bloodTypeButtonSelected,
              ]}
              onPress={() => setBloodType(bt)}
            >
              <Text
                style={[
                  styles.bloodTypeText,
                  bloodType === bt && styles.bloodTypeTextSelected,
                ]}
              >
                {bt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Height and Weight */}
        <View style={styles.rowContainer}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Height (cm) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 170"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Weight (kg) *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 65"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
        </View>

        {/* Chronic Conditions */}
        <View style={styles.fieldLabel}>
          <Text style={styles.label}>Chronic Conditions (Optional)</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g., Diabetes, Hypertension, Asthma"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          value={chronicConditions}
          onChangeText={setChronicConditions}
        />

        {/* Allergies */}
        <View style={styles.fieldLabel}>
          <Text style={styles.label}>Known Allergies (Optional)</Text>
        </View>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          placeholder="e.g., Penicillin, Nuts, Latex"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
          value={allergies}
          onChangeText={setAllergies}
        />

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveProfile}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Complete Profile</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.footerText}>
          * Mandatory fields. Your information is secure and will be used only for medical insights.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 20,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 28,
  },
  formContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E4B46',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  fieldLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  multilineInput: {
    textAlignVertical: 'top',
    paddingTop: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
  },
  dateText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  dropdownOption: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: '#1E4B46',
    borderColor: '#1E4B46',
  },
  dropdownOptionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  dropdownOptionTextSelected: {
    color: '#fff',
  },
  bloodTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  bloodTypeButton: {
    width: '22%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  bloodTypeButtonSelected: {
    backgroundColor: '#1E4B46',
    borderColor: '#1E4B46',
  },
  bloodTypeText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  bloodTypeTextSelected: {
    color: '#fff',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#1E4B46',
    borderRadius: 25,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonDisabled: {
    backgroundColor: '#9FB8B5',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
