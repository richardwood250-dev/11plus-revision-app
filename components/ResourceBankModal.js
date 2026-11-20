import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  Modal, ScrollView, Platform
} from 'react-native';
import {
  RESOURCE_LEVELS,
  RESOURCE_SUBJECTS,
  EXAM_BOARDS,
  RESOURCE_TYPES,
  queryResourceBank,
  getAvailableTopics,
} from '../data/resourceBankData';

export const ResourceBankModal = ({
  visible,
  onClose,
  onLoadResource,
  onUploadCustomPdf,
  onInsertMarkSchemeNotes,
  onOpenDojoQuiz,
}) => {
  // Active Tab: 'all' | 'past_paper' | 'topic_worksheet' | 'upload'
  const [activeTab, setActiveTab] = useState('all');

  // Filter States
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedBoard, setSelectedBoard] = useState('all');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [searchQuery, setSearchQuery] = useState('');

  // Mark Scheme preview state (expanded resource ID)
  const [expandedMarkSchemeId, setExpandedMarkSchemeId] = useState(null);

  // Available topics dynamically computed from current level & subject
  const availableTopics = useMemo(() => {
    return getAvailableTopics({ level: selectedLevel, subject: selectedSubject });
  }, [selectedLevel, selectedSubject]);

  // Query matching resources
  const resources = useMemo(() => {
    return queryResourceBank({
      level: selectedLevel,
      subject: selectedSubject,
      examBoard: selectedBoard,
      type: activeTab === 'all' || activeTab === 'upload' ? 'all' : activeTab,
      topic: selectedTopic,
      searchQuery: searchQuery,
    });
  }, [selectedLevel, selectedSubject, selectedBoard, activeTab, selectedTopic, searchQuery]);

  const handleResetFilters = () => {
    setSelectedLevel('all');
    setSelectedSubject('all');
    setSelectedBoard('all');
    setSelectedTopic('All Topics');
    setSearchQuery('');
  };

  const handleSelectResource = (resource) => {
    if (onLoadResource) {
      onLoadResource(resource);
    }
  };

  const handleInsertNotes = (resource) => {
    if (onInsertMarkSchemeNotes) {
      onInsertMarkSchemeNotes(resource);
    }
  };

  const getLevelBadgeStyle = (level) => {
    switch (level) {
      case 'alevel':
        return styles.badgeAlevel;
      case 'gcse':
        return styles.badgeGcse;
      case '11plus':
        return styles.badge11plus;
      default:
        return styles.badgeDefault;
    }
  };

  const getLevelBadgeText = (level) => {
    switch (level) {
      case 'alevel': return 'A-Level';
      case 'gcse': return 'GCSE';
      case '11plus': return '11+ / KS2';
      default: return level;
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Top Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleBox}>
              <View style={styles.headerTitleRow}>
                <Text style={styles.headerIcon}>📚</Text>
                <Text style={styles.modalTitle}>Resource Bank & Past Papers</Text>
              </View>
              <Text style={styles.modalSubtitle}>
                Import GCSE & A-Level papers, topic worksheets, or upload your own files for this session.
              </Text>
            </View>

            <View style={styles.headerRightActions}>
              {/* Quick direct file upload button in header (Retaining in-session import) */}
              <TouchableOpacity
                style={styles.headerUploadBtn}
                onPress={() => {
                  if (onUploadCustomPdf) onUploadCustomPdf();
                }}
                title="Directly upload any PDF from your computer"
              >
                <Text style={styles.headerUploadBtnText}>📁 Upload from Device</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} title="Close Resource Bank">
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabNavRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
                🌟 All Resources ({resources.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'past_paper' && styles.tabBtnActive]}
              onPress={() => setActiveTab('past_paper')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'past_paper' && styles.tabBtnTextActive]}>
                📑 Exam Papers
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'topic_worksheet' && styles.tabBtnActive]}
              onPress={() => setActiveTab('topic_worksheet')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'topic_worksheet' && styles.tabBtnTextActive]}>
                📝 Topic Worksheets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'upload' && styles.tabBtnActive]}
              onPress={() => setActiveTab('upload')}
            >
              <Text style={[styles.tabBtnText, activeTab === 'upload' && styles.tabBtnTextActive]}>
                📤 Upload Custom File
              </Text>
            </TouchableOpacity>

            {onOpenDojoQuiz && (
              <TouchableOpacity
                style={[styles.tabBtn, styles.dojoQuizTabBtn]}
                onPress={() => {
                  onClose();
                  onOpenDojoQuiz();
                }}
              >
                <Text style={styles.dojoQuizTabBtnText}>
                  🎯 11+ Dojo Quiz Generator ↗
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Dedicated Custom Upload Tab View */}
          {activeTab === 'upload' ? (
            <ScrollView style={styles.uploadTabContent} contentContainerStyle={styles.uploadTabContainer}>
              <View style={styles.uploadCard}>
                <View style={styles.uploadIconCircle}>
                  <Text style={styles.uploadLargeIcon}>📂</Text>
                </View>
                <Text style={styles.uploadCardTitle}>Import Any PDF File from Your Device</Text>
                <Text style={styles.uploadCardDesc}>
                  You can upload any past exam paper, textbook scan, school homework sheet, or custom revision worksheet directly from your computer during this live tutoring session.
                </Text>

                <View style={styles.uploadFeaturesList}>
                  <View style={styles.uploadFeatureItem}>
                    <Text style={styles.uploadFeatureBullet}>✨</Text>
                    <Text style={styles.uploadFeatureText}>Renders at high-definition vector quality on the collaborative whiteboard.</Text>
                  </View>
                  <View style={styles.uploadFeatureItem}>
                    <Text style={styles.uploadFeatureBullet}>📑</Text>
                    <Text style={styles.uploadFeatureText}>Multi-page support: navigate through questions page by page with full pen & annotation sync.</Text>
                  </View>
                  <View style={styles.uploadFeatureItem}>
                    <Text style={styles.uploadFeatureBullet}>🔄</Text>
                    <Text style={styles.uploadFeatureText}>Append option: add pages to your ongoing session without losing existing student drawings.</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.uploadPrimaryBtn}
                  onPress={() => {
                    if (onUploadCustomPdf) onUploadCustomPdf();
                  }}
                >
                  <Text style={styles.uploadPrimaryBtnText}>📁 Choose PDF from Computer</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <View style={styles.mainContentLayout}>
              {/* Filter Controls Bar */}
              <View style={styles.filterSection}>
                {/* Search Bar */}
                <View style={styles.searchRow}>
                  <View style={styles.searchInputWrapper}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search papers, topics (e.g. Pure, Quadratics, Paper 1, Forces)..."
                      placeholderTextColor="#94A3B8"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                        <Text style={styles.clearSearchText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {(selectedLevel !== 'all' || selectedSubject !== 'all' || selectedBoard !== 'all' || selectedTopic !== 'All Topics' || searchQuery) && (
                    <TouchableOpacity onPress={handleResetFilters} style={styles.resetFiltersBtn}>
                      <Text style={styles.resetFiltersText}>Reset Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Chips Bar */}
                <View style={styles.filterRow}>
                  {/* Level Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>LEVEL:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {RESOURCE_LEVELS.map(lvl => (
                        <TouchableOpacity
                          key={lvl.id}
                          style={[styles.filterChip, selectedLevel === lvl.id && styles.filterChipActive]}
                          onPress={() => {
                            setSelectedLevel(lvl.id);
                            setSelectedTopic('All Topics');
                          }}
                        >
                          <Text style={[styles.filterChipText, selectedLevel === lvl.id && styles.filterChipTextActive]}>
                            {lvl.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  {/* Subject Filter */}
                  <View style={styles.filterGroup}>
                    <Text style={styles.filterLabel}>SUBJECT:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                      {RESOURCE_SUBJECTS.map(sub => (
                        <TouchableOpacity
                          key={sub.id}
                          style={[styles.filterChip, selectedSubject === sub.id && styles.filterChipActive]}
                          onPress={() => {
                            setSelectedSubject(sub.id);
                            setSelectedTopic('All Topics');
                          }}
                        >
                          <Text style={[styles.filterChipText, selectedSubject === sub.id && styles.filterChipTextActive]}>
                            {sub.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                {/* Exam Board & Topic Filter Row */}
                <View style={styles.secondaryFilterRow}>
                  <View style={styles.boardFilterBox}>
                    <Text style={styles.filterLabelSmall}>EXAM BOARD:</Text>
                    <View style={styles.boardChipsRow}>
                      {EXAM_BOARDS.map(b => (
                        <TouchableOpacity
                          key={b.id}
                          style={[styles.boardChip, selectedBoard === b.id && styles.boardChipActive]}
                          onPress={() => setSelectedBoard(b.id)}
                        >
                          <Text style={[styles.boardChipText, selectedBoard === b.id && styles.boardChipTextActive]}>
                            {b.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Topic Filter */}
                  {availableTopics.length > 1 && (
                    <View style={styles.topicFilterBox}>
                      <Text style={styles.filterLabelSmall}>TOPIC FOCUS:</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicChipsScroll}>
                        {availableTopics.map(t => (
                          <TouchableOpacity
                            key={t}
                            style={[styles.topicChip, selectedTopic === t && styles.topicChipActive]}
                            onPress={() => setSelectedTopic(t)}
                          >
                            <Text style={[styles.topicChipText, selectedTopic === t && styles.topicChipTextActive]}>
                              {t}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Resource Cards List */}
              <ScrollView style={styles.cardsScroll} contentContainerStyle={styles.cardsContainer}>
                {/* In-Session Quick Upload Reminder Banner */}
                <View style={styles.inSessionUploadBanner}>
                  <View style={styles.uploadBannerLeft}>
                    <Text style={styles.uploadBannerIcon}>💡</Text>
                    <View>
                      <Text style={styles.uploadBannerTitle}>Need a custom worksheet or paper from your device?</Text>
                      <Text style={styles.uploadBannerSubtitle}>
                        You can import any local PDF directly into this whiteboard session at any time.
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.uploadBannerBtn}
                    onPress={() => {
                      if (onUploadCustomPdf) onUploadCustomPdf();
                    }}
                  >
                    <Text style={styles.uploadBannerBtnText}>📁 Upload File</Text>
                  </TouchableOpacity>
                </View>

                {resources.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🔍</Text>
                    <Text style={styles.emptyTitle}>No matching resources found</Text>
                    <Text style={styles.emptyDesc}>
                      Try adjusting your level, subject, or topic filters, or upload your own file.
                    </Text>
                    <TouchableOpacity style={styles.emptyResetBtn} onPress={handleResetFilters}>
                      <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  resources.map(item => {
                    const isExpanded = expandedMarkSchemeId === item.id;
                    return (
                      <View key={item.id} style={styles.resourceCard}>
                        <View style={styles.cardHeader}>
                          <View style={styles.badgeRow}>
                            <View style={[styles.badgeBase, getLevelBadgeStyle(item.level)]}>
                              <Text style={styles.badgeText}>{getLevelBadgeText(item.level)}</Text>
                            </View>

                            {item.examBoard && (
                              <View style={[styles.badgeBase, styles.badgeBoard]}>
                                <Text style={styles.badgeTextBoard}>{item.examBoard.toUpperCase()}</Text>
                              </View>
                            )}

                            {item.tier && (
                              <View style={[styles.badgeBase, styles.badgeTier]}>
                                <Text style={styles.badgeTextTier}>{item.tier} Tier</Text>
                              </View>
                            )}

                            <View style={[styles.badgeBase, item.type === 'past_paper' ? styles.badgePaper : styles.badgeWorksheet]}>
                              <Text style={styles.badgeTextType}>
                                {item.type === 'past_paper' ? 'Past Paper' : 'Topic Worksheet'}
                              </Text>
                            </View>

                            <View style={styles.pageCountBadge}>
                              <Text style={styles.pageCountText}>📄 {item.pageCount} Pages</Text>
                            </View>
                          </View>

                          {item.year && (
                            <Text style={styles.cardYear}>
                              {item.year} {item.series ? `(${item.series})` : ''}
                            </Text>
                          )}
                        </View>

                        <Text style={styles.cardTitle}>{item.title}</Text>
                        {item.description ? (
                          <Text style={styles.cardDescription}>{item.description}</Text>
                        ) : null}

                        {/* Topics Covered */}
                        {item.topics && item.topics.length > 0 && (
                          <View style={styles.topicsTagsRow}>
                            {item.topics.map(t => (
                              <View key={t} style={styles.topicTag}>
                                <Text style={styles.topicTagText}>#{t}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Mark Scheme Preview Collapsible Drawer */}
                        {isExpanded && item.markSchemeNotes && (
                          <View style={styles.markSchemeBox}>
                            <View style={styles.markSchemeHeader}>
                              <Text style={styles.markSchemeTitle}>📋 Mark Scheme & Solution Guide</Text>
                              <TouchableOpacity onPress={() => setExpandedMarkSchemeId(null)}>
                                <Text style={styles.markSchemeCloseText}>Close ✕</Text>
                              </TouchableOpacity>
                            </View>
                            <ScrollView style={styles.markSchemeScroll}>
                              <Text style={styles.markSchemeBody}>{item.markSchemeNotes}</Text>
                            </ScrollView>
                          </View>
                        )}

                        {/* Card Action Buttons */}
                        <View style={styles.cardActionsRow}>
                          <TouchableOpacity
                            style={styles.loadPaperBtn}
                            onPress={() => handleSelectResource(item)}
                          >
                            <Text style={styles.loadPaperBtnText}>📥 Load into Session</Text>
                          </TouchableOpacity>

                          {item.markSchemeNotes && (
                            <>
                              <TouchableOpacity
                                style={styles.previewSchemeBtn}
                                onPress={() => setExpandedMarkSchemeId(isExpanded ? null : item.id)}
                              >
                                <Text style={styles.previewSchemeBtnText}>
                                  {isExpanded ? 'Hide Answers' : '👁️ View Answers'}
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.insertNotesBtn}
                                onPress={() => handleInsertNotes(item)}
                                title="Appends the mark scheme into the tutor session notes"
                              >
                                <Text style={styles.insertNotesBtnText}>
                                  📝 Copy to Notes
                                </Text>
                              </TouchableOpacity>
                            </>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <Text style={styles.footerHint}>
              💡 Tip: When you load a paper, you can choose to append its pages to your existing lesson whiteboard or start fresh.
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.footerCloseBtn}>
              <Text style={styles.footerCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 9999,
  },
  modalContainer: {
    width: '94%',
    maxWidth: 1100,
    height: '90%',
    maxHeight: 850,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },

  // Modal Header
  modalHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 22,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerUploadBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#CBD5E1',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Tab Navigation
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#172554',
    borderBottomWidth: 1,
    borderBottomColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    backgroundColor: 'transparent',
  },
  tabBtnActive: {
    backgroundColor: '#0F172A',
    borderTopWidth: 2,
    borderTopColor: '#38BDF8',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#93C5FD',
  },
  tabBtnTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  dojoQuizTabBtn: {
    marginLeft: 'auto',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    marginBottom: 4,
  },
  dojoQuizTabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Main Layout
  mainContentLayout: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },

  // Filter Section
  filterSection: {
    padding: 16,
    backgroundColor: '#131D31',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    gap: 12,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 13,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  resetFiltersBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#334155',
    borderRadius: 6,
  },
  resetFiltersText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },

  // Filter Chips Bar
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexGrow: 0,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#60A5FA',
  },
  filterChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Secondary Filter Row
  secondaryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 4,
  },
  boardFilterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterLabelSmall: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  boardChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  boardChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  boardChipActive: {
    backgroundColor: '#0284C7',
  },
  boardChipText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  boardChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  topicFilterBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 500,
  },
  topicChipsScroll: {
    flexGrow: 0,
  },
  topicChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#1E293B',
    marginRight: 6,
  },
  topicChipActive: {
    backgroundColor: '#7C3AED',
  },
  topicChipText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  topicChipTextActive: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  // In-Session Quick Upload Reminder Banner
  inSessionUploadBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#38BDF844',
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  uploadBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  uploadBannerIcon: {
    fontSize: 20,
  },
  uploadBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  uploadBannerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  uploadBannerBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  uploadBannerBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // Cards List
  cardsScroll: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
    gap: 12,
  },
  resourceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  badgeBase: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGcse: {
    backgroundColor: '#6D28D9',
  },
  badgeAlevel: {
    backgroundColor: '#1D4ED8',
  },
  badge11plus: {
    backgroundColor: '#047857',
  },
  badgeDefault: {
    backgroundColor: '#475569',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  badgeBoard: {
    backgroundColor: '#0F766E',
  },
  badgeTextBoard: {
    fontSize: 10,
    fontWeight: '700',
    color: '#CCFBF1',
  },
  badgeTier: {
    backgroundColor: '#334155',
  },
  badgeTextTier: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  badgePaper: {
    backgroundColor: '#3730A3',
  },
  badgeWorksheet: {
    backgroundColor: '#854D0E',
  },
  badgeTextType: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FEF08A',
  },
  pageCountBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  pageCountText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  cardYear: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  cardDescription: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 10,
  },
  topicsTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  topicTag: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  topicTagText: {
    fontSize: 11,
    color: '#38BDF8',
  },

  // Mark Scheme Drawer
  markSchemeBox: {
    backgroundColor: '#0B1329',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E3A8A',
    padding: 12,
    marginBottom: 12,
  },
  markSchemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 6,
    marginBottom: 8,
  },
  markSchemeTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#60A5FA',
  },
  markSchemeCloseText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  markSchemeScroll: {
    maxHeight: 160,
  },
  markSchemeBody: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    fontFamily: Platform.select({ web: 'monospace', default: undefined }),
  },

  // Card Action Buttons
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  loadPaperBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  loadPaperBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  previewSchemeBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  previewSchemeBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
  insertNotesBtn: {
    backgroundColor: '#1E3A8A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  insertNotesBtnText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 400,
    marginBottom: 16,
  },
  emptyResetBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emptyResetBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },

  // Upload Tab View
  uploadTabContent: {
    flex: 1,
  },
  uploadTabContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    padding: 32,
    alignItems: 'center',
    maxWidth: 650,
    width: '100%',
  },
  uploadIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadLargeIcon: {
    fontSize: 32,
  },
  uploadCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadCardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  uploadFeaturesList: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 16,
    gap: 10,
    marginBottom: 24,
  },
  uploadFeatureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  uploadFeatureBullet: {
    fontSize: 14,
  },
  uploadFeatureText: {
    flex: 1,
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  uploadPrimaryBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Modal Footer
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerHint: {
    fontSize: 12,
    color: '#94A3B8',
    flex: 1,
  },
  footerCloseBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  footerCloseBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
});
