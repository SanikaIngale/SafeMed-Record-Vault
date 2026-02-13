import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QRCodeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [error, setError] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      fetchQRCode();
    }, [])
  );

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get patient ID from AsyncStorage
      const patId = await AsyncStorage.getItem('patient_id');
      if (!patId) {
        setError('Patient ID not found. Please log in again.');
        setLoading(false);
        return;
      }

      setPatientId(patId);

      const apiUrl = Platform.OS === 'android' ? 'http://10.164.220.89:5000' : 'http://localhost:5000';

      // Always regenerate QR code to get latest patient data
      // This ensures the QR code updates when profile information changes
      const generateResponse = await fetch(`${apiUrl}/api/qr-codes/${patId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!generateResponse.ok) {
        throw new Error('Failed to generate QR code');
      }

      const qrResult = await generateResponse.json();

      if (qrResult.success && qrResult.qr_data) {
        setQrData(qrResult.qr_data);
      } else {
        throw new Error('Failed to fetch QR code data');
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setError('Failed to load QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodeUrl = () => {
    if (!qrData) return '';
    const qrString = JSON.stringify(qrData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`;
  };

  const handleShare = async () => {
    try {
      if (!qrData) {
        Alert.alert('Error', 'QR code data not available');
        return;
      }
      const qrString = JSON.stringify(qrData);
      await Share.share({
        message: `Medical QR Code - Patient ID: ${patientId}\n${qrString}`,
        title: 'My Medical QR Code',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR Code');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My QR Code</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Generating QR Code...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My QR Code</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <Icon name="alert-circle" size={60} color="#d32f2f" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchQRCode}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>My QR Code</Text>
        <TouchableOpacity onPress={handleShare}>
          <Icon name="share-variant" size={24} color="#1E4B46" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Share this QR code with healthcare providers for quick access to your
          medical information
        </Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <Image
              source={{ uri: generateQRCodeUrl() }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.userId}>ID: {patientId}</Text>
          {qrData?.name && <Text style={styles.userName}>{qrData.name}</Text>}
        </View>

        <View style={styles.infoBox}>
          <Icon name="information" size={20} color="#2d7a6e" />
          <Text style={styles.infoText}>
            This QR code contains your medical information including blood type,
            allergies, conditions, and emergency contacts.
          </Text>
        </View>

        
        <TouchableOpacity style={styles.downloadButton} onPress={handleShare}>
          <Icon name="share" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Share QR Code</Text>
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
    paddingTop: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#1E4B46',
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#1E4B46',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#1E4B46',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  qrWrapper: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  qrImage: {
    width: 250,
    height: 250,
  },
  userId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
    marginTop: 20,
  },
  userName: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f5f3',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13,
    color: '#1E4B46',
    lineHeight: 18,
  },
  dataBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#1E4B46',
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dataLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  dataValue: {
    fontSize: 13,
    color: '#1E4B46',
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#1E4B46',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 30,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default QRCodeScreen;