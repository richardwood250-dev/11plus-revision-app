import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { generateEnglishSkillQuestion, getEnglishStrandInstruction } from '../utils/englishSkills';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { saveDojoResult } from '../utils/storage';

const MAX_QUESTIONS = 10;

export const EnglishSkillsQuizScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    
    const { strandId, beltId, strandTitle, beltName, strandColor } = route.params;

    const [questionIndex, setQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [userInput, setUserInput] = useState('');
    const [feedback, setFeedback] = useState(null); // 'correct', 'incorrect'
    const [isFinished, setIsFinished] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [startTime, setStartTime] = useState(Date.now());

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const inputRef = useRef(null);

    useEffect(() => {
        if (!showIntro) {
            setStartTime(Date.now());
            loadNextQuestion();
        }
    }, [showIntro]);

    const loadNextQuestion = () => {
        if (questionIndex >= MAX_QUESTIONS) {
            setIsFinished(true);
            return;
        }

        Animated.sequence([
            Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start(() => {
            setCurrentQuestion(generateEnglishSkillQuestion(strandId, beltId));
            setUserInput('');
            setFeedback(null);
            Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
            
            // Auto focus input if keypad mode
            setTimeout(() => {
                if (inputRef.current) inputRef.current.focus();
            }, 100);
        });
    };

    const handleAnswer = (answer) => {
        if (feedback) return; // Prevent double taps

        const isCorrect = answer.trim().toLowerCase() === currentQuestion.correctAnswer.trim().toLowerCase();
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedback('correct');
        } else {
            setFeedback('incorrect');
        }

        setTimeout(() => {
            setQuestionIndex(prev => prev + 1);
            loadNextQuestion();
        }, 1500);
    };

    const renderQuizContent = () => {
        if (!currentQuestion) return null;

        return (
            <Animated.View style={[styles.quizContainer, { opacity: fadeAnim }]}>
                <Text style={styles.questionCounter}>Question {questionIndex + 1} of {MAX_QUESTIONS}</Text>
                
                <View style={[styles.questionCard, { borderTopColor: strandColor }]}>
                    <Text style={styles.questionText}>{currentQuestion.questionText}</Text>
                </View>

                {currentQuestion.inputMode === 'multiple_choice' ? (
                    <View style={styles.optionsContainer}>
                        {currentQuestion.options.map((opt, i) => {
                            let optionStyle = styles.optionBtn;
                            if (feedback && opt === currentQuestion.correctAnswer) {
                                optionStyle = [styles.optionBtn, styles.correctOption];
                            } else if (feedback === 'incorrect' && opt === userInput) {
                                optionStyle = [styles.optionBtn, styles.incorrectOption];
                            }

                            return (
                                <TouchableOpacity 
                                    key={i} 
                                    style={optionStyle}
                                    disabled={feedback !== null}
                                    onPress={() => {
                                        setUserInput(opt);
                                        handleAnswer(opt);
                                    }}
                                >
                                    <Text style={styles.optionText}>{opt}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                ) : (
                    <View style={styles.inputContainer}>
                        <TextInput
                            ref={inputRef}
                            style={[
                                styles.textInput,
                                feedback === 'correct' && styles.correctInput,
                                feedback === 'incorrect' && styles.incorrectInput
                            ]}
                            value={userInput}
                            onChangeText={setUserInput}
                            editable={feedback === null}
                            autoCapitalize="characters"
                            autoCorrect={false}
                            onSubmitEditing={() => handleAnswer(userInput)}
                        />
                        <TouchableOpacity 
                            style={[styles.submitBtn, { backgroundColor: strandColor }]}
                            onPress={() => handleAnswer(userInput)}
                            disabled={feedback !== null || !userInput}
                        >
                            <Text style={styles.submitBtnText}>Submit</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {feedback && (
                    <View style={[styles.feedbackBox, feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackIncorrect]}>
                        <Text style={styles.feedbackText}>
                            {feedback === 'correct' ? '✅ Correct!' : `❌ Incorrect. Answer was: ${currentQuestion.correctAnswer}`}
                        </Text>
                    </View>
                )}
            </Animated.View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), backgroundColor: strandColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>Exit</Text>
                </TouchableOpacity>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerTitle}>{beltName}</Text>
                    <Text style={styles.headerSub}>{strandTitle}</Text>
                </View>
                <View style={styles.scorePill}>
                    <Text style={styles.scoreText}>{score}/{MAX_QUESTIONS}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                {showIntro ? (
                    <View style={styles.introOverlay}>
                        <View style={styles.introCard}>
                            <Text style={styles.introEmoji}>🥋</Text>
                            <Text style={styles.introTitle}>Ninja Training</Text>
                            <View style={[styles.introBeltBadge, { backgroundColor: strandColor === '#FFFFFF' ? '#F1F5F9' : strandColor }]}>
                                <Text style={[styles.introBeltText, { color: '#FFF' }]}>{beltName}</Text>
                            </View>
                            <Text style={styles.introStrand}>{strandTitle}</Text>
                            
                            <View style={styles.tipBox}>
                                <Text style={styles.tipTitle}>TRAINING TIP:</Text>
                                <Text style={styles.tipText}>{getEnglishStrandInstruction(strandId)}</Text>
                            </View>

                            <TouchableOpacity 
                                style={[styles.startBtn, { backgroundColor: strandColor }]}
                                onPress={() => setShowIntro(false)}
                            >
                                <Text style={styles.startBtnText}>Start Training</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : isFinished ? (
                    <View style={styles.finishedContainer}>
                        <Text style={styles.finishedEmoji}>🎉</Text>
                        <Text style={styles.finishedTitle}>Training Complete!</Text>
                        <Text style={styles.finishedScore}>You scored {score} out of {MAX_QUESTIONS}</Text>
                        
                        <View style={styles.accuracyBox}>
                            <Text style={styles.accuracyLabel}>Accuracy</Text>
                            <Text style={styles.accuracyValue}>{Math.round((score / MAX_QUESTIONS) * 100)}%</Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.doneBtn, { backgroundColor: strandColor }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.doneBtnText}>Return to Dojo</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    renderQuizContent()
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 15,
    },
    backBtn: {
        paddingVertical: 10,
        paddingRight: 10,
    },
    backBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerInfo: {
        alignItems: 'center',
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
    },
    scorePill: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    scoreText: {
        color: 'white',
        fontWeight: 'bold',
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    quizContainer: {
        flex: 1,
        alignItems: 'center',
    },
    questionCounter: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 10,
    },
    questionCard: {
        width: '100%',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 150,
        borderTopWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 24,
    },
    questionText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
    },
    optionBtn: {
        width: '100%',
        backgroundColor: '#FFF',
        padding: 18,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: Colors.text,
    },
    correctOption: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
    },
    incorrectOption: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    inputContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    textInput: {
        flex: 1,
        backgroundColor: '#FFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    correctInput: {
        backgroundColor: '#DCFCE7',
        borderColor: '#22C55E',
    },
    incorrectInput: {
        backgroundColor: '#FEE2E2',
        borderColor: '#EF4444',
    },
    submitBtn: {
        paddingVertical: 18,
        paddingHorizontal: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    submitBtnText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    feedbackBox: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        marginTop: 20,
        alignItems: 'center',
    },
    feedbackCorrect: {
        backgroundColor: '#DCFCE7',
    },
    feedbackIncorrect: {
        backgroundColor: '#FEE2E2',
    },
    feedbackText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    finishedContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    finishedEmoji: {
        fontSize: 64,
        marginBottom: 20,
    },
    finishedTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    finishedScore: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginBottom: 30,
    },
    accuracyBox: {
        alignItems: 'center',
        backgroundColor: '#FFF',
        paddingVertical: 20,
        paddingHorizontal: 40,
        borderRadius: 16,
        marginBottom: 40,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    accuracyLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 5,
    },
    accuracyValue: {
        fontSize: 36,
        fontWeight: '800',
        color: Colors.primary,
    },
    doneBtn: {
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 24,
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
        borderLeftColor: Colors.primary,
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
