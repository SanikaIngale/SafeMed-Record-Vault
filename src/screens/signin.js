import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

// IMPORTANT: Change this based on your setup
const getApiUrl = () => {
  // Expo Go on physical device requires laptop LAN IP
  return 'http://10.215.134.89:5000';
};


export default function SignInScreen({ navigation, route }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { setIsAuthenticated, setUserCredentials } = route.params || {};

  // Test connection function
  const testConnection = async () => {
    const apiUrl = getApiUrl();
    Alert.alert('Testing...', `Trying to connect to:\n${apiUrl}/api/health`);
    
    try {
      console.log('🔍 Testing connection to:', `${apiUrl}/api/health`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${apiUrl}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      console.log('✅ Connection successful:', data);
      
      Alert.alert(
        '✅ Connection Successful!',
        `Server Status: ${data.status}\n` +
        `Database: ${data.database}\n` +
        `Message: ${data.message}\n\n` +
        `You can now try signing in.`
      );
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      
      let errorMsg = `Failed to connect to:\n${apiUrl}\n\n`;
      
      if (error.name === 'AbortError') {
        errorMsg += 'Error: Connection timeout (server not responding)\n\n';
      } else {
        errorMsg += `Error: ${error.message}\n\n`;
      }
      
      errorMsg += 'Troubleshooting:\n';
      errorMsg += '1. Is your backend running? (node server.js)\n';
      errorMsg += '2. Check your device type:\n';
      
      if (Platform.OS === 'android') {
        errorMsg += '   • Emulator: Use 10.0.2.2:5000\n';
        errorMsg += '   • Physical: Use 192.168.29.145:5000\n';
      } else {
        errorMsg += '   • Simulator: Use localhost:5000\n';
        errorMsg += '   • Physical: Use 192.168.29.145:5000\n';
      }
      
      errorMsg += '3. Same WiFi network (for physical devices)\n';
      errorMsg += '4. Check firewall settings';
      
      Alert.alert('❌ Connection Failed', errorMsg);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const apiUrl = getApiUrl();
      const endpoint = `${apiUrl}/api/signin`;
      
      console.log('🔗 Platform:', Platform.OS);
      console.log('🔗 API URL:', apiUrl);
      console.log('🔗 Connecting to:', endpoint);
      console.log('📤 Email:', email.toLowerCase());
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password: password,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('📡 Response status:', response.status);

      const data = await response.json();
      console.log('📦 Response data:', data);

      if (response.ok && data.success) {
        // Check if user needs to change password
        if (data.user.requiresPasswordChange) {
          Alert.alert(
            '🔐 Password Change Required',
            'This is a temporary password. Please set a new password for security.',
            [
              {
                text: 'Change Password',
                onPress: () => {
                  AsyncStorage.setItem('tempToken', data.token);
                  navigation.navigate('ChangePassword', {
                    userId: data.user.id,
                    email: data.user.email,
                    isFirstTime: true,
                  });
                },
              },
            ],
            { cancelable: false }
          );
          return;
        }

        // ✅ IMPORTANT: Save user data to AsyncStorage
        await AsyncStorage.setItem('userToken', data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(data.user));
        
        // ✅ NEW: Save email and patient_id for HomePage to use
        await AsyncStorage.setItem('userEmail', email.toLowerCase());
        if (data.user.patient_id) {
          await AsyncStorage.setItem('patient_id', data.user.patient_id);
        }

        console.log('✅ Saved to AsyncStorage:', {
          email: email.toLowerCase(),
          patient_id: data.user.patient_id,
        });

        if (setUserCredentials) {
          setUserCredentials({
            email: data.user.email,
            userId: data.user.id,
            name: data.user.name,
            patientId: data.user.patient_id,
          });
        }
        
        if (setIsAuthenticated) {
          setIsAuthenticated(true);
        }

        Alert.alert('Success', 'Login successful!', [
          {
            text: 'OK',
            onPress: () => navigation.replace('Homepage'),
          },
        ]);
      } else if (response.status === 401) {
        if (data.message === 'Invalid email or password') {
          Alert.alert(
            'Login Failed',
            'Invalid email or password. Please check your credentials and try again.',
            [
              {
                text: 'OK',
                style: 'cancel',
              },
              {
                text: 'Forgot Password?',
                onPress: () => navigation.navigate('ForgotPassword', { email }),
              },
            ]
          );
        } else {
          Alert.alert('Sign In Failed', data.message || 'Invalid credentials.');
        }
      } else if (response.status === 404) {
        Alert.alert(
          'Account Not Found',
          'No account exists with this email. Would you like to sign up?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Sign Up',
              onPress: () => navigation.navigate('SignUp', { 
                userCredentials: { email } 
              }),
            },
          ]
        );
      } else {
        Alert.alert('Sign In Failed', data.message || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      
      let errorTitle = 'Connection Error';
      let errorMessage = '';
      
      if (error.name === 'AbortError') {
        errorTitle = 'Timeout Error';
        errorMessage = 'Server took too long to respond.\n\n';
      } else if (error.message.includes('Network request failed')) {
        errorTitle = 'Network Error';
        errorMessage = 'Cannot reach the server.\n\n';
      }
      
      errorMessage += 'Current API URL:\n' + getApiUrl() + '\n\n';
      errorMessage += 'Please check:\n';
      errorMessage += '1. Backend is running (node server.js)\n';
      errorMessage += '2. Check device type:\n';
      
      if (Platform.OS === 'android') {
        errorMessage += '   • Android Emulator → 10.0.2.2\n';
        errorMessage += '   • Physical Device → 192.168.29.145\n';
      } else {
        errorMessage += '   • iOS Simulator → localhost\n';
        errorMessage += '   • Physical Device → 192.168.29.145\n';
      }
      
      errorMessage += '3. Same WiFi (physical devices)\n';
      errorMessage += '4. Firewall/antivirus not blocking\n\n';
      errorMessage += 'Tap the WiFi icon to test connection.';
      
      Alert.alert(errorTitle, errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (email) {
      navigation.navigate('ForgotPassword', { email });
    } else {
      Alert.alert(
        'Enter Email',
        'Please enter your email address first to reset your password.'
      );
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sign In</Text>
        <TouchableOpacity 
          onPress={testConnection}
          style={styles.wifiButton}
        >
          {/* <MaterialCommunityIcons name="wifi-check" size={24} color="#1E4B46" /> */}
        </TouchableOpacity>
      </View>

      {/* API URL Display */}
      {/* <View style={styles.apiUrlContainer}>
        <Text style={styles.apiUrlLabel}>API: </Text>
        <Text style={styles.apiUrlText}>{getApiUrl()}</Text>
      </View> */}

      <View style={styles.formContainer}>
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
          <MaterialCommunityIcons name="lock-outline" size={20} color="#999" style={styles.inputIcon} />
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
              color="#999"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleForgotPassword} disabled={loading}>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.signInButton, loading && styles.signInButtonDisabled]}
          onPress={handleSignIn}
          activeOpacity={0.8}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.signInButtonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        <View style={styles.signUpContainer}>
          <Text style={styles.signUpText}>Don't have an account? </Text>
          <TouchableOpacity 
            onPress={() => navigation.navigate('SignUp')}
            disabled={loading}
          >
            <Text style={styles.signUpLink}>Sign up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E4B46',
  },
  wifiButton: {
    padding: 5,
  },
  apiUrlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  apiUrlLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  apiUrlText: {
    fontSize: 12,
    color: '#1E4B46',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 30,
    paddingTop: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  forgotPassword: {
    color: '#1E4B46',
    fontSize: 14,
    textAlign: 'right',
    marginBottom: 30,
    fontWeight: '500',
  },
  signInButton: {
    backgroundColor: '#1E4B46',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  signInButtonDisabled: {
    backgroundColor: '#9FB8B5',
  },
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signUpText: {
    color: '#666',
    fontSize: 14,
  },
  signUpLink: {
    color: '#1E4B46',
    fontSize: 14,
    fontWeight: '600',
  },
});