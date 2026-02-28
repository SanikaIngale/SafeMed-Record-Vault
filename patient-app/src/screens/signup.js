import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { API_ENDPOINTS, apiCall } from '../config/api'; // ADD THIS IMPORT

export default function SignUpScreen({ navigation, route }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const { userCredentials, setIsAuthenticated } = route.params || {};

  useEffect(() => {
    if (userCredentials) {
      if (userCredentials.email) setEmail(userCredentials.email);
      if (userCredentials.password) setPassword(userCredentials.password);
    }
  }, [userCredentials]);

  const handleSignUp = async () => {
    if (!name || !email || !mobileNumber || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNumber.replace(/[\s-]/g, ''))) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      // UPDATED: Use API config
      const { response, data } = await apiCall(API_ENDPOINTS.SIGNUP, {
        method: 'POST',
        body: JSON.stringify({
          name: name,
          email: email.toLowerCase(),
          mobileNumber: mobileNumber,
          password: password,
        }),
      });

      if (response.ok && data.success) {
        // Account created successfully
        // Store token and user data
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        await AsyncStorage.setItem('isNewUser', 'true');
        await AsyncStorage.setItem('userEmail', email.toLowerCase());

        Alert.alert(
          'Success!',
          `Account created for ${name}. Let's complete your profile!`,
          [
            {
              text: 'Continue',
              onPress: () => {
                navigation.navigate('ProfileDetails', {
                  userId: data.user.id,
                  email: email.toLowerCase(),
                  name: name,
                  setIsAuthenticated,
                });
              },
            },
          ]
        );
      } else if (response.status === 400 && data.message.includes('already exists')) {
        // User already exists
        Alert.alert(
          'Account Exists',
          'An account with this email already exists. Please sign in.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Sign In',
              onPress: () => navigation.navigate('SignIn'),
            },
          ]
        );
      } else {
        Alert.alert('Sign Up Failed', data.message || 'Unable to create account. Please try again.');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Connection Error', 'Unable to connect to server. Please check your network connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTermsPress = () => {
    Alert.alert('Terms of Service', 'Healthcare Terms of Service would be displayed here.');
  };

  const handlePrivacyPress = () => {
    Alert.alert('Privacy Policy', 'Healthcare Privacy Policy would be displayed here.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="account-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="email-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            editable={!loading}
          />
        </View>

        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="phone-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your mobile number"
            placeholderTextColor="#999"
            value={mobileNumber}
            onChangeText={setMobileNumber}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
          />
        </View>

        <View style={[styles.inputWrapper, styles.passwordInputWrapper]}>
          <MaterialCommunityIcons name="lock-outline" size={20} color="#0066cc" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={loading}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#0066cc"
            />
          </TouchableOpacity>
        </View>

        {userCredentials && userCredentials.email && (
          <Text style={styles.hintText}>
            Use the same password you entered during sign-in
          </Text>
        )}

        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
            disabled={loading}
          >
            <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxBoxChecked]}>
              {agreedToTerms && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>I agree to the healthcare </Text>
            <TouchableOpacity onPress={handleTermsPress} disabled={loading}>
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity onPress={handlePrivacyPress} disabled={loading}>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
          onPress={handleSignUp}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signUpButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signInLinkContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('SignIn')}
            disabled={loading}
          >
            <Text style={styles.signInLink}>Sign In</Text>
          </TouchableOpacity>
        </View>
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
    marginBottom: 40,
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  headerSpacer: {
    width: 28,
  },
  formContainer: {
    paddingHorizontal: 24,
    flex: 1,
    justifyContent: 'flex-start',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordInputWrapper: {
    borderColor: '#0066cc',
    borderWidth: 2,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 8,
  },
  hintText: {
    fontSize: 12,
    color: '#0066cc',
    marginTop: -10,
    marginBottom: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 28,
    marginTop: 8,
  },
  checkbox: {
    marginRight: 12,
    marginTop: 2,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#1E4B46',
    borderColor: '#1E4B46',
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  termsText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  termsLink: {
    fontSize: 13,
    color: '#1E4B46',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  signUpButton: {
    backgroundColor: '#1E4B46',
    borderRadius: 25,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  signUpButtonDisabled: {
    backgroundColor: '#9FB8B5',
  },
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signInLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signInText: {
    fontSize: 14,
    color: '#666',
  },
  signInLink: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '600',
  },
});