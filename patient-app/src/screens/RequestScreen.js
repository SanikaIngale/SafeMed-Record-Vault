import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import BottomNavigation from '../components/BottomNavigation';
import { API_URL } from '../config/api';

export default function RequestScreen({ navigation }) {
  const [activeTab, setActiveTab]           = useState('all');
  const [activeNav, setActiveNav]           = useState('Requests');
  const [modalVisible, setModalVisible]     = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [requests, setRequests]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);

  // Fetch requests from backend
  const fetchRequests = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [token, patientId] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('patient_id'),
      ]);

      if (!token || !patientId) {
        Alert.alert('Session expired', 'Please sign in again.');
        navigation.replace('SignIn');
        return;
      }

      const res = await fetch(`${API_URL}/api/access-requests/patient/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setRequests(data.requests);
      } else {
        Alert.alert('Error', data.message || 'Failed to load requests');
      }
    } catch (err) {
      console.error('Fetch requests error:', err);
      Alert.alert('Error', 'Could not load requests. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [navigation]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/access-requests/${selectedRequest.id}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: 'approved' } : r));
        setSelectedRequest(prev => ({ ...prev, status: 'approved' }));
      } else {
        Alert.alert('Error', data.message || 'Failed to approve');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(`${API_URL}/api/access-requests/${selectedRequest.id}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, status: 'rejected' } : r));
        setSelectedRequest(prev => ({ ...prev, status: 'rejected' }));
      } else {
        Alert.alert('Error', data.message || 'Failed to reject');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':  return '#FF9800';
      case 'rejected': return '#F44336';
      case 'approved': return '#4CAF50';
      default:         return '#999';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'pending':  return '#FFF3E0';
      case 'rejected': return '#FFEBEE';
      case 'approved': return '#E8F5E9';
      default:         return '#F5F5F5';
    }
  };

  const getFilteredRequests = () => {
    let filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);
    if (searchQuery.trim()) {
      filtered = filtered.filter(r =>
        r.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.doctor_hospital?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  const renderRequestCard = (request) => (
    <View key={request.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>DOCTOR</Text>
          <Text style={styles.hospitalName}>Dr. {request.doctor_name}</Text>
          {request.doctor_specialization ? (
            <Text style={styles.subText}>{request.doctor_specialization}</Text>
          ) : null}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBg(request.status) }]}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(request.status) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
            {request.status.toUpperCase()}
          </Text>
        </View>
      </View>

      {request.doctor_hospital ? (
        <View style={styles.infoSection}>
          <Text style={styles.label}>HOSPITAL</Text>
          <Text style={styles.infoText}>{request.doctor_hospital}</Text>
        </View>
      ) : null}

      {request.message ? (
        <View style={styles.infoSection}>
          <Text style={styles.label}>MESSAGE</Text>
          <Text style={styles.infoText}>{request.message}</Text>
        </View>
      ) : null}

      <View style={styles.infoSection}>
        <Text style={styles.label}>REQUESTED ON</Text>
        <Text style={styles.infoText}>
          {new Date(request.requested_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.approveButton, styles.viewDetailsButtonFull]} onPress={() => { setSelectedRequest(request); setModalVisible(true); }}>
          <Text style={styles.approveButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data Access Requests</Text>
        <TouchableOpacity onPress={() => fetchRequests(true)}>
          <Icon name="refresh" size={24} color="#1E4B46" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by doctor or hospital"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.tabContainer}>
        {['all', 'pending', 'approved', 'rejected'].map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#1E4B46" />
          <Text style={{ marginTop: 12, color: '#666', fontSize: 14 }}>Loading requests...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchRequests(true)} colors={['#1E4B46']} />}
        >
          {getFilteredRequests().length === 0 ? (
            <View style={{ padding: 40, alignItems: 'center' }}>
              <Icon name="inbox-outline" size={48} color="#ccc" />
              <Text style={{ color: '#999', fontSize: 14, marginTop: 12, textAlign: 'center' }}>
                {activeTab === 'all' ? 'No access requests yet.' : `No ${activeTab} requests.`}
              </Text>
            </View>
          ) : (
            getFilteredRequests().map(renderRequestCard)
          )}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {selectedRequest && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedRequest.status === 'pending' ? 'Access Request' : selectedRequest.status === 'approved' ? 'Request Approved' : 'Request Rejected'}
                </Text>
                <Text style={styles.modalDescription}>
                  {selectedRequest.status === 'pending'
                    ? 'Review this doctor\'s request to access your medical records.'
                    : selectedRequest.status === 'approved'
                    ? 'You have approved this doctor to view your medical records.'
                    : 'You rejected this doctor\'s access request.'}
                </Text>

                <View style={styles.modalDetails}>
                  <View style={styles.modalDetailRow}>
                    <View style={styles.modalInfoContainer}>
                      <Text style={styles.modalLabel}>DOCTOR</Text>
                      <Text style={styles.modalValue}>Dr. {selectedRequest.doctor_name}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusBg(selectedRequest.status) }]}>
                      <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedRequest.status) }]} />
                      <Text style={[styles.statusText, { color: getStatusColor(selectedRequest.status) }]}>
                        {selectedRequest.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {selectedRequest.doctor_specialization ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>SPECIALIZATION</Text>
                      <Text style={styles.modalValue}>{selectedRequest.doctor_specialization}</Text>
                    </View>
                  ) : null}
                  {selectedRequest.doctor_hospital ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>HOSPITAL</Text>
                      <Text style={styles.modalValue}>{selectedRequest.doctor_hospital}</Text>
                    </View>
                  ) : null}
                  {selectedRequest.message ? (
                    <View style={styles.modalSection}>
                      <Text style={styles.modalLabel}>MESSAGE</Text>
                      <Text style={styles.modalValue}>{selectedRequest.message}</Text>
                    </View>
                  ) : null}
                </View>

                {selectedRequest.status === 'pending' && (
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.confirmButton} onPress={handleApprove} disabled={actionLoading}>
                      {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.confirmButtonText}>Approve</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectButton} onPress={handleReject} disabled={actionLoading}>
                      {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.rejectButtonText}>Reject</Text>}
                    </TouchableOpacity>
                  </View>
                )}

                {(selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
                  <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNavigation activeNav={activeNav} onNavigate={setActiveNav} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:            { flex: 1, backgroundColor: '#f5f5f5' },
  header:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 45, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle:          { fontSize: 18, fontWeight: '600', color: '#1E4B46' },
  searchContainer:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', gap: 8 },
  searchInput:          { flex: 1, fontSize: 14, color: '#333' },
  tabContainer:         { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 8, paddingTop: 8, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab:                  { flex: 1, paddingBottom: 12, alignItems: 'center', paddingHorizontal: 4 },
  activeTab:            { borderBottomWidth: 2, borderBottomColor: '#1E4B46' },
  tabText:              { fontSize: 13, color: '#999', fontWeight: '500', textAlign: 'center' },
  activeTabText:        { color: '#1E4B46', fontWeight: '600' },
  scrollView:           { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  bottomSpacing:        { height: 20 },
  card:                 { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  label:                { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  hospitalName:         { fontSize: 16, fontWeight: '600', color: '#1E4B46' },
  subText:              { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge:          { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusDot:            { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText:           { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  infoSection:          { marginBottom: 12 },
  infoText:             { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  buttonContainer:      { flexDirection: 'row', marginTop: 12, gap: 12 },
  approveButton:        { flex: 1, backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  approveButtonText:    { color: '#FFF', fontSize: 14, fontWeight: '600' },
  viewDetailsButtonFull: { flex: 1 },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent:         { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle:           { fontSize: 18, fontWeight: '600', color: '#1E4B46', marginBottom: 8 },
  modalDescription:     { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  modalDetails:         { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 16, marginBottom: 20 },
  modalDetailRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalInfoContainer:   { flex: 1 },
  modalLabel:           { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  modalValue:           { fontSize: 14, color: '#1E4B46', fontWeight: '500' },
  modalSection:         { marginTop: 12 },
  modalButtons:         { flexDirection: 'row', gap: 12 },
  confirmButton:        { flex: 1, backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText:    { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rejectButton:         { flex: 1, backgroundColor: '#F44336', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  rejectButtonText:     { color: '#FFF', fontSize: 14, fontWeight: '600' },
  closeButton:          { width: '100%', backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  closeButtonText:      { color: '#FFF', fontSize: 14, fontWeight: '600' },
});