import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { generateNVRSkillQuestion } from '../utils/nvrSkills';
import { NVRVisualizer } from '../components/NVRVisualizer';
import { saveDojoRecord } from '../utils/storage';

const { width } = Dimensions.get('window');
const MAX_QUESTIONS = 10;

export const NVRSkillsQuizScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { strandId, beltId, beltName, beltColor, beltText } = route.params;

    const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
    const [score, setScore] = useState(0);
    const [question, setQuestion] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [feedbackColor, setFeedbackColor] = useState(Colors.text);
    const [quizComplete, setQuizComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [showLogic, setShowLogic] = useState(false);
    
    const timerRef = useRef(null);

    useEffect(() => {
        loadNextQuestion();
        startTimer();
        return () => stopTimer();
    }, []);

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const loadNextQuestion = () => {
        const q = generateNVRSkillQuestion(strandId, beltId);
        setQuestion(q);
        setIsAnswered(false);
        setShowLogic(false);
        setSelectedAnswer(null);
        setFeedbackColor(Colors.text);
    };

    const handleOptionPress = (option) => {
        if (isAnswered) return;
        
        setSelectedAnswer(option);
        setIsAnswered(true);
        const isCorrect = option === question.correctAnswer;
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedbackColor('#10B981'); // Green
        } else {
            setFeedbackColor('#EF4444'); // Red
            setShowLogic(true);
        }
    };

    const moveToNextQuestion = () => {
        if (!isAnswered) return;

        if (currentQuestionNumber >= MAX_QUESTIONS) {
            stopTimer();
            // Note: score was already updated in handleOptionPress
            saveDojoRecord(`nvr_${strandId}`, beltId, score, MAX_QUESTIONS, elapsedTime)
                .then(newRec => setIsNewRecord(newRec));
            setQuizComplete(true);
        } else {
            setCurrentQuestionNumber(prev => prev + 1);
            loadNextQuestion();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (quizComplete) {
        return (
            <View style={[styles.container, { backgroundColor: beltColor }]}>
                <View style={styles.resultsContainer}>
                    <Text style={[styles.resultsTitle, { color: beltText }]}>Training Complete</Text>
                    <Text style={[styles.beltInfoTitle, { color: beltText, marginTop: 10 }]}>{beltName}</Text>
                    
                    {isNewRecord && (
                        <View style={styles.newRecordBadge}>
                            <Text style={styles.newRecordText}>🏆 NEW PERSONAL BEST 🏆</Text>
                        </View>
                    )}

                    <View style={styles.statsBox}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Score:</Text>
                            <Text style={styles.statValue}>{score} / {MAX_QUESTIONS}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Time:</Text>
                            <Text style={styles.statValue}>{formatTime(elapsedTime)}</Text>
                        </View>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>Accuracy:</Text>
                            <Text style={styles.statValue}>{Math.round((score / MAX_QUESTIONS) * 100)}%</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: beltText }]}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={[styles.actionBtnText, { color: beltColor }]}>Return to Rank Select</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={[styles.actionBtn, { backgroundColor: 'transparent', borderColor: beltText, borderWidth: 2, marginTop: 15 }]}
                        onPress={() => navigation.navigate('Home')}
                    >
                        <Text style={[styles.actionBtnText, { color: beltText }]}>Back to Dojo</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    if (!question) return <View style={styles.container}><Text>Generating...</Text></View>;

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ flexGrow: 1, backgroundColor: Colors.background }}>
            <View style={[styles.header, { backgroundColor: beltColor }]}>
                <View style={styles.headerTop}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={[styles.cancelBtn, { color: beltText }]}>Cancel</Text>
                    </TouchableOpacity>
                    <Text style={[styles.beltLabel, { color: beltText }]}>{beltName}</Text>
                    <View style={{ width: 50 }} />
                </View>

                <View style={styles.progressRow}>
                    <Text style={[styles.progressText, { color: beltText }]}>
                        Q: {currentQuestionNumber} / {MAX_QUESTIONS}
                    </Text>
                    <Text style={[styles.timerText, { color: beltText }]}>
                        ⏳ {formatTime(elapsedTime)}
                    </Text>
                </View>
            </View>

            <View style={styles.questionContainer}>
                <Text style={styles.questionText}>{question.questionText}</Text>
                
                {showLogic && (
                    <View style={styles.logicBanner}>
                        <Text style={styles.logicTitle}>💡 Logic Explainer</Text>
                        <Text style={styles.logicText}>{question.logic}</Text>
                    </View>
                )}
                
                {/* Visuals Area */}
                <View style={styles.visualsArea}>
                    {question.isMatrix ? (
                        <View style={styles.matrixGrid}>
                            <View style={styles.matrixCell}><NVRVisualizer shape={question.testShapes[0]} size={80} /></View>
                            <View style={styles.matrixCell}><NVRVisualizer shape={question.testShapes[1]} size={80} /></View>
                            <View style={styles.matrixCell}><NVRVisualizer shape={question.testShapes[2]} size={80} /></View>
                            <View style={[styles.matrixCell, styles.matrixTarget]}><Text style={styles.matrixQ}>?</Text></View>
                        </View>
                    ) : (
                        <View style={styles.testShapesRow}>
                            {question.testShapes.map((s, i) => (
                                <View key={i} style={styles.testShapeWrapper}>
                                    {s ? <NVRVisualizer shape={s} size={70} /> : <Text style={styles.matrixQ}>?</Text>}
                                    {question.isAnalogy && i === 0 && <Text style={styles.analogyArrow}>→</Text>}
                                    {question.isAnalogy && i === 1 && <Text style={styles.analogyColon}>::</Text>}
                                </View>
                            ))}
                        </View>
                    ) || <View style={{ height: 20 }} />}
                </View>

                {/* Options Area */}
                <View style={styles.optionsGrid}>
                    {question.options.map((opt, i) => {
                        const label = ['A', 'B', 'C', 'D', 'E'][i];
                        const isCorrect = label === question.correctAnswer;
                        const isSelected = label === selectedAnswer;
                        
                        let borderColor = '#E5E7EB';
                        if (isAnswered) {
                            if (isCorrect) borderColor = '#10B981';
                            else if (isSelected) borderColor = '#EF4444';
                        }

                        return (
                            <TouchableOpacity 
                                key={label}
                                style={[styles.optionCard, { borderColor: borderColor }]}
                                onPress={() => handleOptionPress(label)}
                                disabled={isAnswered}
                            >
                                <NVRVisualizer shape={opt} size={60} />
                                <Text style={styles.optionLabel}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {isAnswered && (
                    <TouchableOpacity 
                        style={[styles.nextBtn, { backgroundColor: beltColor }]}
                        onPress={moveToNextQuestion}
                    >
                        <Text style={[styles.nextBtnText, { color: beltText }]}>
                            {currentQuestionNumber >= MAX_QUESTIONS ? 'Finish Quiz' : 'Next Question'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 30,
        paddingBottom: 15,
        paddingHorizontal: 15,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    cancelBtn: {
        fontSize: 16,
        fontWeight: 'bold',
        opacity: 0.8,
    },
    beltLabel: {
        fontSize: 18,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    progressRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.2)',
        padding: 10,
        borderRadius: 12,
    },
    progressText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    questionContainer: {
        flex: 1,
        padding: 20,
        alignItems: 'center',
    },
    questionText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        textAlign: 'center',
        marginBottom: 30,
    },
    visualsArea: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        marginBottom: 40,
    },
    testShapesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 15,
    },
    testShapeWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    analogyArrow: { fontSize: 24, marginLeft: 10, color: '#999' },
    analogyColon: { fontSize: 24, marginLeft: 10, color: '#999', fontWeight: 'bold' },
    matrixGrid: {
        width: 200,
        height: 200,
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderWidth: 2,
        borderColor: '#E5E7EB',
    },
    matrixCell: {
        width: '50%',
        height: '50%',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    matrixTarget: {
        backgroundColor: '#F9FAFB',
    },
    matrixQ: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#999',
    },
    logicBanner: {
        backgroundColor: '#FEF9C3',
        padding: 15,
        borderRadius: 16,
        marginBottom: 25,
        borderWidth: 1,
        borderColor: '#FDE047',
        width: '100%',
    },
    logicTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#854D0E',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    logicText: {
        fontSize: 16,
        color: '#713F12',
        lineHeight: 22,
    },
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: '100%',
        gap: 12,
        paddingBottom: 20,
    },
    nextBtn: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 50,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    optionCard: {
        width: '30%',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        borderWidth: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionLabel: {
        marginTop: 5,
        fontWeight: 'bold',
        color: '#6B7280',
    },
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultsTitle: {
        fontSize: 32,
        fontWeight: '900',
    },
    beltInfoTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        opacity: 0.8,
        marginBottom: 20,
    },
    newRecordBadge: {
        backgroundColor: '#FFD700',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginBottom: 20,
    },
    newRecordText: {
        color: '#854D0E',
        fontWeight: 'black',
        fontSize: 16,
        letterSpacing: 1,
    },
    statsBox: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxWidth: 350,
        marginBottom: 40,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    statLabel: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    statValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    actionBtn: {
        paddingHorizontal: 40,
        paddingVertical: 16,
        borderRadius: 30,
        width: '100%',
        maxWidth: 300,
        alignItems: 'center'
    },
    actionBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    }
});
