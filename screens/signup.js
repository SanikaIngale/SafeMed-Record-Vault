import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function SignUpScreen({ setCurrentScreen, userCredentials }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Pre-fill email if coming from signin
  useEffect(() => {
    if (userCredentials && userCredentials.email) {
      setEmail(userCredentials.email);
    }
  }, [userCredentials]);

  const handleSignUp = () => {
    // Check if all fields are filled
    if (!name || !email || !mobileNumber || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    // Check terms agreement
    if (!agreedToTerms) {
      Alert.alert('Terms Required', 'Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    // Validate mobile number (basic check for 10 digits)
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(mobileNumber.replace(/[\s-]/g, ''))) {
      Alert.alert('Invalid Mobile', 'Please enter a valid 10-digit mobile number');
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long');
      return;
    }

    // Check if email and password match the signin credentials
    if (userCredentials && userCredentials.email && userCredentials.password) {
      if (email === userCredentials.email && password === userCredentials.password) {
        // Credentials match, proceed to OTP
        Alert.alert(
          'Success!', 
          `Account created for ${name}. Please verify your mobile number.`,
          [
            {
              text: 'Continue',
              onPress: () => setCurrentScreen('otp')
            }
          ]
        );
      } else {
        // Credentials don't match
        Alert.alert(
          'Credentials Mismatch',
          'Email or password does not match your sign-in credentials. Please use the same email and password.',
          [{ text: 'OK' }]
        );
      }
    } else {
      // No signin credentials available, still proceed (optional flow)
      Alert.alert(
        'Success!', 
        `Account created for ${name}. Please verify your mobile number.`,
        [
          {
            text: 'Continue',
            onPress: () => setCurrentScreen('otp')
          }
        ]
      );
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
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('signin')}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign Up</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Form Container */}
      <View style={styles.formContainer}>
        
        {/* Name Input */}
        <View style={styles.inputWrapper}>
          <MaterialCommunityIcons name="account-outline" size={20} color="#999" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Email Input */}
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
          />
        </View>

        {/* Mobile Number Input */}
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
          />
        </View>

        {/* Password Input - Highlighted */}
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
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <MaterialCommunityIcons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#0066cc"
            />
          </TouchableOpacity>
        </View>

        {/* Password hint if credentials provided */}
        {userCredentials && userCredentials.email && (
          <Text style={styles.hintText}>
            💡 Use the same password you entered during sign-in
          </Text>
        )}

        {/* Terms Agreement */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => setAgreedToTerms(!agreedToTerms)}
          >
            <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxBoxChecked]}>
              {agreedToTerms && (
                <MaterialCommunityIcons name="check" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <View style={styles.termsTextContainer}>
            <Text style={styles.termsText}>I agree to the healthcare </Text>
            <TouchableOpacity onPress={handleTermsPress}>
              <Text style={styles.termsLink}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.termsText}> and </Text>
            <TouchableOpacity onPress={handlePrivacyPress}>
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sign Up Button */}
        <TouchableOpacity
          style={styles.signUpButton}
          onPress={handleSignUp}
          activeOpacity={0.8}
        >
          <Text style={styles.signUpButtonText}>Sign Up</Text>
        </TouchableOpacity>

        {/* Sign In Link */}
        <View style={styles.signInLinkContainer}>
          <Text style={styles.signInText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => setCurrentScreen('signin')}>
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