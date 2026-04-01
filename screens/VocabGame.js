import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Easing, Dimensions, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlatIcon } from '../components/Icons';
import { vocabGameBank } from '../data/vocabGameBank';

const shuffleArray = (array) => {
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
};

export const VocabGame = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const [queue, setQueue] = useState(() => shuffleArray(vocabGameBank));
  const [currentWord, setCurrentWord] = useState(queue[0]);
  const [correctCount, setCorrectCount] = useState(0);
  const [lives, setLives] = useState(3);
  const [highestBelt, setHighestBelt] = useState('White');
  const [questionsAnsweredSinceWisdom, setQuestionsAnsweredSinceWisdom] = useState(0);
  const [showWisdom, setShowWisdom] = useState(false);
  const [showRescue, setShowRescue] = useState(false);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const starAnimX = useRef(new Animated.Value(-100)).current;
  const starAnimY = useRef(new Animated.Value(Dimensions.get('window').height / 2)).current;
  const starRotate = useRef(new Animated.Value(0)).current;

  // Load Highest Belt
  useEffect(() => {
    const loadBelt = async () => {
      try {
        const storedBelt = await AsyncStorage.getItem('HIGHEST_BELT_VOCAB');
        if (storedBelt) setHighestBelt(storedBelt);
      } catch (e) {
        console.error("Failed to load belt", e);
      }
    };
    loadBelt();
  }, []);

  const getBelt = (score) => {
    if (score >= 50) return 'Black';
    if (score >= 11) return 'Green';
    return 'White';
  };

  const updateBelt = async (newScore) => {
    const newBelt = getBelt(newScore);
    if (newBelt !== highestBelt) {
      if ((newBelt === 'Black' && highestBelt !== 'Black') || (newBelt === 'Green' && highestBelt === 'White')) {
        setHighestBelt(newBelt);
        try {
          await AsyncStorage.setItem('HIGHEST_BELT_VOCAB', newBelt);
        } catch (e) {
          console.error("Failed to save belt", e);
        }
      }
    }
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const triggerStar = () => {
    starAnimX.setValue(-100);
    starRotate.setValue(0);
    
    Animated.parallel([
      Animated.timing(starAnimX, {
        toValue: Dimensions.get('window').width + 100,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true
      }),
      Animated.timing(starRotate, {
        toValue: 1,
        duration: 800,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ]).start();
  };

  const handleAnswer = (index) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setSelectedAnswerIndex(index);

    const isCorrect = index === currentWord.correctIndex;

    if (isCorrect) {
      triggerStar();
      const newScore = correctCount + 1;
      setCorrectCount(newScore);
      updateBelt(newScore);
    } else {
      triggerShake();
      setLives(prev => prev - 1);
      // Spaced repetition plug (re-add to end of queue or randomly within next 3)
      setQueue(prev => {
        const newQueue = [...prev];
        const insertIndex = Math.min(newQueue.length, 3);
        newQueue.splice(insertIndex, 0, currentWord);
        return newQueue;
      });
    }

    setTimeout(() => {
      setSelectedAnswerIndex(null);
      
      if (lives - (isCorrect ? 0 : 1) <= 0) {
        setShowRescue(true);
      } else {
        const newQsAnswered = questionsAnsweredSinceWisdom + 1;
        
        let newQueue = [...queue];
        newQueue.shift(); // Remove current
        if (newQueue.length === 0) {
            // Infinite loop placeholder: push the initial bank again
            newQueue = shuffleArray(vocabGameBank);
        }
        
        if (newQsAnswered >= 5) {
          setShowWisdom(true);
          setQuestionsAnsweredSinceWisdom(0);
        } else {
          setQuestionsAnsweredSinceWisdom(newQsAnswered);
          setCurrentWord(newQueue[0]);
        }
        setQueue(newQueue);
      }
      setIsAnimating(false);
    }, 1500); // 1.5s delay to show result
  };

  const handleWisdomClose = () => {
    setShowWisdom(false);
    setCurrentWord(queue[0]);
  };

  const handleRescue = () => {
    // Placeholder for Rewarded Ad
    setLives(3);
    setShowRescue(false);
    
    let newQueue = [...queue];
    newQueue.shift();
    if (newQueue.length === 0) newQueue = shuffleArray(vocabGameBank);
    setCurrentWord(newQueue[0]);
    setQueue(newQueue);
  };

  const handleQuit = () => {
    navigation.goBack();
  };

  const rotation = starRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '720deg']
  });

  if (showRescue) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.rescueContainer}>
          <Text style={styles.rescueTitle}>Out of Lives!</Text>
          <Text style={styles.rescueSub}>A true ninja never gives up.</Text>
          <TouchableOpacity style={styles.rescueBtn} onPress={handleRescue}>
            <Text style={styles.rescueBtnText}>Watch Ad to Restore Lives</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quitBtn} onPress={handleQuit}>
            <Text style={styles.quitBtnText}>Retreat</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (showWisdom) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.wisdomContainer}>
          <Text style={styles.wisdomTitle}>Sensei Wisdom 🥋</Text>
          <View style={styles.wisdomCard}>
             <Text style={styles.wisdomNote}>{currentWord.rootNote}</Text>
          </View>
          <TouchableOpacity style={styles.continueBtn} onPress={handleWisdomClose}>
            <Text style={styles.continueBtnText}>Bow and Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentBeltDisplay = getBelt(correctCount);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <View>
            <Text style={styles.scoreText}>Score: {correctCount}</Text>
            <Text style={styles.beltText}>Belt: {currentBeltDisplay} (Peak: {highestBelt})</Text>
        </View>
        <Text style={styles.livesText}>Lives: {'❤️'.repeat(lives)}</Text>
      </View>

      {/* Top Ad Container */}
      {/* 
      <View nativeID="ad-leaderboard-top" style={styles.adContainerTop}>
        <Text style={styles.adPlaceholder}>[ Ad: Leaderboard Top ]</Text>
      </View>
      */}

      {/* Game Area */}
      <Animated.View style={[styles.gameCard, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={styles.missionType}>{currentWord.missionType.toUpperCase()} MISSION</Text>
        <Text style={styles.targetWord}>{currentWord.word}</Text>
        
        <View style={styles.optionsContainer}>
          {currentWord.options.map((option, index) => {
            let bgColor = '#fff';
            let borderColor = '#E5E7EB';
            let textColor = '#1F2937';

            if (selectedAnswerIndex !== null) {
              if (index === currentWord.correctIndex) {
                bgColor = '#D1FAE5'; // Soft green
                borderColor = '#10B981';
                textColor = '#065F46';
              } else if (index === selectedAnswerIndex) {
                bgColor = '#FEE2E2'; // Soft red
                borderColor = '#EF4444';
                textColor = '#991B1B';
              }
            }

            return (
              <TouchableOpacity
                key={index}
                activeOpacity={0.7}
                disabled={isAnimating}
                style={[styles.optionBtn, { backgroundColor: bgColor, borderColor: borderColor }]}
                onPress={() => handleAnswer(index)}
              >
                <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Bottom Ad Container */}
      {/*
      <View nativeID="ad-med-rectangle-bottom" style={styles.adContainerBottom}>
        <Text style={styles.adPlaceholder}>[ Ad: Rectangle Bottom ]</Text>
      </View>
      */}

      {/* Flying Star Animation */}
      <Animated.View style={[
          styles.starContainer,
          { transform: [{ translateX: starAnimX }, { translateY: starAnimY }, { rotate: rotation }] }
      ]}>
          <Text style={{ fontSize: 40 }}>🥷</Text>
          {/* <Image source={{uri: 'ninja_star_url'}} style={{width: 50, height: 50}} /> */}
      </Animated.View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Carbon Black Theme
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '90%',
    marginVertical: 15,
  },
  scoreText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  beltText: {
    color: '#aaa',
    fontSize: 14,
  },
  livesText: {
    fontSize: 18,
  },
  adContainerTop: {
    width: '90%',
    height: 90,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
  },
  adContainerBottom: {
    width: '90%',
    height: 250, // Med rectangle approx height
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    borderRadius: 8,
  },
  adPlaceholder: {
    color: '#888',
  },
  gameCard: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#BE1E2D', // Deep Red
  },
  missionType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#BE1E2D',
    letterSpacing: 2,
    marginBottom: 10,
  },
  targetWord: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 30,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
  },
  optionBtn: {
    minHeight: 54, // "thumb-friendly" minimum 44px, using 54px for safety
    width: '100%',
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 15,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  starContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 100,
  },
  rescueContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  rescueTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  rescueSub: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 40,
  },
  rescueBtn: {
    backgroundColor: '#BE1E2D',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginBottom: 20,
  },
  rescueBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quitBtn: {
    paddingVertical: 15,
    paddingHorizontal: 30,
  },
  quitBtnText: {
    color: '#888',
    fontSize: 16,
  },
  wisdomContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
  },
  wisdomTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#BE1E2D',
    marginBottom: 20,
  },
  wisdomCard: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  wisdomNote: {
    fontSize: 22,
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  continueBtn: {
    backgroundColor: '#1F2937',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#BE1E2D',
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
