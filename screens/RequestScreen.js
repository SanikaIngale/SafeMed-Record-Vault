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
import { Ionicons } from '@expo/vector-icons';

export default function RequestScreen() {
  const [activeTab, setActiveTab] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [requests, setRequests] = useState([
    {
      id: 1,
      hospitalName: 'Vedanta Hospital',
      address: '83712 George Street, Edaview 72445-8748',
      owner: 'Jackie Pfannerstill',
      status: 'pending',
    },
    {
      id: 2,
      hospitalName: 'Vedanta Hospital',
      address: '83712 George Street, Edaview 72445-8748',
      owner: 'Jackie Pfannerstill',
      status: 'rejected',
    },
    {
      id: 3,
      hospitalName: 'Vedanta Hospital',
      address: '83712 George Street, Edaview 72445-8748',
      owner: 'Jackie Pfannerstill',
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
        return 'Confirm Approve Request ?';
      case 'approved':
        return 'Approved Request!';
      case 'rejected':
        return 'Rejected Request!';
      default:
        return 'Request Details';
    }
  };

  const getModalDescription = (status) => {
    switch (status) {
      case 'pending':
        return 'This will approve the hospital request for hospital data for the owner';
      case 'approved':
        return 'The hospital request for hospital data for the owner has been approved.';
      case 'rejected':
        return 'The hospital request for hospital data for the owner has been rejected.';
      default:
        return '';
    }
  };

  // Filter requests based on active tab
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
    console.log('View Details clicked for:', request.hospitalName);
    setSelectedRequest(request);
    setModalVisible(true);
  };

  const handleApprove = (requestId) => {
    console.log('Approve clicked for request:', requestId);
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === requestId ? { ...req, status: 'approved' } : req
      )
    );
  };

  const handleConfirmApprove = () => {
    console.log('Approved:', selectedRequest);
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === selectedRequest.id ? { ...req, status: 'approved' } : req
      )
    );
    // Update the selected request to show the new status in modal
    setSelectedRequest(prev => ({ ...prev, status: 'approved' }));
  };

  const handleRejectRequest = () => {
    console.log('Rejected:', selectedRequest);
    setRequests(prevRequests =>
      prevRequests.map(req =>
        req.id === selectedRequest.id ? { ...req, status: 'rejected' } : req
      )
    );
    // Update the selected request to show the new status in modal
    setSelectedRequest(prev => ({ ...prev, status: 'rejected' }));
  };

  const handleCloseModal = () => {
    console.log('Modal closed');
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
            onPress={() => handleApprove(request.id)}
          >
            <Text style={styles.approveButtonText}>Approve Request</Text>
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
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F5" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
          <View style={styles.menuLine} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bulandshahr</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Request by Hospital Name"
          placeholderTextColor="#999"
        />
      </View>

      {/* Tabs */}
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
            All Requests
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
            Pending Requests
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
            Rejected Requests
          </Text>
        </TouchableOpacity>
      </View>

      {/* Request List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {getFilteredRequests().map((request) => renderRequestCard(request))}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#333" />
          <Text style={styles.navTextActive}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="notifications-outline" size={24} color="#999" />
          <Text style={styles.navText}>Notifications</Text>
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal */}
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
                  <Text style={styles.modalLabel}>OWNER</Text>
                  <Text style={styles.modalValue}>{selectedRequest.owner}</Text>
                </View>
              </View>
            )}

            {/* Conditional Buttons based on Status */}
            {selectedRequest && selectedRequest.status === 'pending' && (
              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleConfirmApprove}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.rejectButton}
                  onPress={handleRejectRequest}
                >
                  <Text style={styles.rejectButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* No buttons for Approved and Rejected requests */}
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
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  menuButton: {
    padding: 8,
  },
  menuLine: {
    width: 20,
    height: 2,
    backgroundColor: '#333',
    marginVertical: 2,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    position: 'absolute',
    right: 16,
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
  },
  tab: {
    flex: 1,
    paddingBottom: 12,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  tabText: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
    textAlign: 'center',
    flexWrap: 'nowrap',
  },
  activeTabText: {
    color: '#333',
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
    color: '#333',
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
    color: '#333',
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  viewDetailsButton: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  viewDetailsButtonFull: {
    flex: 1,
  },
  viewDetailsButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  navText: {
    fontSize: 12,
    color: '#999',
  },
  navTextActive: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  // Modal Styles
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
    color: '#333',
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
    color: '#333',
    fontWeight: '500',
  },
  modalSection: {
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
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
    backgroundColor: '#FFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  closeButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
  },
});