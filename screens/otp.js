import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function OTPVerificationScreen({ setCurrentScreen, mobileNumber }) {
  const [otp, setOtp] = useState(['', '', '', '']);
  const inputRefs = useRef([]);

  // Format mobile number with country code
  const formattedNumber = mobileNumber ? `+91 ${mobileNumber}` : '+91 XXXXXXXXXX';

  const handleOtpChange = (value, index) => {
    // Only allow single digit
    if (value.length > 1) {
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto focus to next input
    if (value !== '' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    // Handle backspace to move to previous input
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 4) {
      Alert.alert(
        'Success!',
        `OTP verified successfully: ${otpCode}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to next screen or handle success
              Alert.alert('Welcome!', 'Your account has been verified successfully!');
              // You can navigate to home screen or dashboard here
              // setCurrentScreen('home');
            }
          }
        ]
      );
    } else {
      Alert.alert('Incomplete OTP', 'Please enter all 4 digits');
    }
  };

  const handleResendOtp = () => {
    Alert.alert(
      'OTP Resent',
      `A new OTP has been sent to ${formattedNumber}`,
      [{ text: 'OK' }]
    );
    setOtp(['', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setCurrentScreen('signup')}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <View style={styles.circle}>
          <MaterialCommunityIcons name="cellphone-message" size={80} color="#1E4B46" />
          <View style={styles.checkmark}>
            <MaterialCommunityIcons name="check" size={40} color="#fff" />
          </View>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>OTP Verification</Text>

      {/* Description */}
      <Text style={styles.description}>
        Enter the OTP sent to {'\n'}
        <Text style={styles.phoneNumber}>{formattedNumber}</Text>
      </Text>

      {/* OTP Input Fields */}
      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            style={[
              styles.otpInput,
              digit !== '' && styles.otpInputFilled
            ]}
            placeholder="-"
            placeholderTextColor="#ddd"
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="numeric"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      {/* Didn't receive OTP */}
      <View style={styles.resendContainer}>
        <Text style={styles.resendText}>Didn't receive the OTP?</Text>
        <TouchableOpacity onPress={handleResendOtp}>
          <Text style={styles.resendLink}>Resend OTP</Text>
        </TouchableOpacity>
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        style={[
          styles.verifyButton,
          otp.join('').length === 4 && styles.verifyButtonActive
        ]}
        onPress={handleVerify}
        activeOpacity={0.8}
      >
        <Text style={styles.verifyButtonText}>Verify</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  illustrationContainer: {
    marginBottom: 40,
    width: 150,
    height: 150,
  },
  circle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#e8f5f7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E4B46',
    borderStyle: 'dashed',
    position: 'relative',
  },
  checkmark: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  phoneNumber: {
    fontWeight: '700',
    color: '#1E4B46',
    fontSize: 16,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
    width: '100%',
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
    backgroundColor: '#fff',
  },
  otpInputFilled: {
    borderColor: '#1E4B46',
    backgroundColor: '#e8f5f7',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    gap: 4,
  },
  resendText: {
    fontSize: 14,
    color: '#666',
  },
  resendLink: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  verifyButton: {
    backgroundColor: '#1E4B46',
    borderRadius: 25,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
    opacity: 0.7,
  },
  verifyButtonActive: {
    opacity: 1,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});