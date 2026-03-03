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

// ── Duration options the patient can choose from ──────────────────────────────
const DURATION_OPTIONS = [
  { label: '1 Hour',   hours: 1   },
  { label: '6 Hours',  hours: 6   },
  { label: '24 Hours', hours: 24  },
  { label: '3 Days',   hours: 72  },
  { label: '7 Days',   hours: 168 },
  { label: '30 Days',  hours: 720 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatExpiry = (isoString) => {
  if (!isoString) return null;
  const d = new Date(isoString);
  return d.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
};

const isExpired = (isoString) => {
  if (!isoString) return false;
  return new Date(isoString) < new Date();
};

export default function RequestScreen({ navigation }) {
  const [activeTab, setActiveTab]               = useState('all');
  const [activeNav, setActiveNav]               = useState('Requests');
  const [modalVisible, setModalVisible]         = useState(false);
  const [selectedRequest, setSelectedRequest]   = useState(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [requests, setRequests]                 = useState([]);
  const [loading, setLoading]                   = useState(true);
  const [refreshing, setRefreshing]             = useState(false);
  const [actionLoading, setActionLoading]       = useState(false);

  // ── Duration picker state ──────────────────────────────────────────────────
  const [durationModalVisible, setDurationModalVisible] = useState(false);
  const [selectedDurationHours, setSelectedDurationHours] = useState(24); // default 24h

  // ── Fetch requests ─────────────────────────────────────────────────────────
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

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  // ── Approve — opens duration picker first ─────────────────────────────────
  const openDurationPicker = () => {
    setDurationModalVisible(true);
  };

  const handleApproveWithDuration = async () => {
    setDurationModalVisible(false);
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      // Calculate expires_at from selected duration
      const expiresAt = new Date(
        Date.now() + selectedDurationHours * 60 * 60 * 1000
      ).toISOString();

      const res = await fetch(
        `${API_URL}/api/access-requests/${selectedRequest.id}/approve`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          // ⭐ Send expires_at to the backend
          body: JSON.stringify({ expires_at: expiresAt }),
        }
      );
      const data = await res.json();

      if (data.success) {
        const updated = { ...selectedRequest, status: 'approved', expires_at: expiresAt };
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? updated : r));
        setSelectedRequest(updated);
      } else {
        Alert.alert('Error', data.message || 'Failed to approve');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject ─────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    try {
      setActionLoading(true);
      const token = await AsyncStorage.getItem('userToken');
      const res = await fetch(
        `${API_URL}/api/access-requests/${selectedRequest.id}/reject`,
        { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        const updated = { ...selectedRequest, status: 'rejected' };
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? updated : r));
        setSelectedRequest(updated);
      } else {
        Alert.alert('Error', data.message || 'Failed to reject');
      }
    } catch (err) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Revoke an approved (not-yet-expired) grant ─────────────────────────────
  const handleRevoke = async () => {
    Alert.alert(
      'Revoke Access',
      `Are you sure you want to revoke Dr. ${selectedRequest.doctor_name}'s access immediately?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke', style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(true);
              const token = await AsyncStorage.getItem('userToken');
              const res = await fetch(
                `${API_URL}/api/access-requests/${selectedRequest.id}/revoke`,
                { method: 'PUT', headers: { Authorization: `Bearer ${token}` } }
              );
              const data = await res.json();
              if (data.success) {
                const updated = { ...selectedRequest, status: 'rejected' };
                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? updated : r));
                setSelectedRequest(updated);
              } else {
                Alert.alert('Error', data.message || 'Failed to revoke');
              }
            } catch (err) {
              Alert.alert('Error', 'Something went wrong.');
            } finally {
              setActionLoading(false);
            }
          },
        },
      ]
    );
  };

  // ── Status helpers ─────────────────────────────────────────────────────────
  const getEffectiveStatus = (request) => {
    if (request.status === 'approved' && isExpired(request.expires_at)) return 'expired';
    return request.status;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':  return '#FF9800';
      case 'rejected': return '#F44336';
      case 'approved': return '#4CAF50';
      case 'expired':  return '#9E9E9E';
      default:         return '#999';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'pending':  return '#FFF3E0';
      case 'rejected': return '#FFEBEE';
      case 'approved': return '#E8F5E9';
      case 'expired':  return '#F5F5F5';
      default:         return '#F5F5F5';
    }
  };

  // ── Filter ─────────────────────────────────────────────────────────────────
  const getFilteredRequests = () => {
    let filtered = requests;
    if (activeTab !== 'all') {
      filtered = filtered.filter(r => getEffectiveStatus(r) === activeTab);
    }
    if (searchQuery.trim()) {
      filtered = filtered.filter(r =>
        r.doctor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.doctor_hospital?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return filtered;
  };

  // ── Request card ───────────────────────────────────────────────────────────
  const renderRequestCard = (request) => {
    const effectiveStatus = getEffectiveStatus(request);
    return (
      <View key={request.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>DOCTOR</Text>
            <Text style={styles.hospitalName}>Dr. {request.doctor_name}</Text>
            {request.doctor_specialization ? (
              <Text style={styles.subText}>{request.doctor_specialization}</Text>
            ) : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(effectiveStatus) }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(effectiveStatus) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(effectiveStatus) }]}>
              {effectiveStatus.toUpperCase()}
            </Text>
          </View>
        </View>

        {request.doctor_hospital ? (
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>🏥 {request.doctor_hospital}</Text>
          </View>
        ) : null}

        {/* Show expiry info for approved grants */}
        {request.status === 'approved' && request.expires_at && (
          <View style={[styles.expiryBanner, isExpired(request.expires_at) ? styles.expiryBannerExpired : styles.expiryBannerActive]}>
            <Icon
              name={isExpired(request.expires_at) ? 'clock-alert-outline' : 'clock-check-outline'}
              size={14}
              color={isExpired(request.expires_at) ? '#9E9E9E' : '#2E7D32'}
            />
            <Text style={[styles.expiryText, { color: isExpired(request.expires_at) ? '#9E9E9E' : '#2E7D32' }]}>
              {isExpired(request.expires_at)
                ? `Expired ${formatExpiry(request.expires_at)}`
                : `Access until ${formatExpiry(request.expires_at)}`}
            </Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          {effectiveStatus === 'pending' && (
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => { setSelectedRequest(request); openDurationPicker(); }}
            >
              <Text style={styles.approveButtonText}>Approve</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.viewDetailsButtonFull, effectiveStatus !== 'pending' && { flex: 1 }]}
            onPress={() => { setSelectedRequest(request); setModalVisible(true); }}
          >
            <View style={styles.viewDetailsButton}>
              <Text style={styles.viewDetailsText}>View Details</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const tabs = ['all', 'pending', 'approved', 'rejected', 'expired'];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Access Requests</Text>
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={18} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by doctor or hospital..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
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
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchRequests(true)}
              colors={['#1E4B46']}
            />
          }
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

      {/* ── Duration Picker Modal ─────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={durationModalVisible}
        onRequestClose={() => setDurationModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setDurationModalVisible(false)}>
          <Pressable style={styles.durationModalContent} onPress={e => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Grant Access Duration</Text>
            <Text style={styles.modalDescription}>
              How long should Dr. {selectedRequest?.doctor_name} have access to your records?
            </Text>

            <View style={styles.durationOptions}>
              {DURATION_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.hours}
                  style={[
                    styles.durationOption,
                    selectedDurationHours === opt.hours && styles.durationOptionSelected,
                  ]}
                  onPress={() => setSelectedDurationHours(opt.hours)}
                >
                  <Text style={[
                    styles.durationOptionText,
                    selectedDurationHours === opt.hours && styles.durationOptionTextSelected,
                  ]}>
                    {opt.label}
                  </Text>
                  {selectedDurationHours === opt.hours && (
                    <Icon name="check-circle" size={16} color="#1E4B46" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.durationExpiryNote}>
              <Icon name="clock-outline" size={14} color="#666" />
              <Text style={styles.durationExpiryNoteText}>
                Access expires:{' '}
                {formatExpiry(
                  new Date(Date.now() + selectedDurationHours * 60 * 60 * 1000).toISOString()
                )}
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.rejectButton}
                onPress={() => setDurationModalVisible(false)}
              >
                <Text style={styles.rejectButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleApproveWithDuration}
                disabled={actionLoading}
              >
                {actionLoading
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.confirmButtonText}>Confirm Approval</Text>
                }
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Detail Modal ──────────────────────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
            {selectedRequest && (() => {
              const effectiveStatus = getEffectiveStatus(selectedRequest);
              return (
                <>
                  <Text style={styles.modalTitle}>
                    {effectiveStatus === 'pending'  ? 'Access Request'   :
                     effectiveStatus === 'approved' ? 'Request Approved' :
                     effectiveStatus === 'expired'  ? 'Access Expired'   :
                     'Request Rejected'}
                  </Text>
                  <Text style={styles.modalDescription}>
                    {effectiveStatus === 'pending'
                      ? "Review this doctor's request to access your medical records."
                      : effectiveStatus === 'approved'
                      ? 'You have approved this doctor to view your medical records.'
                      : effectiveStatus === 'expired'
                      ? "This doctor's access window has ended."
                      : "You rejected this doctor's access request."}
                  </Text>

                  <View style={styles.modalDetails}>
                    <View style={styles.modalDetailRow}>
                      <View style={styles.modalInfoContainer}>
                        <Text style={styles.modalLabel}>DOCTOR</Text>
                        <Text style={styles.modalValue}>Dr. {selectedRequest.doctor_name}</Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusBg(effectiveStatus) }]}>
                        <View style={[styles.statusDot, { backgroundColor: getStatusColor(effectiveStatus) }]} />
                        <Text style={[styles.statusText, { color: getStatusColor(effectiveStatus) }]}>
                          {effectiveStatus.toUpperCase()}
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

                    {/* Expiry info in detail modal */}
                    {selectedRequest.expires_at && (
                      <View style={styles.modalSection}>
                        <Text style={styles.modalLabel}>
                          {isExpired(selectedRequest.expires_at) ? 'EXPIRED AT' : 'ACCESS UNTIL'}
                        </Text>
                        <Text style={[
                          styles.modalValue,
                          { color: isExpired(selectedRequest.expires_at) ? '#9E9E9E' : '#2E7D32' }
                        ]}>
                          {formatExpiry(selectedRequest.expires_at)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Pending — show approve button which opens duration picker */}
                  {effectiveStatus === 'pending' && (
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.confirmButton}
                        onPress={() => { setModalVisible(false); openDurationPicker(); }}
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.confirmButtonText}>Approve</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectButton}
                        onPress={handleReject}
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.rejectButtonText}>Reject</Text>
                        }
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Approved and not expired — show Revoke button */}
                  {effectiveStatus === 'approved' && (
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={styles.revokeButton}
                        onPress={handleRevoke}
                        disabled={actionLoading}
                      >
                        {actionLoading
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.revokeButtonText}>Revoke Access</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                      >
                        <Text style={styles.closeButtonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Rejected or expired — just close */}
                  {(effectiveStatus === 'rejected' || effectiveStatus === 'expired') && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>Close</Text>
                    </TouchableOpacity>
                  )}
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      <BottomNavigation activeNav={activeNav} onNavigate={setActiveNav} navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:               { flex: 1, backgroundColor: '#f5f5f5' },
  header:                  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, paddingTop: 45, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  headerTitle:             { fontSize: 18, fontWeight: '600', color: '#1E4B46' },
  searchContainer:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', gap: 8 },
  searchInput:             { flex: 1, fontSize: 14, color: '#333' },
  tabContainer:            { flexDirection: 'row', backgroundColor: '#FFF', paddingHorizontal: 8, paddingTop: 8, justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e0e0e0' },
  tab:                     { flex: 1, paddingBottom: 12, alignItems: 'center', paddingHorizontal: 4 },
  activeTab:               { borderBottomWidth: 2, borderBottomColor: '#1E4B46' },
  tabText:                 { fontSize: 12, color: '#999', fontWeight: '500', textAlign: 'center' },
  activeTabText:           { color: '#1E4B46', fontWeight: '600' },
  scrollView:              { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  bottomSpacing:           { height: 20 },
  card:                    { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader:              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  label:                   { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  hospitalName:            { fontSize: 16, fontWeight: '600', color: '#1E4B46' },
  subText:                 { fontSize: 12, color: '#666', marginTop: 2 },
  statusBadge:             { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  statusDot:               { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText:              { fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  infoSection:             { marginBottom: 12 },
  infoText:                { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  // Expiry banner
  expiryBanner:            { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginBottom: 12 },
  expiryBannerActive:      { backgroundColor: '#E8F5E9' },
  expiryBannerExpired:     { backgroundColor: '#F5F5F5' },
  expiryText:              { fontSize: 12, fontWeight: '500' },
  // Buttons
  buttonContainer:         { flexDirection: 'row', marginTop: 12, gap: 12 },
  approveButton:           { flex: 1, backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  approveButtonText:       { color: '#FFF', fontSize: 14, fontWeight: '600' },
  viewDetailsButtonFull:   { flex: 1 },
  viewDetailsButton:       { flex: 1, borderWidth: 1, borderColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  viewDetailsText:         { color: '#1E4B46', fontSize: 14, fontWeight: '600' },
  // Modals
  modalOverlay:            { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent:            { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  durationModalContent:    { backgroundColor: '#FFF', borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalTitle:              { fontSize: 18, fontWeight: '600', color: '#1E4B46', marginBottom: 8 },
  modalDescription:        { fontSize: 14, color: '#666', lineHeight: 20, marginBottom: 20 },
  modalDetails:            { backgroundColor: '#F9F9F9', borderRadius: 8, padding: 16, marginBottom: 20 },
  modalDetailRow:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  modalInfoContainer:      { flex: 1 },
  modalLabel:              { fontSize: 10, color: '#999', fontWeight: '600', letterSpacing: 0.5, marginBottom: 4 },
  modalValue:              { fontSize: 14, color: '#1E4B46', fontWeight: '500' },
  modalSection:            { marginTop: 12 },
  modalButtons:            { flexDirection: 'row', gap: 12 },
  confirmButton:           { flex: 1, backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText:       { color: '#FFF', fontSize: 14, fontWeight: '600' },
  rejectButton:            { flex: 1, backgroundColor: '#F44336', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  rejectButtonText:        { color: '#FFF', fontSize: 14, fontWeight: '600' },
  revokeButton:            { flex: 1, backgroundColor: '#FF6F00', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  revokeButtonText:        { color: '#FFF', fontSize: 14, fontWeight: '600' },
  closeButton:             { flex: 1, backgroundColor: '#1E4B46', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  closeButtonText:         { color: '#FFF', fontSize: 14, fontWeight: '600' },
  // Duration picker
  durationOptions:         { gap: 8, marginBottom: 16 },
  durationOption:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#FAFAFA' },
  durationOptionSelected:  { borderColor: '#1E4B46', backgroundColor: '#E8F5EE' },
  durationOptionText:      { fontSize: 14, color: '#444', fontWeight: '500' },
  durationOptionTextSelected: { color: '#1E4B46', fontWeight: '700' },
  durationExpiryNote:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  durationExpiryNoteText:  { fontSize: 12, color: '#666' },
});