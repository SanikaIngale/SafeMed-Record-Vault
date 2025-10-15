import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Share,
  Image,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

const QRCodeScreen = ({ navigation }) => {
  const userQRData = JSON.stringify({
    id: 'USER12345',
    name: 'Ruchita Sharma',
    bloodGroup: 'O+',
    emergencyContact: '+91 98765 11111',
  });

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(userQRData)}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'My Medical QR Code - ID: USER12345\n' + userQRData,
        title: 'My Medical QR Code',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share QR Code');
    }
  };

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

      <View style={styles.content}>
        <Text style={styles.description}>
          Share this QR code with healthcare providers for quick access to your
          medical information
        </Text>

        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <Image
              source={{ uri: qrCodeUrl }}
              style={styles.qrImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.userId}>ID: USER12345</Text>
        </View>

        <View style={styles.infoBox}>
          <Icon name="information" size={20} color="#2d7a6e" />
          <Text style={styles.infoText}>
            This QR code contains your basic medical information and emergency
            contacts. Keep it handy for emergencies.
          </Text>
        </View>

        <TouchableOpacity style={styles.downloadButton} onPress={handleShare}>
          <Icon name="share" size={20} color="#fff" />
          <Text style={styles.downloadButtonText}>Share QR Code</Text>
        </TouchableOpacity>
      </View>
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
    paddingTop: 30,
    alignItems: 'center',
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
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f5f3',
    padding: 15,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
  },
  infoText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E4B46',
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#1E4B46',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: 'center',
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default QRCodeScreen;