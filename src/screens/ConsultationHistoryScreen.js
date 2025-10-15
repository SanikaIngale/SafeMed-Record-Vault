import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

const consultations = [
  {
    id: '1',
    date: '05 July 25',
    doctor: 'Dr. Anya Sharma',
    clinic: 'General Hospital',
    reason: 'General Checkup',
  },
  {
    id: '2',
    date: '12 June 25',
    doctor: 'Dr. Anya Sharma',
    clinic: 'General Hospital',
    reason: 'Follow-up Visit',
  },
  {
    id: '3',
    date: '28 May 25',
    doctor: 'Dr. Priya Verma',
    clinic: 'Apollo Clinic',
    reason: 'Blood Pressure Check',
  },
  {
    id: '4',
    date: '10 May 25',
    doctor: 'Dr. Anya Sharma',
    clinic: 'General Hospital',
    reason: 'Consultation',
  },
];

const ConsultationCard = ({ consultation, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress}>
    <View style={styles.cardContent}>
      <Text style={styles.clinicLabel}>{consultation.clinic}</Text>
      <Text style={styles.cardLabel}>
        Doctor: <Text style={styles.cardValue}>{consultation.doctor}</Text>
      </Text>
      <Text style={styles.cardLabel}>
        Reason: <Text style={styles.cardValue}>{consultation.reason}</Text>
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
  let [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleViewDetails = (consultation) => {
    navigation.navigate('VisitSummary', { consultation });
  };

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
      >
        {consultations.map((consultation) => (
          <ConsultationCard
            key={consultation.id}
            consultation={consultation}
            onPress={() => handleViewDetails(consultation)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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