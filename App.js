import 'react-native-gesture-handler';
import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Dimensions, Platform, Linking, Image, StatusBar, Animated } from 'react-native';
import { NavigationContainer, useNavigation, useFocusEffect } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MATHS_QUIZ } from './data/maths';
import { QuizScreen } from './screens/QuizScreen';
import { QuizConfigScreen } from './screens/QuizConfigScreen';
import { TestScreen } from './screens/TestScreen';
import { ComprehensionScreen } from './screens/ComprehensionScreen';
import { getRandomQuiz } from './utils/quickQuizGenerator';
import { SetupScreen } from './screens/SetupScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { StudentDojoTestScreen } from './screens/StudentDojoTestScreen';
import { getProfile } from './utils/storage';
import { getGreeting } from './utils/motivation';

import { getRecommendation } from './utils/recommendations';
import { getProximityColor } from './utils/priority';
import { fetchEnglishQuiz } from './utils/englishLoader';
import { TutorialOverlay } from './components/TutorialOverlay';
import { getTutorialSeen, saveTutorialSeen } from './utils/storage';

import Svg, { G, Path, Circle } from 'react-native-svg';
import { db } from './firebase-config'; // Import Firebase DB
// --- Theme ---
// --- Theme ---
const Colors = {
  primary: '#4DA6FF', // Soft Blue
  secondary: '#FFD700', // Gold
  green: '#4CAF50',
  orange: '#FF9800',
  purple: '#9C27B0',
  background: '#F0F2F5', // Matches index.html pillarbox bg
  white: '#FFFFFF',
  text: '#2C3E50',
  cardBg: '#FFFFFF',
};

// --- Custom Flat Icons ---
const FlatIcon = ({ type }) => {
  if (type === 'maths') {
    return (
      <View style={[styles.iconBase, { backgroundColor: Colors.primary, borderRadius: 50 }]}>
        <Text style={styles.iconText}>÷</Text>
      </View>
    );
  }
  if (type === 'english') {
    return (
      <View style={[styles.iconBase, { backgroundColor: Colors.orange, borderRadius: 12 }]}>
        <Text style={styles.iconText}>Aa</Text>
      </View>
    );
  }
  if (type === 'verbal') {
    return (
      <View style={[styles.iconBase, { backgroundColor: Colors.purple, borderRadius: 20, borderTopRightRadius: 0 }]}>
        <Text style={styles.iconText}>...</Text>
      </View>
    );
  }
  if (type === 'non-verbal') {
    return (
      <View style={[styles.iconBase, { backgroundColor: Colors.green, transform: [{ rotate: '45deg' }], borderRadius: 10 }]}>
        <View style={{ transform: [{ rotate: '-45deg' }] }}>
          <Text style={styles.iconText}>🔷</Text>
        </View>
      </View>
    );
  }
  return null;
};

// --- Components ---

const BackgroundWatermark = () => (
  <View style={styles.watermarkContainer} pointerEvents="none">
    <Text style={styles.watermarkText}>Free 4 All</Text>
    <Text style={styles.watermarkSubtext}>EDUCATION</Text>
  </View>
);

const HomeScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [streak, setStreak] = useState(0);
  const [stats, setStats] = useState(null);
  const [isLoadingEnglish, setIsLoadingEnglish] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialSteps, setTutorialSteps] = useState([]);

  const quickStartRef = React.useRef(null);
  const dashboardRef = React.useRef(null);
  const subjectsRef = React.useRef(null);

  useEffect(() => {
    const checkTutorial = async () => {
      // TEMPORARY DISABLE: User reported blocking issues
      // const seen = await getTutorialSeen();
      // if (!seen) {
      //   setTimeout(() => {
      //     measureSteps();
      //   }, 1000);
      // }
    };
    checkTutorial();
  }, []);

  const measureSteps = () => {
    const steps = [];
    const measureRef = (ref, text) => {
      return new Promise(resolve => {
        if (ref.current) {
          ref.current.measureInWindow((x, y, width, height) => {
            if (width > 0 && height > 0) {
              resolve({ x, y, width, height, text });
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      });
    };

    Promise.all([
      measureRef(quickStartRef, "Tap 'Quick Start' (or the Lightning Bolt) to jump straight into a quiz!"),
      measureRef(dashboardRef, "Check 'My Dashboard' to see your progress, streaks, and accuracy stats."),
      measureRef(subjectsRef, "Choose a specific subject here to focus your practice.")
    ]).then(results => {
      const validSteps = results.filter(s => s !== null);
      if (validSteps.length > 0) {
        setTutorialSteps(validSteps);
        setShowTutorial(true);
      }
    });
  };

  const handleTutorialClose = async () => {
    setShowTutorial(false);
    await saveTutorialSeen();
  };

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        try {
          const p = await getProfile();
          setProfile(p);
        } catch (err) {
          console.error("Failed to load profile:", err);
        }

        const { getStats } = require('./utils/storage');
        const s = await getStats();
        setStats(s);
        if (s) setStreak(s.streak || 0);

        const rec = getRecommendation(s);
        setRecommendation(rec);
      };
      load();
    }, [])
  );

  const greeting = profile ? getGreeting(profile.name) : "Welcome Back!";

  const handleSubjectPress = (title, type) => {
    // Map lowercase types to Capitalized Subject names
    const subjectMap = {
      'maths': 'Maths',
      'english': 'English',
      'verbal': 'Verbal',
      'non-verbal': 'Non-Verbal'
    };

    const subjectName = subjectMap[type] || title;

    if (type === 'maths' || type === 'english' || type === 'verbal' || type === 'non-verbal') {
      navigation.navigate('QuizConfig', { subject: subjectName });
    } else {
      navigation.navigate('Subject', { title: title });
    }
  };

  const SubjectBtn = ({ title, color, type }) => {
    // Map type to storage subject key
    const subjectMap = {
      'maths': 'Maths',
      'english': 'English',
      'verbal': 'Verbal',
      'non-verbal': 'Non-Verbal'
    };
    const storageKey = subjectMap[type];

    // Get Stats from HomeScreen state? 
    // We need to access the 'stats' computed in HomeScreen. 
    // But SubjectBtn is defined inside, so it can access 'stats' state if it exists.
    // However, stats state is loaded in useEffect.

    // Let's assume 'stats' is available in scope (Check component definition)
    // HomeScreen has [stats, setStats] locally? 
    // Ah, HomeScreen currently doesn't fetch 'stats' into state for itself, it fetches for recommendation.
    // I need to add 'stats' state to HomeScreen.

    const priority = getProximityColor(stats, storageKey);
    const borderColor = priority.borderColor === '#ccc' ? color : priority.borderColor; // Use default if neutral
    const bgColor = priority.backgroundColor;

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: bgColor, borderColor: borderColor, borderWidth: 3 }]}
        onPress={() => handleSubjectPress(title, type)}
      >
        <FlatIcon type={type} />
        <Text style={[styles.cardText, { color: Colors.text }]}>{title}</Text>
        {priority.urgency > 0.7 && <Text style={{ fontSize: 10, color: 'red', fontWeight: 'bold' }}>Needs Practice!</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <BackgroundWatermark />
      <TutorialOverlay visible={showTutorial} steps={tutorialSteps} onClose={handleTutorialClose} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {/* Top Row: Logo & Settings */}
          <View style={styles.headerTopRow}>
            <Image source={require('./assets/ninja_header.png')} style={styles.headerLogo} resizeMode="contain" />
            <TouchableOpacity
              style={{ padding: 10 }}
              onPress={() => navigation.navigate('Settings')}
            >
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
          {/* Below: Greeting */}
          <Text style={styles.subtitle}>{greeting}</Text>
        </View>

        {/* --- ACTIONS ROW --- */}
        <View style={styles.actionRow}>
          {/* Quick Start Button (Left) */}
          <TouchableOpacity
            ref={quickStartRef}
            style={[styles.actionBtnHalf, { borderColor: Colors.secondary, opacity: isLoadingEnglish ? 0.6 : 1 }]}
            disabled={isLoadingEnglish}
            onPress={async () => {
              const quizConfig = getRandomQuiz();
              if (quizConfig.config.subject === 'English') {
                try {
                  setIsLoadingEnglish(true);
                  const data = await fetchEnglishQuiz();
                  setIsLoadingEnglish(false); // Done
                  navigation.navigate('Comprehension', data);
                } catch (err) {
                  setIsLoadingEnglish(false);
                  Alert.alert("Error", "Could not load quiz: " + err.message);
                }
              } else {
                navigation.navigate('Quiz', quizConfig);
              }
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 5 }}>{isLoadingEnglish ? '⏳' : '⚡'}</Text>
            <Text style={styles.actionBtnTitle}>{isLoadingEnglish ? 'Loading...' : 'Quick Start'}</Text>
          </TouchableOpacity>

          {/* Recommendation Button (Right) */}
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
                      const { fetchEnglishQuiz } = require('./utils/englishLoader');
                      setIsLoadingEnglish(true);
                      const data = await fetchEnglishQuiz();
                      setIsLoadingEnglish(false);
                      navigation.navigate('Comprehension', data);
                    } catch (err) {
                      setIsLoadingEnglish(false);
                      Alert.alert("Error", "Could not load quiz: " + err.message);
                    }
                  } else {
                    // Standard Quiz Generation
                    const { getQuiz } = require('./utils/quickQuizGenerator');
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

        {/* Dashboard Button (Full Width Below) */}
        <TouchableOpacity
          ref={dashboardRef}
          style={styles.dashboardBtnMain}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 24, marginRight: 10 }}>📊</Text>
            <View>
              <Text style={styles.dashboardBtnTitle}>My Dashboard</Text>
              <Text style={styles.dashboardBtnSub}>
                {streak > 0 ? `🔥 ${streak} Day Streak` : "Start a streak today!"}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 20, color: '#666' }}>→</Text>
        </TouchableOpacity>

        <Text style={styles.sectionHeader}>Subjects:</Text>

        <View style={styles.grid} ref={subjectsRef} collapsable={false}>
          <SubjectBtn title="Maths" color={Colors.primary} type="maths" />
          <SubjectBtn title="English" color={Colors.orange} type="english" />
          <SubjectBtn title="Verbal" color={Colors.purple} type="verbal" />
          <SubjectBtn title="Non-Verbal" color={Colors.green} type="non-verbal" />
        </View>

        {/* About Us / Mission Statement */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>❤️ Our Mission</Text>
          <Text style={styles.aboutText}>
            This app is designed so that all students, regardless of financial wellbeing, should have the support they need to pass the 11+ exams and a fair chance at attaining a place in their local grammar school.
          </Text>
        </View>

        <Text style={styles.copyright}>© 2026 11PlusNinja. All rights reserved.</Text>

        <TouchableOpacity
          style={{
            backgroundColor: '#1F2937', // Ninja Black
            padding: 15,
            marginHorizontal: 20,
            borderRadius: 10,
            marginTop: 30,
            marginBottom: 10,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.location.href = '/parent-dojo.html';
            } else {
              Linking.openURL('https://11plusninja.com/parent-dojo.html'); // Fallback for native
            }
          }}
        >
          <Text style={{ fontSize: 24, marginRight: 10 }}>🥋</Text>
          <View>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Parent Dojo</Text>
            <Text style={{ color: '#9CA3AF', fontSize: 12 }}>Guide for Parents</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Text style={{ textAlign: 'center', color: Colors.primary, marginTop: 10, textDecorationLine: 'underline' }}>
            Data & Privacy Policy
          </Text>
        </TouchableOpacity>

        {/* Standard footer spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

// --- Pie Chart Helper ---
const PieChart = ({ data, size = 100, onPress }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let startAngle = 0;

  if (total === 0) {
    return (
      <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="#eee" />
      </Svg>
    );
  }

  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 360;
    const endAngle = startAngle + angle;

    // Convert angle to coordinates
    const x1 = size / 2 + size / 2 * Math.cos(Math.PI * startAngle / 180);
    const y1 = size / 2 + size / 2 * Math.sin(Math.PI * startAngle / 180);
    const x2 = size / 2 + size / 2 * Math.cos(Math.PI * endAngle / 180);
    const y2 = size / 2 + size / 2 * Math.sin(Math.PI * endAngle / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = [
      `M ${size / 2} ${size / 2}`,
      `L ${x1} ${y1}`,
      `A ${size / 2} ${size / 2} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    startAngle = endAngle;

    return (
      <Path
        key={index}
        d={pathData}
        fill={item.color}
        onPress={onPress}
      />
    );
  });

  return (
    <TouchableOpacity onPress={onPress}>
      <Svg height={size} width={size}>
        {slices}
      </Svg>
    </TouchableOpacity>
  );
};

const SubjectScreen = ({ route }) => {
  const { title } = route.params;
  return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <BackgroundWatermark />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>Quiz Placeholder</Text>
      <Text style={{ fontSize: 80, marginTop: 20 }}>✅</Text>
    </View>
  );
};

const DashboardScreen = () => {
  const [stats, setStats] = useState(null);
  const isFocused = useIsFocused();
  const [profile, setProfile] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [expandedChart, setExpandedChart] = useState(null); // 'bar' or 'pie'

  useEffect(() => {
    if (isFocused) {
      const loadStats = async () => {
        const { getStats, getProfile } = require('./utils/storage');
        const data = await getStats();
        const p = await getProfile();
        setStats(data);
        setProfile(p);
      };
      loadStats();
    }
  }, [isFocused]);

  if (!stats) return <View style={styles.container}><Text>Loading...</Text></View>;

  const subjects = ['Maths', 'English', 'Verbal', 'Non-Verbal'];

  const getAcc = (subjKey) => {
    const data = stats.bySubject && stats.bySubject[subjKey];
    if (!data || !data.topics) return 0;

    // Calculate Average of Topic Averages (Rolling last 5)
    let totalTopicAcc = 0;
    let topicCount = 0;

    Object.values(data.topics).forEach(t => {
      // Prioritize recentScores if available and populated
      if (t.recentScores && t.recentScores.length > 0) {
        const sum = t.recentScores.reduce((a, b) => a + b, 0);
        totalTopicAcc += (sum / t.recentScores.length);
        topicCount++;
      } else if (t.total > 0) {
        // Fallback to lifetime if no recentScores (shouldn't happen with backfill)
        totalTopicAcc += (t.correct / t.total) * 100;
        topicCount++;
      }
    });

    if (topicCount === 0) return 0;
    return Math.round(totalTopicAcc / topicCount);
  };

  const getSubjColor = (subj) => {
    if (subj === 'Maths') return Colors.primary;
    if (subj === 'English') return Colors.orange;
    if (subj === 'Verbal') return Colors.purple;
    if (subj === 'Non-Verbal') return Colors.green;
    return '#ccc';
  };

  // Pie Data
  const pieData = subjects.map(s => ({
    value: (stats.bySubject[s]?.time || 0),
    color: getSubjColor(s),
    label: s
  })).filter(d => d.value > 0);

  // Modal Content
  const renderExpandedChart = () => (
    <Modal visible={!!expandedChart} transparent={true} animationType="fade" onRequestClose={() => setExpandedChart(null)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{expandedChart === 'bar' ? 'Accuracy Comparison' : 'Time Distribution'}</Text>

          {expandedChart === 'bar' ? (
            <View style={[styles.chartContainer, { height: 300, width: '100%' }]}>
              {subjects.map((subj) => {
                const acc = getAcc(subj);
                return (
                  <View key={subj} style={styles.chartColumn}>
                    <Text style={styles.barLabelTop}>{acc}%</Text>
                    <View style={[
                      styles.bar,
                      { height: Math.max(acc, 5) + '%', backgroundColor: getSubjColor(subj), width: 50 }
                    ]} />
                    <Text style={styles.barLabelBottom}>{subj === 'Non-Verbal' ? 'NVR' : subj}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <PieChart data={pieData} size={250} onPress={() => { }} />
              <View style={styles.legendContainer}>
                {pieData.map((d, i) => (
                  <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                    <Text style={styles.legendText}>{d.label} ({Math.round(d.value / 60)}m)</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TouchableOpacity onPress={() => setExpandedChart(null)} style={styles.closeBtnModal}>
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <BackgroundWatermark />
      {renderExpandedChart()}
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{profile ? `${profile.name}'s Progress 📊` : 'Your Progress 🏆'}</Text>

        {/* --- CHARTS ROW --- */}
        <Text style={styles.sectionHeader}>Overview</Text>
        <Text style={styles.hintText}>Tap charts to enlarge</Text>

        <View style={styles.chartsRow}>
          {/* Bar Chart (Left) */}
          <TouchableOpacity style={styles.miniChartCard} onPress={() => setExpandedChart('bar')}>
            <Text style={styles.miniChartTitle}>Accuracy</Text>
            <View style={styles.miniBarContainer}>
              {subjects.map((subj) => (
                <View key={subj} style={[styles.miniBar, {
                  height: Math.max(getAcc(subj), 10) + '%',
                  backgroundColor: getSubjColor(subj)
                }]} />
              ))}
            </View>
          </TouchableOpacity>

          {/* Pie Chart (Right) */}
          <TouchableOpacity style={styles.miniChartCard} onPress={() => setExpandedChart('pie')}>
            <Text style={styles.miniChartTitle}>Time Spent</Text>
            <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <PieChart data={pieData} size={100} onPress={() => setExpandedChart('pie')} />
            </View>
          </TouchableOpacity>
        </View>

        {/* --- RECENT ACTIVITY --- */}
        <Text style={styles.sectionHeader}>Recent Activity</Text>
        <View style={styles.historyContainer}>
          {(!stats.history || stats.history.length === 0) ? (
            <Text style={styles.placeholderText}>No quizzes played yet.</Text>
          ) : (
            stats.history.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={[styles.historyIcon, { backgroundColor: getSubjColor(item.subject) }]}>
                  <Text style={{ fontSize: 16 }}>
                    {item.subject === 'Maths' ? '÷' : item.subject === 'English' ? 'Aa' : item.subject === 'Verbal' ? '...' : '🔷'}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.historySubject}>{item.subject} - {item.topic}</Text>
                  <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View>
                  <Text style={[styles.historyScore, { color: item.accuracy > 80 ? Colors.green : item.accuracy < 50 ? Colors.error : Colors.orange }]}>
                    {item.accuracy}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>


        <Text style={styles.sectionHeader}>Detailed Breakdown</Text>
        <Text style={styles.hintText}>Select a subject to view topics</Text>

        {/* --- SUBJECT BUTTONS ROW --- */}
        <View style={styles.subjectRow}>
          {subjects.map((subj) => {
            const isSelected = selectedSubject === subj;
            return (
              <TouchableOpacity
                key={subj}
                style={[
                  styles.subjectBtnSmall,
                  {
                    backgroundColor: isSelected ? getSubjColor(subj) : 'white',
                    borderColor: getSubjColor(subj),
                    borderWidth: 1
                  }
                ]}
                onPress={() => setSelectedSubject(subj === selectedSubject ? null : subj)}
              >
                <Text style={[
                  styles.subjectBtnText,
                  { color: isSelected ? 'white' : getSubjColor(subj) }
                ]}>
                  {subj === 'Non-Verbal' ? 'NVR' : subj}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* --- DETAILS PANEL --- */}
        {selectedSubject && (
          <View style={styles.detailsContainer}>
            <View style={[styles.detailsHeader, { borderLeftColor: getSubjColor(selectedSubject) }]}>
              <Text style={styles.detailsTitle}>{selectedSubject} Topics</Text>
              <TouchableOpacity onPress={() => setSelectedSubject(null)}>
                <Text style={{ color: '#666' }}>Close x</Text>
              </TouchableOpacity>
            </View>
            {(!stats.bySubject[selectedSubject]?.topics) ? (
              <Text>No data yet.</Text>
            ) : (
              Object.entries(stats.bySubject[selectedSubject].topics).map(([topic, tData]) => {
                // Calculate Rolling Average
                let tAcc = 0;
                if (tData.recentScores && tData.recentScores.length > 0) {
                  const sum = tData.recentScores.reduce((a, b) => a + b, 0);
                  tAcc = Math.round(sum / tData.recentScores.length);
                } else if (tData.total > 0) {
                  // Fallback
                  const displayCorrect = Math.min(tData.correct, tData.total);
                  tAcc = Math.round((displayCorrect / tData.total) * 100);
                }

                return (
                  <View key={topic} style={styles.topicRowDetailed}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.topicName}>{topic}</Text>
                      <Text style={styles.topicSubText}>Recent Form (Last 5)</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.topicValue, { color: tAcc < 50 ? Colors.error : Colors.primary }]}>
                        {tAcc}%
                      </Text>
                      <View style={styles.miniBarBg}>
                        <View style={[styles.miniBarFill, { width: tAcc + '%', backgroundColor: getSubjColor(selectedSubject) }]} />
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        <TouchableOpacity
          style={[styles.mainButton, { marginTop: 40, backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc' }]}
          onPress={() => {
            Alert.alert(
              "Reset Statistics?",
              "Are you sure you want to reset your stats? Your streak will remain safe.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Reset",
                  style: "destructive",
                  onPress: async () => {
                    const { clearStats } = require('./utils/storage');
                    await clearStats();
                    setStats(null);
                    setSelectedSubject(null);
                  }
                }
              ]
            );
          }}
        >
          <Text style={[styles.btnText, { color: '#666' }]}>Reset Stats</Text>
        </TouchableOpacity>

        {/* Feedback Section */}
        <TouchableOpacity
          style={[styles.mainButton, { marginTop: 15, backgroundColor: Colors.primary }]}
          onPress={() => {
            Linking.openURL('mailto:info@11plusninja.com?subject=App Feedback');
          }}
        >
          <Text style={styles.btnText}>Give Feedback / Review</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

// Storage & Focus Import
import { useIsFocused } from '@react-navigation/native';

// --- Navigation ---

const Stack = createStackNavigator();

// ... imports ...
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// ...

// --- Ad Components ---
const AdRail = ({ side }) => (
  <View style={[
    styles.adRail,
    side === 'left' ? { left: 'calc(50% - 240px - 180px)' } : { right: 'calc(50% - 240px - 180px)' },
    Platform.OS !== 'web' && { display: 'none' } // Only show on web
  ]}>
    <View style={styles.adPlaceholder}>
      <Text style={styles.adText}>AD SPACE</Text>
      <Text style={styles.adSubText}>160 x 600</Text>
    </View>
  </View>
);

const InterstitialAd = ({ visible, onClose }) => (
  <Modal visible={visible} transparent={true} animationType="slide">
    <View style={styles.interstitialAllow}>
      <View style={styles.interstitialContent}>
        <Text style={styles.interstitialTitle}>FULL SCREEN AD</Text>
        <Text style={styles.interstitialText}>This is a simulated interstitial ad.</Text>
        <TouchableOpacity style={styles.closeAdBtn} onPress={onClose}>
          <Text style={styles.closeAdText}>Close Ad</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const { width: windowWidth } = Dimensions.get('window'); // Initial
  // Use hook for dynamic resizing on web
  const [screenW, setScreenW] = useState(Dimensions.get('window').width);

  useEffect(() => {
    const updateWidth = () => setScreenW(Dimensions.get('window').width);
    const sub = Dimensions.addEventListener('change', updateWidth);
    return () => sub?.remove();
  }, []);

  const showAds = screenW > 900;
  const [showInterstitial, setShowInterstitial] = useState(false);

  // Expose trigger globally for testing (simple hack for now)
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.triggerInterstitial = () => setShowInterstitial(true);
    }
  }, []);

  useEffect(() => {
    const checkProfile = async () => {
      console.log('[App] Checking profile...');
      console.log('[App] Firebase DB initialized:', db); // Verify Firebase connection

      // Initialize Auth (Anonymous) with Timeout
      const { initializeAuth } = require('./utils/storage');

      const authPromise = (async () => {
        await initializeAuth();
        const p = await getProfile();
        return p;
      })();

      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.warn('[App] Auth/Profile load timed out (5s). Proceeding offline.');
          resolve(null);
        }, 5000);
      });

      try {
        const p = await Promise.race([authPromise, timeoutPromise]);

        console.log('[App] Profile result:', p);
        if (!p) {
          // If null (timeout or no profile), check if we should show setup
          // For timeout, we might want to skip setup if they have data locally but just cant reach auth?
          // Actually getProfile is local storage, so it should be fast. 
          // The timeout is mainly for initializeAuth which hits network.
          // If p is null, it means no local profile OR timeout before local profile read (unlikely).

          // Let's re-read profile locally just in case auth hung but profile exists
          const localProfile = await getProfile();
          if (!localProfile) {
            console.log('[App] No profile found locally, setup needed');
            setNeedsSetup(true);
          } else {
            console.log('[App] Local profile found (auth may have timed out).');
            // We can proceed with local profile
          }
        }
        setIsReady(true);
        console.log('[App] Ready state set to true');
      } catch (e) {
        console.error('[App] Error loading profile/auth:', e);
        setIsReady(true);
      }
    };
    checkProfile();
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Loading App...</Text>
        <Text>{needsSetup ? 'Setup needed...' : 'Checking profile...'}</Text>
      </View>
    );
  }

  if (needsSetup) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SetupScreen onFinish={() => setNeedsSetup(false)} />
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, ...Platform.select({ web: { height: '100vh', backgroundColor: '#F0F2F5' } }) }}>
      <SafeAreaProvider>
        {/* Ad Rails (Web Desktop Only) */}
        {showAds && Platform.OS === 'web' && (
          <>
            <AdRail side="left" />
            <AdRail side="right" />
          </>
        )}

        <InterstitialAd visible={showInterstitial} onClose={() => setShowInterstitial(false)} />

        <View style={styles.webContainer}>
          <NavigationContainer linking={{
            prefixes: [Linking.createURL('/'), 'https://11plusninja.com'],
            config: {
              screens: {
                Settings: 'settings',
                Home: '', // Default route
                StudentDojoTest: 'test-dojo',
              }
            }
          }}>
            <Stack.Navigator screenOptions={{
              headerStyle: { backgroundColor: Colors.primary },
              headerTintColor: '#fff',
              headerStatusBarHeight: Platform.OS === 'android' ? StatusBar.currentHeight : undefined
            }}>
              <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Subject" component={SubjectScreen} options={({ route }) => ({ title: route.params.title })} />
              <Stack.Screen name="Quiz" component={QuizScreen} />
              <Stack.Screen name="QuizConfig" component={QuizConfigScreen} options={{ title: "Setup Quiz" }} />
              <Stack.Screen name="Test" component={TestScreen} options={{ title: "Maths Test" }} />
              <Stack.Screen name="Comprehension" component={ComprehensionScreen} options={{ title: "English Comprehension" }} />
              <Stack.Screen name="Dashboard" component={DashboardScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="StudentDojoTest" component={StudentDojoTestScreen} options={{ headerShown: false }} />
            </Stack.Navigator>
          </NavigationContainer>

          {/* Dev Trigger for Interstitial */}
          {!showAds && <TouchableOpacity
            style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', padding: 5, borderRadius: 5 }}
            onPress={() => setShowInterstitial(true)}
          >
            <Text style={{ color: '#fff', fontSize: 10 }}>Ad Test</Text>
          </TouchableOpacity>}
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

// --- Styles ---
const isLargeScreen = Dimensions.get('window').width > 600;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'flex-start',
    ...Platform.select({
      web: { minHeight: '100vh' } // Changed from height: 100vh and removed overflow: hidden
    })
  },
  // Wrapper for Web/Desktop/Tablet to simulate mobile view
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480, // RESIZED to 480px per requirements
    // overflow: 'hidden', // REMOVED to allow scrolling
    backgroundColor: '#fff',
    alignSelf: 'center',
    ...Platform.select({
      web: {
        minHeight: '100%', // Changed from height: 100%
        boxShadow: '0px 0px 30px rgba(0,0,0,0.2)', // Stronger shadow
        marginHorizontal: 'auto',
        paddingBottom: 20 // Ensure content isn't cut off
      },
      android: {
        elevation: isLargeScreen ? 5 : 0
      }
    })
  },
  // Ad Rail Styles
  adRail: {
    position: 'absolute', // 'fixed' in web css terms but absolute relative to root works if root is 100vh
    top: '50%',
    width: 160,
    height: 600,
    marginTop: -300, // half height to center vertically
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { position: 'fixed' } // Ensure it stays on scroll
    })
  },
  adPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E3F2FD', // Light Blue
    borderWidth: 1,
    borderColor: '#90CAF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center'
  },
  adSubText: {
    color: '#1976D2',
    fontSize: 12,
    marginTop: 5
  },
  // Interstitial Styles
  interstitialAllow: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interstitialContent: {
    width: '85%',
    height: '60%',
    backgroundColor: '#fff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  interstitialTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  },
  interstitialText: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center'
  },
  closeAdBtn: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    backgroundColor: '#333',
    borderRadius: 25
  },
  closeAdText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  // ... Rest of styles
  scrollView: {
    flex: 1,
    width: '100%',
    ...Platform.select({
      web: { height: '100%' }
    })
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 40,
  },
  header: {
    marginBottom: 10,
    marginTop: 5,
    width: '100%',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 25, // Increased from 10 to bring icons in
    marginBottom: 0
  },
  headerLogo: {
    width: '100%',
    height: 100, // Fixed height MANDATORY to prevent "whole screen" bug
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
    paddingLeft: 0
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
    backgroundColor: 'white',
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
  // Custom Icon Styles
  iconBase: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  iconText: {
    color: Colors.white,
    fontSize: 30,
    fontWeight: 'bold',
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    alignSelf: 'flex-start',
    marginBottom: 15,
    marginTop: 10,
  },
  // Actions
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
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    height: 150,
    borderWidth: 2,
    borderColor: '#E3F2FD'
  },
  actionBtnTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
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
    borderLeftColor: Colors.secondary
  },
  dashboardBtnTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text
  },
  dashboardBtnSub: {
    fontSize: 14,
    color: '#666'
  },
  // Rec Card
  recCard: {
    backgroundColor: Colors.white,
    width: '100%',
    padding: 20,
    borderRadius: 20,
    borderLeftWidth: 6,
    borderLeftColor: Colors.purple,
    elevation: 4,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  recLabel: { fontSize: 12, color: Colors.purple, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  recTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 2 },
  recReason: { fontSize: 14, color: '#666', fontStyle: 'italic' },
  // Watermark
  watermarkContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
    opacity: 0.05,
  },
  watermarkText: {
    fontSize: 60,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    transform: [{ rotate: '-30deg' }],
  },
  watermarkSubtext: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
    marginTop: -10,
    transform: [{ rotate: '-30deg' }],
  },
  // Stats Styles
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 30 },
  statCard: { backgroundColor: 'white', width: '30%', padding: 15, borderRadius: 15, alignItems: 'center', elevation: 3 },
  statIcon: { fontSize: 24, marginBottom: 5 },
  statValue: { fontSize: 20, fontWeight: 'bold', color: Colors.primary },
  statTitle: { fontSize: 12, color: '#666' },
  breakdownContainer: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 15, elevation: 2 },
  breakdownRow: { marginBottom: 15 },
  breakdownLabel: { fontWeight: 'bold', marginBottom: 5, color: '#555' },
  progressBar: { height: 10, backgroundColor: '#eee', borderRadius: 5, overflow: 'hidden', marginBottom: 5 },
  progressFill: { height: '100%', backgroundColor: Colors.green },
  breakdownValue: { width: 100, textAlign: 'right', fontWeight: 'bold' },
  // Subject Card
  subjectCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15, elevation: 2 },
  subjectHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
  subjectTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
  subjectStats: { fontSize: 14, color: '#666', marginTop: 2 },
  topicRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  topicName: { fontSize: 16, color: '#555' },
  topicValue: { fontSize: 16, fontWeight: 'bold', color: Colors.primary },
  mainButton: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30, elevation: 3 },
  // About Card
  aboutCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    marginTop: 10,
    marginBottom: 20,
    width: '100%',
    elevation: 2,
    borderTopWidth: 5,
    borderTopColor: Colors.primary,
  },
  aboutTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  aboutText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  copyright: {
    fontSize: 12,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  // --- CHART STYLES ---
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 250,
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    marginBottom: 20,
    borderBottomWidth: 4,
    borderBottomColor: '#eee'
  },
  chartColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    flex: 1,
  },
  bar: {
    width: 40,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    marginTop: 5,
  },
  barLabelTop: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 2,
  },
  barLabelBottom: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    textAlign: 'center',
  },
  hintText: {
    fontStyle: 'italic',
    color: '#888',
    marginBottom: 10,
    alignSelf: 'center',
  },
  // --- DETAILS STYLES ---
  detailsContainer: {
    width: '100%',
    minHeight: 100,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    elevation: 3,
    marginBottom: 20,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderLeftWidth: 4,
    paddingLeft: 10,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholderText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 20,
    fontSize: 16,
  },
  topicRowDetailed: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 8,
  },
  topicSubText: {
    fontSize: 12,
    color: '#999',
  },
  miniBarBg: {
    width: 60,
    height: 6,
    backgroundColor: '#eee',
    borderRadius: 3,
    marginTop: 4,
  },
  miniBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  // --- NEW DASHBOARD STYLES ---
  chartsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    width: '100%'
  },
  miniChartCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 15,
    height: 180,
    elevation: 2,
    alignItems: 'center'
  },
  miniChartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#555'
  },
  miniBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
    width: '100%'
  },
  miniBar: {
    width: 15,
    borderRadius: 3,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxHeight: '80%',
    alignItems: 'center',
    elevation: 5
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: Colors.text
  },
  closeBtnModal: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#eee',
    borderRadius: 10,
    width: '100%',
    alignItems: 'center'
  },
  closeBtnText: {
    fontWeight: 'bold',
    color: '#333'
  },
  legendContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 20,
    gap: 15
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6
  },
  legendText: {
    fontSize: 14,
    color: '#555'
  },
  // History
  historyContainer: {
    width: '100%',
    marginBottom: 30
  },
  historyItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 1
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  historySubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text
  },
  historyDate: {
    fontSize: 12,
    color: '#888'
  },
  historyScore: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  // Subject Filter Buttons
  subjectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
    gap: 10
  },
  subjectBtnSmall: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1
  },
  subjectBtnText: {
    fontWeight: 'bold',
    fontSize: 14
  }
});
