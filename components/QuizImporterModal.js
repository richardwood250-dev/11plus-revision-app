import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, TextInput, StyleSheet,
  ActivityIndicator, ScrollView, Platform, Image
} from 'react-native';
import {
  SUBJECTS,
  getTopicsForSubject,
  queryQuizQuestions,
  generateMainSiteQuiz,
  renderQuestionWorksheetCanvas,
} from '../utils/classroomQuizService';

export const QuizImporterModal = ({
  visible,
  onClose,
  onLoadQuestion,
  onLoadQuizSet,
  onInsertNotes,
  onInsertFullQuizNotes,
}) => {
  // Modal View Mode: 'entire-quiz' | 'browse-questions'
  const [modalMode, setModalMode] = useState('entire-quiz');

  // Shared Subject & Topic State
  const [selectedSubject, setSelectedSubject] = useState('maths');
  const [selectedTopic, setSelectedTopic] = useState('All Topics');
  const [quizLength, setQuizLength] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState('all');
  const [quizSeed, setQuizSeed] = useState(0); // increment to re-roll

  // Single Question Browse State
  const [searchQuery, setSearchQuery] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTutorAnswer, setShowTutorAnswer] = useState(false);

  // Loading / Rendering State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');

  // Available topics for selected subject
  const topics = useMemo(() => {
    return getTopicsForSubject(selectedSubject);
  }, [selectedSubject]);

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
    setSelectedTopic('All Topics');
    setCurrentIndex(0);
    setShowTutorAnswer(false);
    // Adjust standard quiz length per subject
    if (subjectId === 'nonverbal') {
      setQuizLength(8);
    } else if (subjectId === 'grammar') {
      setQuizLength(12);
    } else {
      setQuizLength(10);
    }
  };

  // Generate Entire Main-Site Quiz
  const fullQuiz = useMemo(() => {
    return generateMainSiteQuiz({
      subject: selectedSubject,
      topic: selectedTopic,
      length: quizLength,
      difficulty: quizDifficulty,
    });
  }, [selectedSubject, selectedTopic, quizLength, quizDifficulty, quizSeed]);

  // Filtered questions list for Single Question Browser
  const questions = useMemo(() => {
    return queryQuizQuestions({
      subject: selectedSubject,
      topic: selectedTopic,
      searchTerm: searchQuery,
      limit: 150,
    });
  }, [selectedSubject, selectedTopic, searchQuery]);

  const currentQuestion = questions[currentIndex] || questions[0] || null;

  // Single Browser Nav
  const handleNext = () => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % questions.length);
    setShowTutorAnswer(false);
  };

  const handlePrev = () => {
    if (questions.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + questions.length) % questions.length);
    setShowTutorAnswer(false);
  };

  const handleRandom = () => {
    if (questions.length === 0) return;
    const rand = Math.floor(Math.random() * questions.length);
    setCurrentIndex(rand);
    setShowTutorAnswer(false);
  };

  // -------------------------------------------------------------
  // ACTION: Import Entire Main-Site Quiz (e.g. 10 Questions)
  // -------------------------------------------------------------
  const handleImportEntireQuiz = async () => {
    if (!fullQuiz || fullQuiz.questions.length === 0) return;
    setIsProcessing(true);
    const total = fullQuiz.questions.length;
    try {
      const set = [];
      for (let i = 0; i < total; i++) {
        setProcessingMsg(`Rendering question ${i + 1} of ${total} to worksheet...`);
        const q = fullQuiz.questions[i];
        const rendered = await renderQuestionWorksheetCanvas(q, i + 1, total);
        set.push({ question: q, rendered });
      }

      const quizTitle = `${fullQuiz.title} (${total} Questions)`;
      await onLoadQuizSet(set, quizTitle);
      onClose();
    } catch (err) {
      console.error('Failed to import entire quiz:', err);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  // -------------------------------------------------------------
  // ACTION: Copy Full Quiz Marking Scheme to Session Notes
  // -------------------------------------------------------------
  const handleCopyFullQuizMarkingScheme = () => {
    if (!fullQuiz || fullQuiz.questions.length === 0) return;
    if (onInsertFullQuizNotes) {
      onInsertFullQuizNotes(fullQuiz.title, fullQuiz.questions);
    } else {
      fullQuiz.questions.forEach((q) => onInsertNotes(q));
    }
  };

  // -------------------------------------------------------------
  // ACTION: Load Single Question
  // -------------------------------------------------------------
  const handleLoadSingleQuestion = async () => {
    if (!currentQuestion) return;
    setIsProcessing(true);
    setProcessingMsg('Rendering worksheet to canvas...');
    try {
      const rendered = await renderQuestionWorksheetCanvas(currentQuestion, 1, 1);
      if (rendered) {
        await onLoadQuestion({
          question: currentQuestion,
          rendered,
        });
        onClose();
      }
    } catch (err) {
      console.error('Failed to load question to whiteboard:', err);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  // -------------------------------------------------------------
  // ACTION: Load 3-Question Practice Set
  // -------------------------------------------------------------
  const handleLoadMiniQuizSet = async () => {
    if (questions.length === 0) return;
    setIsProcessing(true);
    setProcessingMsg('Generating 3-Question Practice Set...');
    try {
      const count = Math.min(3, questions.length);
      const set = [];
      for (let i = 0; i < count; i++) {
        const q = questions[(currentIndex + i) % questions.length];
        const rendered = await renderQuestionWorksheetCanvas(q, i + 1, count);
        set.push({ question: q, rendered });
      }
      await onLoadQuizSet(set, `11+ ${selectedSubject}: 3-Question Mini Set`);
      onClose();
    } catch (err) {
      console.error('Failed to load mini set:', err);
    } finally {
      setIsProcessing(false);
      setProcessingMsg('');
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerEmoji}>🎯</Text>
            <View>
              <Text style={styles.headerTitle}>11+ Dojo Quiz Importer</Text>
              <Text style={styles.headerSubtitle}>
                Import entire quizzes or individual questions from the revision site to the tutoring whiteboard
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            nativeID="btn-close-modal" 
            accessibilityRole="button" 
            style={styles.closeBtn} 
            onPress={onClose}
          >
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Mode Switcher Tabs */}
        <View style={styles.modeTabsRow}>
          <TouchableOpacity
            nativeID="tab-entire-quiz"
            accessibilityRole="button"
            style={[styles.modeTab, modalMode === 'entire-quiz' && styles.modeTabActive]}
            onPress={() => setModalMode('entire-quiz')}
          >
            <Text style={[styles.modeTabText, modalMode === 'entire-quiz' && styles.modeTabTextActive]}>
              📑 Import Entire Quiz (Main Site Format)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            nativeID="tab-browse-questions"
            accessibilityRole="button"
            style={[styles.modeTab, modalMode === 'browse-questions' && styles.modeTabActive]}
            onPress={() => setModalMode('browse-questions')}
          >
            <Text style={[styles.modeTabText, modalMode === 'browse-questions' && styles.modeTabTextActive]}>
              🔍 Browse Individual Questions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject Pills Row */}
        <View style={styles.subjectRow}>
          {SUBJECTS.map((sub) => {
            const active = selectedSubject === sub.id;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.subjectBtn,
                  active && { backgroundColor: sub.color, borderColor: sub.color },
                ]}
                onPress={() => handleSubjectChange(sub.id)}
              >
                <Text
                  style={[
                    styles.subjectBtnText,
                    active && styles.subjectBtnTextActive,
                  ]}
                >
                  {sub.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filter Bar: Topic Select & Options */}
        <View style={styles.filterBar}>
          <View style={styles.topicSelectWrapper}>
            <Text style={styles.filterLabel}>Topic:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
              {topics.map((t) => {
                const active = selectedTopic === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[styles.topicChip, active && styles.topicChipActive]}
                    onPress={() => {
                      setSelectedTopic(t);
                      setCurrentIndex(0);
                      setShowTutorAnswer(false);
                    }}
                  >
                    <Text style={[styles.topicChipText, active && styles.topicChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Mode 1: Length Selector for Entire Quiz */}
          {modalMode === 'entire-quiz' ? (
            <View style={styles.lengthSelectWrapper}>
              <Text style={styles.filterLabel}>Questions:</Text>
              {[5, 10, 15, 20].map((len) => {
                const active = quizLength === len;
                return (
                  <TouchableOpacity
                    key={len}
                    style={[styles.lengthChip, active && styles.lengthChipActive]}
                    onPress={() => setQuizLength(len)}
                  >
                    <Text style={[styles.lengthChipText, active && styles.lengthChipTextActive]}>
                      {len} Qs {len === 10 ? '⭐' : ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity
                style={styles.rollBtn}
                onPress={() => setQuizSeed((prev) => prev + 1)}
              >
                <Text style={styles.rollBtnText}>🎲 Roll New Questions</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Mode 2: Search Input for Single Question Browser */
            <View style={styles.searchWrapper}>
              <Text style={styles.filterLabel}>Search:</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Filter by question text, keyword, or ID..."
                placeholderTextColor="#64748B"
                value={searchQuery}
                onChangeText={(text) => {
                  setSearchQuery(text);
                  setCurrentIndex(0);
                }}
              />
            </View>
          )}
        </View>

        {/* Content Body */}
        {modalMode === 'entire-quiz' ? (
          /* ============================================================ */
          /* MODE 1: ENTIRE QUIZ IMPORT (MAIN SITE FORMAT)                */
          /* ============================================================ */
          <View style={styles.previewContainer}>
            <View style={styles.quizSummaryHeader}>
              <View style={styles.quizSummaryLeft}>
                <View style={styles.quizBadgeRow}>
                  <View style={styles.quizBadge}>
                    <Text style={styles.quizBadgeText}>FORMAT: MAIN SITE DOJO QUIZ</Text>
                  </View>
                  <View style={styles.quizCountBadge}>
                    <Text style={styles.quizCountBadgeText}>{fullQuiz.questionCount} QUESTIONS</Text>
                  </View>
                  <View style={styles.quizTimeBadge}>
                    <Text style={styles.quizTimeBadgeText}>⏱️ {fullQuiz.questionCount} MINS</Text>
                  </View>
                </View>
                <Text style={styles.quizTitleText}>{fullQuiz.title}</Text>
                <Text style={styles.quizSubtitleText}>
                  Imports all {fullQuiz.questionCount} questions as an interactive multi-page test paper on the whiteboard. Both tutor and student can flip through pages 1 to {fullQuiz.questionCount} and write out calculations in real time.
                </Text>
              </View>
            </View>

            {/* List of Questions in this Quiz */}
            <ScrollView style={styles.quizQuestionsList} contentContainerStyle={styles.quizQuestionsListContent}>
              <Text style={styles.questionsListHeading}>
                Included Questions ({fullQuiz.questions.length}):
              </Text>

              {fullQuiz.questions.map((q, idx) => (
                <View key={q.id + '_' + idx} style={styles.quizItemRow}>
                  <View style={styles.quizItemNumBadge}>
                    <Text style={styles.quizItemNumText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.quizItemContent}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.quizItemId}>ID: {q.id}</Text>
                      <Text style={styles.quizItemTopic}>{q.topic}</Text>
                      {q.image && <Text style={styles.quizItemImgTag}>📷 Diagram</Text>}
                    </View>
                    <Text style={styles.quizItemPrompt} numberOfLines={2}>
                      {q.question}
                    </Text>
                    {q.options && q.options.length > 0 && (
                      <Text style={styles.quizItemOptionsSummary} numberOfLines={1}>
                        Choices: {q.options.join(' • ')}
                      </Text>
                    )}
                  </View>
                  <View style={styles.quizItemKeyBadge}>
                    <Text style={styles.quizItemKeyText}>Ans: {q.correctAnswer}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            {/* Entire Quiz Action Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.footerInfo}>
                <Text style={styles.footerNote}>
                  Loads all {fullQuiz.questionCount} questions into Excalidraw with pagination controls (◀ Page 1 / {fullQuiz.questionCount} ▶).
                </Text>
              </View>

              <View style={styles.footerActions}>
                <TouchableOpacity
                  nativeID="btn-copy-quiz-notes"
                  accessibilityRole="button"
                  style={styles.copyNotesBtn}
                  onPress={handleCopyFullQuizMarkingScheme}
                  disabled={isProcessing}
                >
                  <Text style={styles.copyNotesBtnText}>📋 Copy Answer Key to Notes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  nativeID="btn-import-entire-quiz"
                  accessibilityRole="button"
                  style={styles.importEntireBtn}
                  onPress={handleImportEntireQuiz}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.importEntireBtnText}>{processingMsg || 'Generating Pages...'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.importEntireBtnText}>
                      🚀 Import Entire {fullQuiz.questionCount}-Question Quiz 🎨
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ============================================================ */
          /* MODE 2: SINGLE QUESTION BROWSER                              */
          /* ============================================================ */
          <View style={styles.previewContainer}>
            {currentQuestion ? (
              <ScrollView style={styles.previewScroll} contentContainerStyle={styles.previewContent}>
                {/* Meta Bar */}
                <View style={styles.previewMetaRow}>
                  <View style={styles.metaBadges}>
                    <View style={styles.idBadge}>
                      <Text style={styles.idBadgeText}>ID: {currentQuestion.id}</Text>
                    </View>
                    <View style={styles.topicBadge}>
                      <Text style={styles.topicBadgeText}>{currentQuestion.topic}</Text>
                    </View>
                    {currentQuestion.difficulty && (
                      <View style={styles.diffBadge}>
                        <Text style={styles.diffBadgeText}>Level {currentQuestion.difficulty}</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.navControls}>
                    <TouchableOpacity
                      nativeID="btn-prev-q"
                      accessibilityRole="button"
                      style={styles.navBtn}
                      onPress={handlePrev}
                      disabled={questions.length <= 1}
                    >
                      <Text style={styles.navBtnText}>◀ Prev</Text>
                    </TouchableOpacity>

                    <Text style={styles.counterText}>
                      {currentIndex + 1} of {questions.length}
                    </Text>

                    <TouchableOpacity
                      nativeID="btn-next-q"
                      accessibilityRole="button"
                      style={styles.navBtn}
                      onPress={handleNext}
                      disabled={questions.length <= 1}
                    >
                      <Text style={styles.navBtnText}>Next ▶</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      nativeID="btn-random-q"
                      accessibilityRole="button"
                      style={styles.randomBtn} 
                      onPress={handleRandom}
                    >
                      <Text style={styles.randomBtnText}>🎲 Random</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {currentQuestion.passage ? (
                  <View style={styles.passageCard}>
                    <Text style={styles.passageHeader}>📖 Passage / Text:</Text>
                    <Text style={styles.passageText}>{currentQuestion.passage}</Text>
                  </View>
                ) : null}

                <Text style={styles.questionPrompt}>
                  {currentQuestion.question}
                </Text>

                {currentQuestion.image ? (
                  <View style={styles.imageCard}>
                    {Platform.OS === 'web' ? (
                      <img
                        src={currentQuestion.image}
                        alt="Question Diagram"
                        style={{
                          maxWidth: '100%',
                          maxHeight: '220px',
                          objectFit: 'contain',
                          borderRadius: '8px',
                        }}
                      />
                    ) : (
                      <Image
                        source={{ uri: currentQuestion.image }}
                        style={{ width: '100%', height: 180, resizeMode: 'contain' }}
                      />
                    )}
                  </View>
                ) : null}

                {currentQuestion.options && currentQuestion.options.length > 0 && (
                  <View style={styles.optionsContainer}>
                    <Text style={styles.optionsHeader}>Multiple Choice Options:</Text>
                    <View style={styles.optionsGrid}>
                      {currentQuestion.options.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D', 'E', 'F'][idx] || String(idx + 1);
                        return (
                          <View key={idx} style={styles.optionItem}>
                            <View style={styles.optionLetterBadge}>
                              <Text style={styles.optionLetterText}>{letter}</Text>
                            </View>
                            <Text style={styles.optionValueText}>{opt}</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}

                <View style={styles.tutorAccordion}>
                  <TouchableOpacity
                    nativeID="btn-reveal-answer"
                    accessibilityRole="button"
                    style={styles.tutorAccordionBtn}
                    onPress={() => setShowTutorAnswer(!showTutorAnswer)}
                  >
                    <Text style={styles.tutorAccordionTitle}>
                      {showTutorAnswer ? '🔒 Hide Tutor Answer Key' : '👁️ Reveal Answer Key (Tutor Only)'}
                    </Text>
                  </TouchableOpacity>

                  {showTutorAnswer && (
                    <View style={styles.tutorAnswerContent}>
                      <Text style={styles.tutorAnswerText}>
                        <Text style={{ fontWeight: 'bold', color: '#10B981' }}>Correct Answer: </Text>
                        {currentQuestion.correctAnswer}
                      </Text>
                      {currentQuestion.explanation ? (
                        <Text style={styles.tutorExplanationText}>
                          <Text style={{ fontWeight: 'bold' }}>Explanation: </Text>
                          {currentQuestion.explanation}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={styles.noQuestionsState}>
                <Text style={styles.noQuestionsEmoji}>🔍</Text>
                <Text style={styles.noQuestionsText}>No questions found for this topic or search filter.</Text>
                <TouchableOpacity
                  style={styles.resetFilterBtn}
                  onPress={() => {
                    setSelectedTopic('All Topics');
                    setSearchQuery('');
                  }}
                >
                  <Text style={styles.resetFilterBtnText}>Reset Filter</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Single Question Action Footer */}
            <View style={styles.modalFooter}>
              <View style={styles.footerInfo}>
                <Text style={styles.footerNote}>
                  Renders worksheet card directly into Excalidraw with student working out space.
                </Text>
              </View>

              <View style={styles.footerActions}>
                <TouchableOpacity
                  nativeID="btn-copy-notes"
                  accessibilityRole="button"
                  style={styles.copyNotesBtn}
                  onPress={() => onInsertNotes(currentQuestion)}
                  disabled={!currentQuestion || isProcessing}
                >
                  <Text style={styles.copyNotesBtnText}>📋 Copy to Notes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  nativeID="btn-load-quiz-set"
                  accessibilityRole="button"
                  style={styles.multiSetBtn}
                  onPress={handleLoadMiniQuizSet}
                  disabled={!currentQuestion || isProcessing || questions.length < 2}
                >
                  <Text style={styles.multiSetBtnText}>📑 Load 3-Q Mini Set</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  nativeID="btn-load-whiteboard"
                  accessibilityRole="button"
                  style={styles.importBtn}
                  onPress={handleLoadSingleQuestion}
                  disabled={!currentQuestion || isProcessing}
                >
                  {isProcessing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color="#fff" />
                      <Text style={styles.importBtnText}>{processingMsg || 'Loading...'}</Text>
                    </View>
                  ) : (
                    <Text style={styles.importBtnText}>🎨 Load Question 🚀</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  modalCard: {
    width: '100%',
    maxWidth: 900,
    height: '92%',
    maxHeight: 820,
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    backgroundColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEmoji: {
    fontSize: 26,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#0A0F1D',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  modeTabActive: {
    borderBottomColor: '#BE1E2D',
    backgroundColor: '#1E293B55',
  },
  modeTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  subjectRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  subjectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  subjectBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  subjectBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterBar: {
    paddingHorizontal: 20,
    paddingVertical: 9,
    backgroundColor: '#1E293B',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  topicSelectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    minWidth: 62,
  },
  topicsScroll: {
    flex: 1,
  },
  topicChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 6,
  },
  topicChipActive: {
    backgroundColor: '#BE1E2D',
    borderColor: '#BE1E2D',
  },
  topicChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  topicChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  lengthSelectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  lengthChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
  },
  lengthChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  lengthChipText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  lengthChipTextActive: {
    color: '#FFFFFF',
  },
  rollBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 6,
  },
  rollBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    color: '#FFFFFF',
    fontSize: 12,
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#0A0F1D',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  quizSummaryHeader: {
    padding: 16,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  quizSummaryLeft: {
    gap: 6,
  },
  quizBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quizBadge: {
    backgroundColor: '#BE1E2D22',
    borderWidth: 1,
    borderColor: '#BE1E2D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  quizBadgeText: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  quizCountBadge: {
    backgroundColor: '#2563EB22',
    borderWidth: 1,
    borderColor: '#2563EB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  quizCountBadgeText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '900',
  },
  quizTimeBadge: {
    backgroundColor: '#F59E0B22',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  quizTimeBadgeText: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '800',
  },
  quizTitleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  quizSubtitleText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 17,
  },
  quizQuestionsList: {
    flex: 1,
  },
  quizQuestionsListContent: {
    padding: 16,
    gap: 10,
  },
  questionsListHeading: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quizItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    padding: 10,
    gap: 12,
  },
  quizItemNumBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  quizItemNumText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '900',
  },
  quizItemContent: {
    flex: 1,
    gap: 3,
  },
  quizItemId: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  quizItemTopic: {
    color: '#94A3B8',
    fontSize: 11,
  },
  quizItemImgTag: {
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
  },
  quizItemPrompt: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '600',
  },
  quizItemOptionsSummary: {
    color: '#64748B',
    fontSize: 11,
  },
  quizItemKeyBadge: {
    backgroundColor: '#05966922',
    borderWidth: 1,
    borderColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quizItemKeyText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  previewScroll: {
    flex: 1,
  },
  previewContent: {
    padding: 16,
    gap: 14,
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  idBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  idBadgeText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  topicBadge: {
    backgroundColor: '#3B82F622',
    borderWidth: 1,
    borderColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topicBadgeText: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '700',
  },
  diffBadge: {
    backgroundColor: '#F59E0B22',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  diffBadgeText: {
    color: '#FBBF24',
    fontSize: 11,
    fontWeight: '700',
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  navBtnText: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  counterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  randomBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  randomBtnText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  passageCard: {
    backgroundColor: '#1E293B',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    maxHeight: 180,
  },
  passageHeader: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  passageText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
  },
  questionPrompt: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
  imageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    gap: 8,
  },
  optionsHeader: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 8,
    flexGrow: 1,
  },
  optionLetterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#BE1E2D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  optionValueText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  tutorAccordion: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tutorAccordionBtn: {
    backgroundColor: '#1E293B',
    padding: 10,
    alignItems: 'center',
  },
  tutorAccordionTitle: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  tutorAnswerContent: {
    backgroundColor: '#0F172A',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    gap: 6,
  },
  tutorAnswerText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  tutorExplanationText: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
  noQuestionsState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  noQuestionsEmoji: {
    fontSize: 36,
  },
  noQuestionsText: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
  },
  resetFilterBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerInfo: {
    flex: 1,
    minWidth: 200,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 11,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  copyNotesBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
  },
  copyNotesBtnText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  multiSetBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  multiSetBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  importBtn: {
    backgroundColor: '#BE1E2D',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  importBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  importEntireBtn: {
    backgroundColor: '#BE1E2D',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    shadowColor: '#BE1E2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  importEntireBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
});
