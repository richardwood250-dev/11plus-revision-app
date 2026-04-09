import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRandomQuiz, getQuiz } from '../utils/quickQuizGenerator';
import { fetchEnglishQuiz } from '../utils/englishLoader';
import { getRecommendation } from '../utils/recommendations';
import { getStats, getProfiles, switchProfile } from '../utils/storage';
import { getDailyWord } from '../data/vocab';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '../constants/Colors';
import { FlatIcon } from '../components/Icons';
import { Header } from '../components/Header';



export const StudentHomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isLoadingEnglish, setIsLoadingEnglish] = React.useState(false);
  const [recommendation, setRecommendation] = React.useState(null);
  const [streak, setStreak] = React.useState(0);
  const [stats, setStats] = React.useState(null);
  const [profiles, setProfiles] = React.useState([]);
  const [activeProfile, setActiveProfile] = React.useState(null);
  const [showProfileSwitcher, setShowProfileSwitcher] = React.useState(false);
  const [showStatsModal, setShowStatsModal] = React.useState(false);
  const [showWordModal, setShowWordModal] = React.useState(false);

  const handleQuickStart = async () => {
    if (recommendation) {
        if (recommendation.type === 'route') {
          navigation.navigate(recommendation.route);
          return;
        } else if (recommendation.type === 'action' || recommendation.action) {
          if (recommendation.action) {
             recommendation.action();
          } else {
             getRandomQuiz();
          }
          return;
        } else if (recommendation.type === 'quiz' || recommendation.config) {
          const { subject, topic } = recommendation.config;
          if (subject === 'English' && topic === 'Comprehension') {
            try {
              setIsLoadingEnglish(true);
              const data = await fetchEnglishQuiz();
              setIsLoadingEnglish(false);
              navigation.navigate('Comprehension', data);
            } catch (err) {
              setIsLoadingEnglish(false);
              alert("Error: Could not load quiz: " + err.message);
            }
          } else {
            const quizData = getQuiz(subject, topic);
            navigation.navigate('Quiz', quizData);
          }
          return;
        }
    }
    
    // Fallback
    const quizConfig = getRandomQuiz();
    if (quizConfig.config.subject === 'English') {
      try {
        setIsLoadingEnglish(true);
        const data = await fetchEnglishQuiz();
        setIsLoadingEnglish(false);
        navigation.navigate('Comprehension', data);
      } catch (err) {
        setIsLoadingEnglish(false);
        alert("Error: Could not load quiz: " + err.message);
      }
    } else {
      navigation.navigate('Quiz', quizConfig);
    }
  };
  const loadData = async () => {
    const s = await getStats();
    setStats(s);
    if (s) setStreak(s.streak || 0);
    const rec = getRecommendation(s);
    setRecommendation(rec);

    // Load profiles
    const allProfiles = await getProfiles();
    setProfiles(allProfiles);

    // Determine active profile from import (optional, but good for UI)
    const { getProfile } = require('../utils/storage');
    const active = await getProfile();
    setActiveProfile(active);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const handleSwitchProfile = async (id) => {
    await switchProfile(id);
    setShowProfileSwitcher(false);
    loadData(); // Reload stats and recommendation for the new user
  };

  const handleSubjectPress = (title) => {
    if (title === 'Maths') {
      navigation.navigate('QuizConfig', { subject: 'Maths' });
    } else if (title === 'English') {
      navigation.navigate('QuizConfig', { subject: 'English' });
    } else if (title === 'Verbal') {
      navigation.navigate('QuizConfig', { subject: 'Verbal' });
    } else if (title === 'Non-Verbal') {
      navigation.navigate('QuizConfig', { subject: 'Non-Verbal' });
    } else {
      alert(`Pressed ${title} (Test Mode)`);
    }
  };

  const SubjectBtn = ({ title, color, type }) => {
    return (
      <TouchableOpacity
        style={[{ backgroundColor: 'white', borderColor: color, borderWidth: 2, borderRadius: 15, width: '100%', height: 60, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', paddingHorizontal: 15, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 }]}
        onPress={() => handleSubjectPress(title)}
      >
        <View style={{ transform: [{ scale: 0.5 }], marginRight: 10, marginLeft: -10 }}>
            <FlatIcon type={type} />
        </View>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: Colors.text }}>{title}</Text>
      </TouchableOpacity>
    );
  };

  const DailyVocabCard = () => {
    const wordOfDay = React.useMemo(() => getDailyWord(), []);

    return (
      <View style={styles.vocabContainer}>
        <View style={styles.vocabHeader}>
          <Text style={styles.vocabTitle}>Word of the Day</Text>
          <Text style={styles.vocabBadge}>{wordOfDay.belt} Belt</Text>
        </View>
        <Text style={styles.wordText}>{wordOfDay.word}</Text>
        <Text style={styles.wordType}>({wordOfDay.type})</Text>
        <Text style={styles.wordDefinition}>{wordOfDay.definition}</Text>
        <View style={styles.synonymContainer}>
          <Text style={styles.synonyms}>Synonyms: {wordOfDay.synonyms}</Text>
        </View>
        <TouchableOpacity 
          style={styles.vocabGameBtn} 
          onPress={() => navigation.navigate('VocabGame')}
        >
          <Text style={styles.vocabGameBtnText}>Start Training</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Header activeTab="student" />

        {/* Profile Switcher Modal */}
        {showProfileSwitcher && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Who's Playing?</Text>

              {profiles.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.profileBtn, activeProfile?.id === p.id && styles.activeProfileBtn]}
                  onPress={() => handleSwitchProfile(p.id)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.iconTextModal}>{p.icon || '🤖'}</Text>
                    <Text style={[styles.profileBtnText, activeProfile?.id === p.id && { color: 'white' }]}>{p.name}</Text>
                  </View>
                  {activeProfile?.id === p.id && <Text style={{ color: 'white' }}>✓</Text>}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.profileBtn, { backgroundColor: '#E5E7EB', borderColor: 'transparent' }]}
                onPress={() => {
                  setShowProfileSwitcher(false);
                  navigation.navigate('Setup');
                }}
              >
                <Text style={styles.profileBtnText}>+ Add New Student</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setShowProfileSwitcher(false)}
              >
                <Text style={styles.closeModalText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Dashboard Stats Modal */}
        {showStatsModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Your Progress 📊</Text>
              <View style={styles.snapshotStats}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Day Streak</Text>
                  <Text style={styles.statValue}>🔥 {streak}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total Questions</Text>
                  <Text style={styles.statValue}>{stats?.totalQuestions || 0}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.vocabGameBtn} onPress={() => { setShowStatsModal(false); navigation.navigate('Dashboard'); }}>
                <Text style={styles.vocabGameBtnText}>View Full Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowStatsModal(false)}>
                <Text style={styles.closeModalText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Daily Word Modal */}
        {showWordModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <DailyVocabCard />
              <TouchableOpacity style={styles.closeModalBtn} onPress={() => setShowWordModal(false)}>
                <Text style={styles.closeModalText}>Close Modals</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.contentContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 }}>
            <Text style={styles.subtitle}>Hi, {activeProfile?.name || 'Student'}!</Text>
            <TouchableOpacity onPress={() => setShowProfileSwitcher(true)} style={styles.switchUserBtn}>
              <Text style={styles.switchUserBtnText}>{profiles.length > 1 ? 'Switch User' : '+ Add User'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- TOP ACTION ROW --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 }}>
           <TouchableOpacity style={[styles.topActionBtn, { backgroundColor: Colors.primary }]} onPress={handleQuickStart}>
              <Text style={styles.topActionIcon}>⚡</Text>
              <Text style={styles.topActionText}>Quick Play</Text>
           </TouchableOpacity>

           <TouchableOpacity style={[styles.topActionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => setShowStatsModal(true)}>
              <Text style={styles.topActionIcon}>📊</Text>
              <Text style={styles.topActionText}>Stats</Text>
           </TouchableOpacity>

           <TouchableOpacity style={[styles.topActionBtn, { backgroundColor: '#F59E0B' }]} onPress={() => setShowWordModal(true)}>
              <Text style={styles.topActionIcon}>📖</Text>
              <Text style={styles.topActionText}>Daily Word</Text>
           </TouchableOpacity>
        </View>

        {/* --- DUAL COLUMN CONTENT --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
           
           {/* LEFT COLUMN: Dojos */}
           <View style={{ width: '48%' }}>
              <Text style={[styles.sectionHeader, { fontSize: 18 }]}>Training Dojos</Text>
              <TouchableOpacity 
                style={[styles.vocabContainer, { borderLeftColor: '#3B82F6', marginTop: 5, marginBottom: 12, padding: 15 }]} 
                onPress={() => navigation.navigate('MathsSkillsHome')}
              >
                <Text style={[styles.vocabTitle, { color: '#3B82F6', fontSize: 16 }]}>Maths</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Mental Drills</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.vocabContainer, { borderLeftColor: '#10B981', marginTop: 0, marginBottom: 12, padding: 15 }]} 
                onPress={() => navigation.navigate('EnglishSkillsHome')}
              >
                <Text style={[styles.vocabTitle, { color: '#10B981', fontSize: 16 }]}>Words</Text>
                <Text style={{ fontSize: 12, color: '#666', marginTop: 5 }}>Grammar & Spelling</Text>
              </TouchableOpacity>
           </View>

           {/* RIGHT COLUMN: Trials */}
           <View style={{ width: '48%' }}>
              <Text style={[styles.sectionHeader, { fontSize: 18 }]}>11+ Mock Trials</Text>
              <SubjectBtn title="Maths" color={Colors.primary} type="maths" />
              <SubjectBtn title="English" color={Colors.orange} type="english" />
              <SubjectBtn title="Verbal" color={Colors.purple} type="verbal" />
              <SubjectBtn title="NonVerbal" color={Colors.green} type="non-verbal" />
           </View>

        </View>



        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2F5',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    marginTop: 5,
    width: '100%',
    alignItems: 'center',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10
  },
  contentContainer: {
    width: '100%',
    alignItems: 'flex-start',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  subjectPill: {
    width: 100,
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  subjectPillText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginTop: -10, // Offset the icon scale
  },
  subjectsScroll: {
    paddingVertical: 5,
    paddingHorizontal: 0,
  },
  dashboardSnapshot: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  snapshotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  snapshotTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
  },
  snapshotAction: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  snapshotStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  heroCard: {
    width: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 20,
    padding: 24,
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: '600',
  },
  iconBase: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  iconText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2C3E50',
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
  },
  logoContainer: {
    padding: 5,
  },
  headerLogo: {
    width: 200,
    height: 40,
  },
  vocabContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginTop: 15,
    marginBottom: 25,
    width: '100%',
    borderLeftWidth: 5,
    borderLeftColor: '#F59E0B',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  vocabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vocabTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  vocabBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    backgroundColor: '#FFFBEB',
    color: '#D97706',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  wordText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 2,
  },
  wordType: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#6B7280',
    marginBottom: 10,
  },
  wordDefinition: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 12,
  },
  synonymContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  synonyms: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  switchUserBtn: {
    backgroundColor: '#E5E7EB',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  switchUserBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4B5563',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    width: '85%',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  profileBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    marginBottom: 10,
  },
  activeProfileBtn: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  profileBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  iconTextModal: {
    fontSize: 20,
    marginRight: 10,
  },
  closeModalBtn: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  vocabGameBtn: {
    backgroundColor: '#BE1E2D',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  vocabGameBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  topActionBtn: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 15,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  topActionIcon: {
    fontSize: 24,
    marginBottom: 5,
  },
  topActionText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  }
});
