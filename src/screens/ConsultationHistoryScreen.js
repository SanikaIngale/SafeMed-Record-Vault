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
import { 
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
  Poppins_700Bold 
} from '@expo-google-fonts/poppins';

// Mock data
const consultations = [
  { id: '1', date: '05 July 25', doctor: 'Dr. Anya Sharma', clinic: 'General Hospital' },
  { id: '2', date: '05 July 25', doctor: 'Dr. Anya Sharma', clinic: 'General Hospital' },
  { id: '3', date: '05 July 25', doctor: 'Dr. Anya Sharma', clinic: 'General Hospital' },
  { id: '4', date: '05 July 25', doctor: 'Dr. Anya Sharma', clinic: 'General Hospital' },
  { id: '5', date: '05 July 25', doctor: 'Dr. Anya Sharma', clinic: 'General Hospital' },
];

const ConsultationCard = ({ consultation, onPress }) => (
  
  // <View style={styles.card}>
  //   <View style={styles.cardContent}>
  //     <Text style={styles.cardLabel}>
  //       Date: <Text style={styles.cardValue}>{consultation.date}</Text>
  //     </Text>
  //     <Text style={styles.cardLabel}>
  //       Doctor: <Text style={styles.cardValue}>{consultation.doctor}</Text>
  //     </Text>
  //     <View style={styles.clinicRow}>
  //       <Text style={styles.cardLabel}>
  //         Clinic: <Text style={styles.cardValue}>{consultation.clinic}</Text>
  //       </Text>
  //       <TouchableOpacity style={styles.detailsButton} onPress={onPress}>
  //         <Text style={styles.detailsButtonText}>View Details</Text>
  //       </TouchableOpacity>
  //     </View>
  //   </View>
  // </View>
  <View style={styles.card}>
    <View style={styles.cardContent}>
      <Text style={styles.clinicLabel}>
        {consultation.clinic}
      </Text>
      <Text style={styles.cardLabel}>
        Doctor: <Text style={styles.cardValue}>{consultation.doctor}</Text>
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
  </View>
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
      <StatusBar barStyle="dark-content" backgroundColor="#9bd7cd" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Consultation History</Text>
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
    backgroundColor: '#ffffffff',
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 0,
  },
  header: {
    backgroundColor: '#9bd7cd',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
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
  clinicRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clinicLabel: {
    fontSize: 17,
    color: '#1e4b46',
    fontFamily: 'Poppins_700Bold',
    flex: 1,
    marginBottom: 2,
  },
  cardContent: {
    // marginBottom: 15,
  },
  cardLabel: {
    fontSize: 15,
    color: '#1e4b46',
    // fontWeight: '600',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 8,
    flex: 1,
  },
  cardValue: {
    fontFamily: 'Poppins_400Regular',
    color: '#1e4b46',
  },
  detailsButton: {
    backgroundColor: '#1e4b46',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 10,
    // alignSelf: 'flex-end',
    marginLeft: 10,
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default ConsultationHistoryScreen;