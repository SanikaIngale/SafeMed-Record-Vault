import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function RequestScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [requests, setRequests] = useState([
    {
      id: 1,
      hospitalName: 'Vedanta Hospital',
      address: '83712 George Street, Mumbai 72445-8748',
      owner: 'Jackie Pfannerstill',
      status: 'pending',
    },
    {
      id: 2,
      hospitalName: 'Apollo Clinic',
      address: '123 Health Avenue, Mumbai 72445-8748',
      owner: 'Dr. Smith',
      status: 'rejected',
    },
    {
      id: 3,
      hospitalName: 'City Medical Center',
      address: '456 Wellness Road, Mumbai 72445-8748',
      owner: 'Health Care Admin',
      status: 'approved',
    },
  ]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      case 'approved':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  const getStatusBackgroundColor = (status) => {
    switch (status) {
      case 'pending':
        return '#FFF3E0';
      case 'rejected':
        return '#FFEBEE';
      case 'approved':
        return '#E8F5E9';
      default:
        return '#F5F5F5';
    }
  };

  const getStatusText = (status) => {
    return status.toUpperCase();
  };

  const getModalTitle = (status) => {
    switch (status) {
      case 'pending':
        return 'Confirm Approve Request?';
      case 'approved':
        return 'Request Approved';
      case 'rejected':
        return 'Request Rejected';
      default:
        return 'Request Details';
    }
  };

  const getModalDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'This will approve the hospital request for medical data access.';
      case 'approved':
        return 'The hospital request for medical data access has been approved.';
      case 'rejected':
        return 'The hospital request for medical data access has been rejected.';
      default:
        return '';
    }
  };

  const getFilteredRequests = () => {
    if (activeTab === 'all') {
      return requests;
    } else if (activeTab === 'pending') {
      return requests.filter(request => request.status === 'pending');
    } else if (activeTab === 'rejected') {
      return requests.filter(request => request.status === 'rejected');
    }
    return requests;
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleConfirmApprove = () => {
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === selectedRequest.id ? { ...req, status: 'approved' } : req
      )
    );
    setSelectedRequest(prev => ({ ...prev, status: 'approved' }));
  };

  const handleRejectRequest = () => {
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === selectedRequest.id ? { ...req, status: 'rejected' } : req
      )
    );
    setSelectedRequest(prev => ({ ...prev, status: 'rejected' }));
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const renderRequestCard = (request) => (
    <View key={request.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.label}>HOSPITAL NAME</Text>
          <Text style={styles.hospitalName}>{request.hospitalName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(request.status) }]}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(request.status) },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(request.status) },
            ]}
          >
            {getStatusText(request.status)}
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>ADDRESS</Text>
        <Text style={styles.infoText}>{request.address}</Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.label}>OWNER</Text>
        <Text style={styles.infoText}>{request.owner}</Text>
      </View>

      <View style={styles.buttonContainer}>
        {request.status === 'pending' && (
          <TouchableOpacity 
            style={styles.approveButton}
            onPress={() => handleViewDetails(request)}
          >
            <Text style={styles.approveButtonText}>View Details</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[
            styles.viewDetailsButton,
            (request.status === 'approved' || request.status === 'rejected') && styles.viewDetailsButtonFull,
          ]}
          onPress={() => handleViewDetails(request)}
        >
          <Text style={styles.viewDetailsButtonText}>View Details</Text>
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
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Hospital Name"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'all' && styles.activeTabText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'pending' && styles.activeTabText,
            ]}
          >
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
          onPress={() => setActiveTab('rejected')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'rejected' && styles.activeTabText,
            ]}
          >
            Rejected
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {getFilteredRequests().map((request) => renderRequestCard(request))}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalOverlay} onPress={handleCloseModal}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>
              {selectedRequest && getModalTitle(selectedRequest.status)}
            </Text>
            <Text style={styles.modalDescription}>
              {selectedRequest && getModalDescription(selectedRequest.status)}
            </Text>

            {selectedRequest && (
              <View style={styles.modalDetails}>
                <View style={styles.modalDetailRow}>
                  <View style={styles.modalInfoContainer}>
                    <Text style={styles.modalLabel}>HOSPITAL NAME</Text>
                    <Text style={styles.modalValue}>{selectedRequest.hospitalName}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusBackgroundColor(selectedRequest.status) }]}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(selectedRequest.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(selectedRequest.status) }]}>
                      {getStatusText(selectedRequest.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>ADDRESS</Text>
                  <Text style={styles.modalValue}>{selectedRequest.address}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>OWNER</Text>
                  <Text style={styles.modalValue}>{selectedRequest.owner}</Text>
                </View>
              </View>
            )}

            {selectedRequest && selectedRequest.status === 'pending' && (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleConfirmApprove}
                >
                  <Text style={styles.confirmButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={handleRejectRequest}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {selectedRequest && (selectedRequest.status === 'approved' || selectedRequest.status === 'rejected') && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCloseModal}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 8,
    paddingTop: 8,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E4B46',
  },
  tabText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#1E4B46',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  hospitalName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E4B46',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  infoSection: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#4A5568',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#1E4B46',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#E8F5F3',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsButtonFull: {
    flex: 1,
  },
  viewDetailsButtonText: {
    color: '#1E4B46',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E4B46',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalDetails: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalInfoContainer: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  modalValue: {
    fontSize: 14,
    color: '#1E4B46',
    fontWeight: '500',
  },
  modalSection: {
    marginTop: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#1E4B46',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  closeButton: {
    width: '100%',
    backgroundColor: '#1E4B46',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});