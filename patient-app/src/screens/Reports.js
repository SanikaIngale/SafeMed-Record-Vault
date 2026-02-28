import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    Platform,
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

const MOCK_REPORTS = [
  {
    id: '1',
    title: 'Complete Blood Count (CBC)',
    lab: 'Inner Health Diagnostic Centre',
    date: '02 Dec 2024',
    type: 'Blood Test',
    fileType: 'PDF',
    size: '1.2 MB',
  },
  {
    id: '2',
    title: 'Lipid Profile Panel',
    lab: 'MedLab Diagnostics',
    date: '15 Nov 2024',
    type: 'Blood Test',
    fileType: 'PDF',
    size: '0.8 MB',
  },
  {
    id: '3',
    title: 'Chest X-Ray',
    lab: 'CityHealth Imaging',
    date: '01 Oct 2024',
    type: 'Radiology',
    fileType: 'IMG',
    size: '4.5 MB',
  },
  {
    id: '4',
    title: 'HbA1c & Blood Glucose',
    lab: 'Inner Health Diagnostic Centre',
    date: '10 Sep 2024',
    type: 'Blood Test',
    fileType: 'PDF',
    size: '0.5 MB',
  },
  {
    id: '5',
    title: 'Urine Routine Analysis',
    lab: 'QuickTest Labs',
    date: '22 Aug 2024',
    type: 'Urine Test',
    fileType: 'PDF',
    size: '0.3 MB',
  },
];

const CATEGORIES = ['All', 'Blood Test', 'Radiology', 'Urine Test', 'Other'];

const TYPE_ICON = {
  'Blood Test': 'water',
  Radiology:    'scan',
  'Urine Test': 'flask',
  Other:        'document-text',
};

