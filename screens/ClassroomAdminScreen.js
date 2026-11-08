import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ScrollView, Platform, Modal, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  getAllClassroomsIndex,
  createNewClassroom,
  deleteClassroomSession,
} from '../utils/classroomStorage';

export const ClassroomAdminScreen = () => {
  const navigation = useNavigation();

  // --- Auth State ---
  const TUTOR_MASTER_PASSWORD = 'Ninjatutor81!';
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem('ninja_tutor_authorized') === 'true';
    }
    return false;
  });
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Data State ---
  const [classrooms, setClassrooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedRoomId, setCopiedRoomId] = useState(null);

  // --- Create Modal State ---
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [tuteeName, setTuteeName] = useState('');
  const [topic, setTopic] = useState('');
  const [customRoomId, setCustomRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load classrooms on mount and when authorized
  const loadClassrooms = async () => {
    setIsLoading(true);
    try {
      const list = await getAllClassroomsIndex();
      setClassrooms(list || []);
    } catch (err) {
      console.warn('Error loading classrooms:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadClassrooms();
    }
  }, [isAuthenticated]);

  // Auth Submit
  const handleAuthSubmit = () => {
    if (authPassword === TUTOR_MASTER_PASSWORD) {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('ninja_tutor_authorized', 'true');
      }
      setIsAuthenticated(true);
      setAuthError('');
      loadClassrooms();
    } else {
      setAuthError('Incorrect tutor password. Please try again.');
    }
  };

  // Generate suggested room code as user types student name
  const handleTuteeNameChange = (name) => {
    setTuteeName(name);
    const clean = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
    setCustomRoomId(clean || '');
  };

  // Create Classroom
  const handleCreateSubmit = async () => {
    if (!tuteeName.trim()) {
      Alert.alert('Required', 'Please enter a student name.');
      return;
    }

    setIsCreating(true);
    try {
      const created = await createNewClassroom({
        tuteeName: tuteeName.trim(),
        topic: topic.trim() || 'All Topics & Revision',
        customRoomId: customRoomId.trim() || undefined,
      });

      setShowCreateModal(false);
      setTuteeName('');
      setTopic('');
      setCustomRoomId('');
      await loadClassrooms();

      // Launch newly created classroom directly
      if (typeof window !== 'undefined') {
        window.location.href = `/classroom?room=${created.roomId}`;
      } else {
        navigation.navigate('Classroom', { room: created.roomId });
      }
    } catch (err) {
      console.error('Error creating classroom:', err);
      Alert.alert('Error', 'Failed to create classroom: ' + (err.message || ''));
    } finally {
      setIsCreating(false);
    }
  };

  // Delete Classroom
  const handleDeleteClassroom = (roomId, tutee) => {
    const confirmDelete = () => {
      deleteClassroomSession(roomId).then(() => {
        setClassrooms(prev => prev.filter(c => c.roomId !== roomId));
      });
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Are you sure you want to delete the classroom for "${tutee || roomId}"? All pages and notes will be permanently removed.`)) {
        confirmDelete();
      }
    } else {
      Alert.alert(
        'Delete Classroom',
        `Are you sure you want to delete "${tutee || roomId}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: confirmDelete },
        ]
      );
    }
  };

  // Copy Student Link
  const handleCopyStudentLink = (roomId) => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      const origin = window.location.origin;
      const studentUrl = `${origin}/classroom?room=${encodeURIComponent(roomId)}&role=student&token=ninja-student`;
      navigator.clipboard.writeText(studentUrl);
      setCopiedRoomId(roomId);
      setTimeout(() => setCopiedRoomId(null), 2500);
    }
  };

  // Filtered list
  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms;
    const q = searchQuery.toLowerCase();
    return classrooms.filter(c =>
      (c.tuteeName && c.tuteeName.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.roomId && c.roomId.toLowerCase().includes(q)) ||
      (c.topic && c.topic.toLowerCase().includes(q)) ||
      (c.subject && c.subject.toLowerCase().includes(q))
    );
  }, [classrooms, searchQuery]);

  // Aggregate stats
  const totalPagesSum = useMemo(() => {
    return classrooms.reduce((acc, c) => acc + (Number(c.totalPdfPages) || 1), 0);
  }, [classrooms]);

  // Format relative timestamp
  const formatTimeAgo = (isoString) => {
    if (!isoString) return 'Active recently';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 2) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch (e) {
      return 'Recently';
    }
  };

  // --- Render Password Gate ---
  if (!isAuthenticated) {
    return (
      <View style={styles.authContainer}>
        <View style={styles.authCard}>
          <Text style={styles.authIcon}>🥋</Text>
          <Text style={styles.authTitle}>Tutor Classrooms Hub</Text>
          <Text style={styles.authSubtitle}>
            Enter your Tutor Password to access and manage your tutee classrooms:
          </Text>

          <TextInput
            style={styles.authInput}
            placeholder="Enter Tutor Password"
            placeholderTextColor="#64748B"
            secureTextEntry
            value={authPassword}
            onChangeText={setAuthPassword}
            onSubmitEditing={handleAuthSubmit}
            autoFocus
          />

          {authError ? <Text style={styles.authErrorText}>{authError}</Text> : null}

          <TouchableOpacity style={styles.authSubmitBtn} onPress={handleAuthSubmit}>
            <Text style={styles.authSubmitBtnText}>Unlock Classroom Hub 🔓</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authBackBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.authBackBtnText}>← Return to 11+ Ninja Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Main Admin Dashboard Render ---
  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.homeBtn} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.homeBtnText}>🥋 11+ Ninja</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Classroom Hub</Text>
          <View style={styles.tutorBadge}>
            <Text style={styles.tutorBadgeText}>Tutor Mode</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.newRoomBtn}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.newRoomBtnText}>➕ New Classroom</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {/* Metrics Overview Bar */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{classrooms.length}</Text>
            <Text style={styles.metricLabel}>Active Tutees / Rooms</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{totalPagesSum}</Text>
            <Text style={styles.metricLabel}>Total Lesson Worksheets</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardHighlight]}>
            <Text style={styles.metricValue}>Live</Text>
            <Text style={styles.metricLabel}>Always-Saved & Reviewable</Text>
          </View>
        </View>

        {/* Search & Actions Bar */}
        <View style={styles.searchBarRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search by tutee name, topic, or room code..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.refreshBtn} onPress={loadClassrooms}>
            <Text style={styles.refreshBtnText}>🔄 Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Classrooms List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#059669" />
            <Text style={styles.loadingText}>Loading your classrooms...</Text>
          </View>
        ) : filteredClassrooms.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>🥋</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No matching classrooms found' : 'No Classrooms Yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery
                ? 'Try a different search term.'
                : 'Create dedicated, persistent classrooms for each of your 11+ students.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => setShowCreateModal(true)}
              >
                <Text style={styles.emptyActionBtnText}>➕ Set Up First Tutee Classroom</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.classroomsGrid}>
            {filteredClassrooms.map((c) => {
              const isCopied = copiedRoomId === c.roomId;

              return (
                <View key={c.roomId} style={styles.classroomCard}>
                  {/* Card Header */}
                  <View style={styles.cardHeader}>
                    <View style={styles.cardSubjectIconBox}>
                      <Text style={styles.cardSubjectIcon}>🥋</Text>
                    </View>
                    <View style={styles.cardTitleBox}>
                      <Text style={styles.cardTuteeName} numberOfLines={1}>
                        {c.tuteeName ? `${c.tuteeName}'s Classroom` : c.title || c.roomId}
                      </Text>
                      <Text style={styles.cardTopicText} numberOfLines={1}>
                        {c.topic || 'All Topics & Revision'}
                      </Text>
                    </View>
                    <View style={styles.pagesBadge}>
                      <Text style={styles.pagesBadgeText}>
                        📄 {c.totalPdfPages || 1} {c.totalPdfPages === 1 ? 'Page' : 'Pages'}
                      </Text>
                    </View>
                  </View>

                  {/* Room Meta Row */}
                  <View style={styles.roomMetaRow}>
                    <View style={styles.roomCodePill}>
                      <Text style={styles.roomCodePrefix}>Room:</Text>
                      <Text style={styles.roomCodeText}>{c.roomId}</Text>
                    </View>
                    <Text style={styles.roomUpdatedText}>
                      Updated {formatTimeAgo(c.updatedAt)}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.launchBtn}
                      onPress={() => {
                        if (typeof window !== 'undefined') {
                          window.location.href = `/classroom?room=${encodeURIComponent(c.roomId)}`;
                        } else {
                          navigation.navigate('Classroom', { room: c.roomId });
                        }
                      }}
                    >
                      <Text style={styles.launchBtnText}>🚀 Open Classroom</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.shareBtn, isCopied && styles.shareBtnCopied]}
                      onPress={() => handleCopyStudentLink(c.roomId)}
                      title="Copy direct invite link for the student"
                    >
                      <Text style={styles.shareBtnText}>
                        {isCopied ? '✅ Link Copied!' : '🔗 Copy Student Link'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDeleteClassroom(c.roomId, c.tuteeName)}
                      title="Delete this classroom session"
                    >
                      <Text style={styles.deleteBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Create New Classroom Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => !isCreating && setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>➕ Create New Tutee Classroom</Text>
              {!isCreating && (
                <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalCloseBtn}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.modalDescription}>
              Set up an independent, persistent classroom for your student. All workings, question sheets, and notes will be saved live.
            </Text>

            {/* Tutee Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Student Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Alex, Maya, Leo"
                placeholderTextColor="#64748B"
                value={tuteeName}
                onChangeText={handleTuteeNameChange}
                autoFocus
              />
            </View>

            {/* Custom Room Code (Auto-suggested) */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Room Code (URL Identifier)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. alex"
                placeholderTextColor="#64748B"
                value={customRoomId}
                onChangeText={setCustomRoomId}
              />
              <Text style={styles.roomUrlPreview}>
                Student Link: 11plusninja.com/classroom?room={customRoomId || '...'}
              </Text>
            </View>

            {/* Optional Notes / Focus */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Lesson Notes / Focus (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. All Topics, Weak Areas, Exam Prep"
                placeholderTextColor="#64748B"
                value={topic}
                onChangeText={setTopic}
              />
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowCreateModal(false)}
                disabled={isCreating}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCreateBtn}
                onPress={handleCreateSubmit}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalCreateBtnText}>Create & Launch 🚀</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    ...Platform.select({
      web: {
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      },
    }),
  },

  // Auth Gate
  authContainer: {
    flex: 1,
    backgroundColor: '#0B1120',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  authCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  authIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  authInput: {
    width: '100%',
    height: 48,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    color: '#F8FAFC',
    fontSize: 15,
    marginBottom: 12,
  },
  authErrorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 12,
  },
  authSubmitBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#059669',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  authSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  authBackBtn: {
    marginTop: 16,
    paddingVertical: 6,
  },
  authBackBtnText: {
    color: '#64748B',
    fontSize: 13,
  },

  // Header
  header: {
    height: 60,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
  },
  homeBtnText: {
    color: '#F8FAFC',
    fontWeight: '700',
    fontSize: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  tutorBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#059669',
  },
  tutorBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  newRoomBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  newRoomBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  // Main Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricCardHighlight: {
    borderColor: '#059669',
    backgroundColor: '#064E3B18',
  },
  metricValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },

  // Search Bar
  searchBarRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    color: '#F8FAFC',
    fontSize: 14,
  },
  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#334155',
    borderRadius: 8,
  },
  refreshBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },

  // Classrooms Grid
  classroomsGrid: {
    gap: 16,
  },
  classroomCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  cardSubjectIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSubjectIcon: {
    fontSize: 22,
  },
  cardTitleBox: {
    flex: 1,
  },
  cardTuteeName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  cardTopicText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  pagesBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pagesBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  roomMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    marginBottom: 14,
  },
  roomCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roomCodePrefix: {
    color: '#64748B',
    fontSize: 12,
  },
  roomCodeText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
  },
  roomUpdatedText: {
    color: '#64748B',
    fontSize: 12,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  launchBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  shareBtnCopied: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  shareBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginLeft: 'auto',
  },
  deleteBtnText: {
    fontSize: 14,
  },

  // Empty State
  emptyCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 420,
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },

  // Loading
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(11, 17, 32, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalCloseText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  modalDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    color: '#F8FAFC',
    fontSize: 14,
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subjectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  subjectPillSelected: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  subjectPillText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  subjectPillTextSelected: {
    color: '#34D399',
    fontWeight: '700',
  },
  roomUrlPreview: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
  },
  modalCancelBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  modalCreateBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#059669',
  },
  modalCreateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
