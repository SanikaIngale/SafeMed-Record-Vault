import {
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
  useFonts,
} from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';

const API_BASE_URL = 'http://10.164.220.89:5000/api';

const ConsultationCard = ({ consultation, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardContent}>
      <Text style={styles.clinicLabel}>{consultation.hospital}</Text>
      <Text style={styles.cardLabel}>
        Doctor: <Text style={styles.cardValue}>{consultation.doctor.name}</Text>
      </Text>
      <Text style={styles.cardLabel}>
        Reason: <Text style={styles.cardValue}>{consultation.reason_for_visit}</Text>
      </Text>
      <View style={styles.dateRow}>
        <Text style={styles.cardLabel}>
          Date: <Text style={styles.cardValue}>{consultation.date}</Text>
        </Text>
        <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

const ConsultationHistoryScreen = ({ navigation }) => {
  const [activeNav, setActiveNav] = useState('Home');
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    loadConsultations();
  }, []);

  const loadConsultations = async () => {
    try {
      setLoading(true);

      // Get user email from AsyncStorage
      const email = await AsyncStorage.getItem('userEmail');
      
      if (!email) {
        Alert.alert('Error', 'Please login again');
        navigation.replace('SignIn');
        return;
      }

      // Step 1: Get patient_id from users table
      const userResponse = await fetch(`${API_BASE_URL}/user/email/${email}`);
      const userData = await userResponse.json();

      if (!userData.success) {
        throw new Error('Failed to fetch user data');
      }

      const patientId = userData.patient_id;

      // Step 2: Get patient data including consultations
      const patientResponse = await fetch(`${API_BASE_URL}/patients/${patientId}`);
      const patientData = await patientResponse.json();

      if (patientData.success) {
        setConsultations(patientData.consultations || []);
        console.log('✅ Consultations loaded:', patientData.consultations?.length || 0);
      }

    } catch (error) {
      console.error('❌ Error loading consultations:', error);
      Alert.alert('Error', 'Failed to load consultation history. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConsultations();
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleViewDetails = (consultation) => {
    navigation.navigate('VisitSummary', { consultation });
  };

  const handleNavigation = (navName) => {
    setActiveNav(navName);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Consultation History</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={styles.loadingText}>Loading consultations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Consultation History</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E4B46']} />
        }
      >
        {consultations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="clipboard-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No consultation records yet</Text>
            <Text style={styles.emptySubtext}>Your consultation history will appear here</Text>
          </View>
        ) : (
          consultations.map((consultation) => (
            <ConsultationCard
              key={consultation.consultation_id}
              consultation={consultation}
              onPress={() => handleViewDetails(consultation)}
            />
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <BottomNavigation 
        activeNav={activeNav} 
        onNavigate={handleNavigation}
        navigation={navigation}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 55,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e4b46',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clinicLabel: {
    fontSize: 17,
    color: '#1e4b46',
    fontWeight: '700',
    marginBottom: 8,
  },
  cardContent: {},
  cardLabel: {
    fontSize: 15,
    color: '#1e4b46',
    fontWeight: '600',
    marginBottom: 8,
    flex: 1,
  },
  cardValue: {
    fontWeight: '400',
    color: '#1e4b46',
  },
  detailsButton: {
    backgroundColor: '#1e4b46',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 15,
    marginLeft: 10,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default ConsultationHistoryScreen;