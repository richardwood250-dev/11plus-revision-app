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
        style={[styles.card, { backgroundColor: 'white', borderColor: color, borderWidth: 3 }]}
        onPress={() => handleSubjectPress(title)}
      >
        <FlatIcon type={type} />
        <Text style={[styles.cardText, { color: Colors.text }]}>{title}</Text>
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

        <View style={styles.contentContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 15 }}>
            <Text style={styles.subtitle}>Welcome, {activeProfile?.icon || '🥋'} {activeProfile?.name || 'Student'}!</Text>
            {profiles.length > 1 && (
              <TouchableOpacity onPress={() => setShowProfileSwitcher(true)} style={styles.switchUserBtn}>
                <Text style={styles.switchUserBtnText}>Switch User</Text>
              </TouchableOpacity>
            )}
            {profiles.length <= 1 && (
              <TouchableOpacity onPress={() => setShowProfileSwitcher(true)} style={styles.switchUserBtn}>
                <Text style={styles.switchUserBtnText}>+ Add User</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <DailyVocabCard />

        {/* --- ACTIONS ROW --- */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtnHalf, { borderColor: Colors.secondary, opacity: isLoadingEnglish ? 0.6 : 1 }]}
            disabled={isLoadingEnglish}
            onPress={async () => {
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
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 5 }}>{isLoadingEnglish ? '⏳' : '⚡'}</Text>
            <Text style={styles.actionBtnTitle}>{isLoadingEnglish ? 'Loading...' : 'Quick Start'}</Text>
          </TouchableOpacity>

          {recommendation ? (
            <TouchableOpacity
              style={[styles.actionBtnHalf, { borderColor: Colors.primary }]}
              onPress={async () => {
                if (recommendation.action) {
                  recommendation.action();
                } else if (recommendation.config) {
                  // Direct Launch Logic
                  const { subject, topic } = recommendation.config;

                  if (subject === 'English' && topic === 'Comprehension') {
                    // Special handling for English Comprehension
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
                    // Standard Quiz Generation
                    const quizData = getQuiz(subject, topic);
                    navigation.navigate('Quiz', quizData);
                  }
                }
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 5 }}>🎯</Text>
              <Text style={styles.actionBtnTitle}>Suggestion</Text>
              <Text style={styles.actionBtnSub} numberOfLines={1}>{recommendation.title}</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.actionBtnHalf, { opacity: 0.5 }]}>
              <Text style={{ fontSize: 24 }}>👍</Text>
              <Text style={styles.actionBtnTitle}>Good Luck!</Text>
            </View>
          )}
        </View>

        {/* Dashboard Button */}
        <TouchableOpacity
          style={styles.dashboardBtnMain}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>📊</Text>
            <View>
              <Text style={styles.dashboardBtnTitle}>My Dashboard</Text>
              <Text style={styles.dashboardBtnSub}>View Progress & Stats</Text>
            </View>
          </View>
          <Text style={{ fontSize: 20, color: '#666' }}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Subjects:</Text>

        <View style={styles.grid}>
          <SubjectBtn title="Maths" color={Colors.primary} type="maths" />
          <SubjectBtn title="English" color={Colors.orange} type="english" />
          <SubjectBtn title="Verbal" color={Colors.purple} type="verbal" />
          <SubjectBtn title="Non-Verbal" color={Colors.green} type="non-verbal" />
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  card: {
    width: '47%',
    aspectRatio: 1.1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardText: {
    fontWeight: 'bold',
    fontSize: 18,
    marginTop: 10,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 15,
  },
  actionBtnHalf: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    height: 150,
    borderWidth: 2,
  },
  actionBtnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2C3E50',
    textAlign: 'center'
  },
  actionBtnSub: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 2
  },
  dashboardBtnMain: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    marginBottom: 30,
    borderLeftWidth: 5,
    borderLeftColor: '#FFD700'
  },
  dashboardBtnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50'
  },
  dashboardBtnSub: {
    fontSize: 14,
    color: '#666'
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
});