export default function ReportsPage({ navigation }) {
  const [activeNav, setActiveNav]      = useState('Reports');
  const [reports, setReports]          = useState(MOCK_REPORTS);
  const [filteredReports, setFiltered] = useState(MOCK_REPORTS);
  const [activeCategory, setCategory]  = useState('All');
  const [searchQuery, setSearch]       = useState('');
  const [loading, setLoading]          = useState(false);
  const [uploadModal, setUploadModal]  = useState(false);
  const [detailModal, setDetailModal]  = useState(false);
  const [selectedReport, setSelected]  = useState(null);

  const today = new Date();
  const defaultDate = `${today.getDate().toString().padStart(2, '0')} ${
    ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][today.getMonth()]
  } ${today.getFullYear()}`;

  const [uploadForm, setUploadForm] = useState({
    title: '',
    lab: '',
    type: 'Blood Test',
    date: defaultDate,
  });

  useEffect(() => {
    let result = reports;
    if (activeCategory !== 'All') {
      result = result.filter(r => r.type === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        r =>
          r.title.toLowerCase().includes(q) ||
          r.lab.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      );
    }
    setFiltered(result);
  }, [activeCategory, searchQuery, reports]);

  const handleUpload = () => {
    if (!uploadForm.title.trim() || !uploadForm.lab.trim()) {
      Alert.alert('Missing Info', 'Please fill in the report title and lab name.');
      return;
    }
    if (!uploadForm.date.trim()) {
      Alert.alert('Missing Info', 'Please enter the report date.');
      return;
    }

    const newReport = {
      id: Date.now().toString(),
      title: uploadForm.title,
      lab: uploadForm.lab,
      date: uploadForm.date,
      type: uploadForm.type,
      fileType: 'PDF',
      size: '—',
    };

    setReports(prev => [newReport, ...prev]);
    setUploadModal(false);
    setUploadForm({ title: '', lab: '', type: 'Blood Test', date: defaultDate });
    Alert.alert('Uploaded!', 'Your report has been added successfully.');
  };

  const openDetail = (report) => {
    setSelected(report);
    setDetailModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E4B46" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSub}>My Health</Text>
          <Text style={styles.headerTitle}>Lab Reports</Text>
        </View>
        <TouchableOpacity
          style={styles.uploadFab}
          onPress={() => setUploadModal(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={26} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Search */}
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search reports..."
            placeholderTextColor="#AAAAAA"
            value={searchQuery}
            onChangeText={setSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, activeCategory === cat && styles.categoryChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryChipText, activeCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Reports List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {activeCategory === 'All' ? 'All Reports' : activeCategory}
            </Text>
            <Text style={styles.countBadge}>{filteredReports.length}</Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#1E4B46" style={{ marginTop: 40 }} />
          ) : filteredReports.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={56} color="#CCC" />
              <Text style={styles.emptyTitle}>No reports found</Text>
              <Text style={styles.emptyText}>
                {searchQuery ? 'Try a different search term.' : 'Upload your first report using the + button.'}
              </Text>
            </View>
          ) : (
            filteredReports.map(report => (
              <ReportCard key={report.id} report={report} onPress={() => openDetail(report)} />
            ))
          )}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={uploadModal}
        animationType="slide"
        transparent
        onRequestClose={() => setUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Report</Text>
              <TouchableOpacity onPress={() => setUploadModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* File picker */}
              <TouchableOpacity style={styles.filePicker}>
                <Ionicons name="cloud-upload-outline" size={36} color="#1E4B46" />
                <Text style={styles.filePickerTitle}>Tap to select file</Text>
                <Text style={styles.filePickerSub}>PDF, JPG, PNG — up to 20 MB</Text>
              </TouchableOpacity>

              <Text style={styles.fieldLabel}>Report Title *</Text>
              <TextInput
                style={styles.textField}
                placeholder="e.g. Complete Blood Count"
                placeholderTextColor="#AAAAAA"
                value={uploadForm.title}
                onChangeText={v => setUploadForm(p => ({ ...p, title: v }))}
              />

              <Text style={styles.fieldLabel}>Lab / Diagnostic Centre *</Text>
              <TextInput
                style={styles.textField}
                placeholder="e.g. Inner Health Diagnostics"
                placeholderTextColor="#AAAAAA"
                value={uploadForm.lab}
                onChangeText={v => setUploadForm(p => ({ ...p, lab: v }))}
              />

              <Text style={styles.fieldLabel}>Report Date *</Text>
              <View style={styles.dateFieldWrapper}>
                <Ionicons name="calendar-outline" size={16} color="#999" style={styles.dateIcon} />
                <TextInput
                  style={styles.dateField}
                  placeholder="e.g. 02 Dec 2024"
                  placeholderTextColor="#AAAAAA"
                  value={uploadForm.date}
                  onChangeText={v => setUploadForm(p => ({ ...p, date: v }))}
                />
              </View>

              <Text style={styles.fieldLabel}>Report Type</Text>
              <View style={styles.typeRow}>
                {['Blood Test', 'Radiology', 'Urine Test', 'Other'].map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, uploadForm.type === t && styles.typeChipActive]}
                    onPress={() => setUploadForm(p => ({ ...p, type: t }))}
                  >
                    <Text style={[styles.typeChipText, uploadForm.type === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
                <Ionicons name="cloud-upload" size={18} color="#FFF" />
                <Text style={styles.uploadBtnText}>Upload Report</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail Modal */}
      {selectedReport && (
        <Modal
          visible={detailModal}
          animationType="slide"
          transparent
          onRequestClose={() => setDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHandle} />

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Report Detail</Text>
                <TouchableOpacity onPress={() => setDetailModal(false)}>
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <View style={styles.detailIconWrap}>
                <View style={styles.detailIconCircle}>
                  <Ionicons
                    name={TYPE_ICON[selectedReport.type] || 'document-text'}
                    size={32}
                    color="#1E4B46"
                  />
                </View>
              </View>

              <Text style={styles.detailTitle}>{selectedReport.title}</Text>
              <Text style={styles.detailLab}>{selectedReport.lab}</Text>

              {[
                { icon: 'calendar-outline', label: 'Date', val: selectedReport.date },
                { icon: 'medkit-outline',   label: 'Type', val: selectedReport.type },
                { icon: 'document-outline', label: 'File', val: selectedReport.fileType },
                { icon: 'save-outline',     label: 'Size', val: selectedReport.size },
              ].map(row => (
                <View key={row.label} style={styles.detailRow}>
                  <Ionicons name={row.icon} size={18} color="#1E4B46" />
                  <Text style={styles.detailRowLabel}>{row.label}</Text>
                  <Text style={styles.detailRowVal}>{row.val}</Text>
                </View>
              ))}

              <View style={styles.detailActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="download-outline" size={18} color="#1E4B46" />
                  <Text style={styles.actionBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Ionicons name="share-social-outline" size={18} color="#1E4B46" />
                  <Text style={styles.actionBtnText}>Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary]}
                  onPress={() => setDetailModal(false)}
                >
                  <Ionicons name="eye-outline" size={18} color="#FFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFF' }]}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      <BottomNavigation
        activeNav={activeNav}
        onNavigate={setActiveNav}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

function ReportCard({ report, onPress }) {
  const icon = TYPE_ICON[report.type] || 'document-text';

  return (
    <TouchableOpacity style={styles.reportCard} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.reportIconBox}>
        <Ionicons name={icon} size={22} color="#1E4B46" />
      </View>

      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle} numberOfLines={1}>{report.title}</Text>
        <Text style={styles.reportLab} numberOfLines={1}>{report.lab}</Text>
        <View style={styles.reportMeta}>
          <Ionicons name="calendar-outline" size={12} color="#999" />
          <Text style={styles.reportDate}>{report.date}</Text>
          <View style={styles.reportTypeDot} />
          <Text style={styles.reportTypeText}>{report.type}</Text>
        </View>
      </View>

      <View style={styles.reportRight}>
        <Text style={styles.fileTypeBadge}>{report.fileType}</Text>
        <Ionicons name="chevron-forward" size={16} color="#CCC" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#1E4B46',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 48 : 16,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 13,
    color: '#A8D8D4',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFF',
    marginTop: 2,
  },
  uploadFab: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  categoryScroll: {
    marginTop: 14,
    marginBottom: 4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFF',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  categoryChipActive: {
    backgroundColor: '#1E4B46',
    borderColor: '#1E4B46',
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  listSection: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  countBadge: {
    backgroundColor: '#E8F5F3',
    color: '#1E4B46',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  reportCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  reportIconBox: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E8F5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportInfo: { flex: 1 },
  reportTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  reportLab: {
    fontSize: 12,
    color: '#777',
    marginBottom: 6,
  },
  reportMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reportDate: { fontSize: 11, color: '#999' },
  reportTypeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CCC',
    marginHorizontal: 2,
  },
  reportTypeText: { fontSize: 11, color: '#999' },
  reportRight: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  fileTypeBadge: {
    fontSize: 10,
    color: '#0277BD',
    fontWeight: '700',
    backgroundColor: '#B3E5FC',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 52,
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#555', marginTop: 14 },
  emptyText: { fontSize: 13, color: '#AAA', marginTop: 6, textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 12,
    maxHeight: '90%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  filePicker: {
    borderWidth: 2,
    borderColor: '#A8D8D4',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingVertical: 28,
    alignItems: 'center',
    backgroundColor: '#F0FAF9',
    marginBottom: 20,
    gap: 6,
  },
  filePickerTitle: { fontSize: 15, fontWeight: '600', color: '#1E4B46' },
  filePickerSub: { fontSize: 12, color: '#888' },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    marginTop: 4,
  },
  textField: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#333',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  dateFieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginBottom: 14,
  },
  dateIcon: { marginRight: 8 },
  dateField: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 11,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFF',
  },
  typeChipActive: { backgroundColor: '#1E4B46', borderColor: '#1E4B46' },
  typeChipText: { fontSize: 13, color: '#666', fontWeight: '500' },
  typeChipTextActive: { color: '#FFF', fontWeight: '600' },
  uploadBtn: {
    backgroundColor: '#1E4B46',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  uploadBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  detailIconWrap: { alignItems: 'center', marginBottom: 12 },
  detailIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#E8F5F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 4,
  },
  detailLab: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 10,
  },
  detailRowLabel: { fontSize: 13, color: '#888', flex: 1 },
  detailRowVal: { fontSize: 14, fontWeight: '600', color: '#1A1A1A' },
  detailActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1E4B46',
  },
  actionBtnPrimary: {
    backgroundColor: '#1E4B46',
    borderColor: '#1E4B46',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E4B46',
  },
});