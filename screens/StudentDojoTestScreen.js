import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Platform, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRandomQuiz, getQuiz } from '../utils/quickQuizGenerator';
import { fetchEnglishQuiz } from '../utils/englishLoader';
import { getRecommendation } from '../utils/recommendations';
import { getStats } from '../utils/storage';
import { useFocusEffect } from '@react-navigation/native';

const Colors = {
  primary: '#4DA6FF', // Soft Blue
  secondary: '#FFD700', // Gold
  green: '#4CAF50',
  orange: '#FF9800',
  purple: '#9C27B0',
  background: '#F0F2F5',
  white: '#FFFFFF',
  text: '#2C3E50',
  cardBg: '#FFFFFF',
};

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

export const StudentDojoTestScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [isLoadingEnglish, setIsLoadingEnglish] = React.useState(false);
  const [recommendation, setRecommendation] = React.useState(null);

  useFocusEffect(
    React.useCallback(() => {
      const load = async () => {
        const s = await getStats();
        const rec = getRecommendation(s);
        setRecommendation(rec);
      };
      load();
    }, [])
  );

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

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            {/* Header Logo Placeholder */}
            <Text style={{ fontSize: 24, fontWeight: 'bold' }}>11PlusNinja (TEST)</Text>
            <TouchableOpacity style={{ padding: 10 }}>
              <Text style={{ fontSize: 24 }}>⚙️</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>Welcome to the Test Dojo!</Text>
        </View>

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

        <Text style={styles.sectionHeader}>Subjects (Placeholders):</Text>

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
  subtitle: {
    fontSize: 18,
    color: '#666',
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
});
