import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, ScrollView, Dimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { getVRQuestion, getVRStrandInstruction } from '../utils/vrSkills';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveDojoResult } from '../utils/storage';

const MAX_QUESTIONS = 10;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const VRSkillsQuizScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    
    const { strandId, beltId, strandTitle, beltName, beltColor, beltText } = route.params;

    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [selectedOption, setSelectedOption] = useState(null);
    const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
    const [isFinished, setIsFinished] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [startTime, setStartTime] = useState(Date.now());

    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (!showIntro) {
            setStartTime(Date.now());
            loadNextQuestion();
        }
    }, [showIntro]);

    const loadNextQuestion = () => {
        if (questionIndex >= MAX_QUESTIONS) {
            finishQuiz();
            return;
        }

        Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
            setCurrentQuestion(getVRQuestion(strandId, beltId));
            setSelectedOption(null);
            setFeedback(null);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
        });
    };

    const finishQuiz = async () => {
        const timeTaken = Math.floor((Date.now() - startTime) / 1000);
        await saveDojoResult(`vr_${strandId}_${beltId}`, score, MAX_QUESTIONS, timeTaken);
        setIsFinished(true);
    };

    const handleAnswer = (index) => {
        if (feedback) return;

        setSelectedOption(index);
        const isCorrect = index === currentQuestion.correctAnswerIndex;
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }
    };

    const renderQuizContent = () => {
        if (!currentQuestion) return null;

        return (
            <Animated.View style={[styles.quizContainer, { opacity: fadeAnim }]}>
                <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${(questionIndex / MAX_QUESTIONS) * 100}%`, backgroundColor: beltColor }]} />
                    </View>
                    <Text style={styles.questionCounter}>Question {questionIndex + 1} of {MAX_QUESTIONS}</Text>
                </View>
                
                <View style={[styles.questionCard, { borderTopColor: beltColor }]}>
                    <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
                </View>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((opt, i) => {
                        let optionStyle = styles.optionBtn;
                        let textStyle = styles.optionText;

                        if (feedback) {
                            if (i === currentQuestion.correctAnswerIndex) {
                                optionStyle = [styles.optionBtn, styles.correctOption];
                                textStyle = [styles.optionText, styles.correctOptionText];
                            } else if (i === selectedOption && feedback === 'incorrect') {
                                optionStyle = [styles.optionBtn, styles.incorrectOption];
                                textStyle = [styles.optionText, styles.incorrectOptionText];
                            }
                        }

                        return (
                            <TouchableOpacity 
                                key={i} 
                                style={optionStyle}
                                disabled={feedback !== null}
                                onPress={() => handleAnswer(i)}
                            >
                                <View style={styles.optionContent}>
                                    <View style={[styles.optionLabel, feedback && i === currentQuestion.correctAnswerIndex && { backgroundColor: '#22C55E' }]}>
                                        <Text style={[styles.optionLabelText, feedback && i === currentQuestion.correctAnswerIndex && { color: '#FFF' }]}>
                                            {String.fromCharCode(65 + i)}
                                        </Text>
                                    </View>
                                    <Text style={textStyle}>{opt}</Text>
                                </View>
                            </TouchableOpacity>
                        )
                    })}
                </View>

                {feedback && (
                    <View style={styles.explainerContainer}>
                        <View style={[styles.feedbackHeader, feedback === 'correct' ? styles.correctHeader : styles.incorrectHeader]}>
                            <Text style={styles.feedbackHeaderText}>
                                {feedback === 'correct' ? '✅ EXCELLENT!' : '❌ NOT QUITE'}
                            </Text>
                        </View>
                        <View style={styles.explainerContent}>
                            <Text style={styles.logicTitle}>Reasoning:</Text>
                            <Text style={styles.logicText}>{currentQuestion.logic}</Text>
                            
                            <TouchableOpacity 
                                style={[styles.nextBtn, { backgroundColor: beltColor }]}
                                onPress={() => {
                                    setQuestionIndex(prev => prev + 1);
                                    loadNextQuestion();
                                }}
                            >
                                <Text style={[styles.nextBtnText, { color: beltText }]}>Next Question ></Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), backgroundColor: beltColor === '#FFFFFF' ? '#6D28D9' : beltColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={[styles.backBtnText, { color: beltColor === '#FFFFFF' ? '#FFF' : beltText }]}>Exit</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={[styles.headerTitle, { color: beltColor === '#FFFFFF' ? '#FFF' : beltText }]}>{beltName}</Text>
                    <Text style={[styles.headerSub, { color: beltColor === '#FFFFFF' ? 'rgba(255,255,255,0.8)' : beltText + 'CC' }]}>{strandTitle}</Text>
                </View>
                <View style={styles.scorePill}>
                    <Text style={[styles.scoreText, { color: beltColor === '#FFFFFF' ? '#FFF' : beltText }]}>{score}/{MAX_QUESTIONS}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {showIntro ? (
                    <View style={styles.introOverlay}>
                        <View style={styles.introCard}>
                            <Text style={styles.introEmoji}>🥋</Text>
                            <Text style={styles.introTitle}>Ninja Training</Text>
                            <View style={[styles.introBeltBadge, { backgroundColor: beltColor === '#FFFFFF' ? '#F1F5F9' : beltColor }]}>
                                <Text style={[styles.introBeltText, { color: beltColor === '#FFFFFF' ? '#64748B' : beltText }]}>{beltName}</Text>
                            </View>
                            <Text style={styles.introStrand}>{strandTitle}</Text>
                            
                            <View style={styles.tipBox}>
                                <Text style={styles.tipTitle}>TRAINING TIP:</Text>
                                <Text style={styles.tipText}>{getVRStrandInstruction(strandId)}</Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.startBtn, { backgroundColor: '#6D28D9' }]}
                                onPress={() => setShowIntro(false)}
                            >
                                <Text style={styles.startBtnText}>Start Training</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : isFinished ? (
                    <View style={styles.finishedContainer}>
                        <Text style={styles.finishedEmoji}>✨</Text>
                        <Text style={styles.finishedTitle}>Training Complete!</Text>
                        <Text style={styles.finishedScore}>You mastered {score} out of {MAX_QUESTIONS} logic puzzles.</Text>
                        
                        <View style={styles.accuracyBox}>
                            <Text style={styles.accuracyLabel}>Ninja Accuracy</Text>
                            <Text style={[styles.accuracyValue, { color: '#6D28D9' }]}>{Math.round((score / MAX_QUESTIONS) * 100)}%</Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.doneBtn, { backgroundColor: '#6D28D9' }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.doneBtnText}>Return to Dojo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    renderQuizContent()
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 4,
    },
    backBtn: {
        paddingVertical: 10,
        paddingRight: 10,
    },
    backBtnText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSub: {
        fontSize: 12,
    },
    scorePill: {
        backgroundColor: 'rgba(0,0,0,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scoreText: {
        fontWeight: 'bold',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    quizContainer: {
        flex: 1,
    },
    progressContainer: {
        width: '100%',
        marginBottom: 20,
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    questionCounter: {
        fontSize: 13,
        color: '#64748B',
        textAlign: 'center',
        fontWeight: '600',
    },
    questionCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 24,
        minHeight: 140,
        justifyContent: 'center',
        borderTopWidth: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
        marginBottom: 24,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E293B',
        lineHeight: 28,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
        marginBottom: 30,
    },
    optionBtn: {
        width: '100%',
        backgroundColor: '#FFF',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        elevation: 1,
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionLabel: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F1F5F9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionLabelText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
    },
    optionText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#334155',
        flex: 1,
    },
    correctOption: {
        backgroundColor: '#F0FDF4',
        borderColor: '#22C55E',
    },
    correctOptionText: {
        color: '#166534',
    },
    incorrectOption: {
        backgroundColor: '#FEF2F2',
        borderColor: '#EF4444',
    },
    incorrectOptionText: {
        color: '#991B1B',
    },
    explainerContainer: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        marginBottom: 40,
    },
    feedbackHeader: {
        paddingVertical: 10,
        alignItems: 'center',
    },
    correctHeader: { backgroundColor: '#22C55E' },
    incorrectHeader: { backgroundColor: '#EF4444' },
    feedbackHeaderText: {
        color: '#FFF',
        fontWeight: '900',
        letterSpacing: 1,
    },
    explainerContent: {
        padding: 20,
    },
    logicTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 5,
        textTransform: 'uppercase',
    },
    logicText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
        marginBottom: 20,
    },
    nextBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 2,
    },
    nextBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    finishedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    finishedEmoji: {
        fontSize: 80,
        marginBottom: 20,
    },
    finishedTitle: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 10,
    },
    finishedScore: {
        fontSize: 18,
        color: '#64748B',
        textAlign: 'center',
        paddingHorizontal: 40,
        marginBottom: 40,
    },
    accuracyBox: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 24,
        paddingHorizontal: 48,
        borderRadius: 24,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    accuracyLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    accuracyValue: {
        fontSize: 48,
        fontWeight: '900',
    },
    doneBtn: {
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        elevation: 4,
    },
    doneBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    // Intro Overlay Styles
    introOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    introCard: {
        backgroundColor: '#FFF',
        width: '100%',
        borderRadius: 24,
        padding: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    introEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    introTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1E293B',
        marginBottom: 15,
    },
    introBeltBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 8,
    },
    introBeltText: {
        fontWeight: 'bold',
        fontSize: 14,
        textTransform: 'uppercase',
    },
    introStrand: {
        fontSize: 18,
        color: '#64748B',
        marginBottom: 25,
        fontWeight: '600',
    },
    tipBox: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 16,
        width: '100%',
        marginBottom: 30,
        borderLeftWidth: 4,
        borderLeftColor: '#6D28D9',
    },
    tipTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#64748B',
        marginBottom: 8,
        letterSpacing: 1,
    },
    tipText: {
        fontSize: 16,
        color: '#334155',
        lineHeight: 24,
    },
    startBtn: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        elevation: 5,
    },
    startBtnText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
