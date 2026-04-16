import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { generateMathsSkillQuestion, getMathsStrandInstruction, MATHS_STRANDS } from '../utils/mathsSkills';
import { NumPad } from '../components/NumPad';
import { GeometryVisualizer } from '../components/GeometryVisualizer';
import { saveDojoRecord } from '../utils/storage';

const { width } = Dimensions.get('window');
const MAX_QUESTIONS = 10;

const TimesTableGrid = () => {
    return (
        <ScrollView style={styles.tableGridContainer} nestedScrollEnabled={true}>
            <Text style={styles.tableGridTitle}>Times Tables Reference</Text>
            {Array.from({length: 12}).map((_, i) => (
                <View key={`row-${i}`} style={styles.tableRow}>
                    {Array.from({length: 12}).map((_, j) => (
                        <View key={`cell-${i}-${j}`} style={[styles.tableCell, (i===0 || j===0) && styles.tableHeaderCell]}>
                            <Text style={[(i===0 || j===0) && styles.tableHeaderText]}>
                                {(i+1)*(j+1)}
                            </Text>
                        </View>
                    ))}
                </View>
            ))}
        </ScrollView>
    );
};

export const MathsSkillsQuizScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { strandId, beltId, beltName, beltColor, beltText } = route.params;

    const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
    const [score, setScore] = useState(0);
    const [question, setQuestion] = useState(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isAnswered, setIsAnswered] = useState(false);
    const [feedbackColor, setFeedbackColor] = useState(Colors.text); // For text flashing
    const [quizComplete, setQuizComplete] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isNewRecord, setIsNewRecord] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [strandTitle, setStrandTitle] = useState('');
    
    // Timer interval ref
    const timerRef = useRef(null);

    useEffect(() => {
        const strand = MATHS_STRANDS.find(s => s.id === strandId);
        if (strand) setStrandTitle(strand.title);
    }, [strandId]);

    // Initial Load - Only after intro
    useEffect(() => {
        if (!showIntro) {
            loadNextQuestion();
            startTimer();
        }
        return () => stopTimer();
    }, [showIntro]);

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const loadNextQuestion = () => {
        const q = generateMathsSkillQuestion(strandId || 'mental', beltId);
        setQuestion(q);
        setUserAnswer('');
        setIsAnswered(false);
        setFeedbackColor(Colors.text);
    };

    const handleKeyPress = (val) => {
        if (isAnswered) return;
        setUserAnswer(prev => prev + val);
    };

    const handleBackspace = () => {
        if (isAnswered) return;
        setUserAnswer(prev => prev.slice(0, -1));
    };

    const handleSubmit = () => {
        if (isAnswered || !userAnswer) return;
        
        setIsAnswered(true);
        const isCorrect = userAnswer === question.correctAnswer;
        
        if (isCorrect) {
            setScore(prev => prev + 1);
            setFeedbackColor('#10B981'); // Green
        } else {
            setFeedbackColor('#EF4444'); // Red
            setUserAnswer(question.correctAnswer); // Show correct answer
        }

        setTimeout(() => {
            if (currentQuestionNumber >= Math.min(MAX_QUESTIONS, 20)) {
                stopTimer();
                const finalScore = isCorrect ? score + 1 : score;
                // Save Dojo record locally
                saveDojoRecord(strandId, beltId, finalScore, Math.min(MAX_QUESTIONS, 20), elapsedTime)
                    .then(newRec => setIsNewRecord(newRec));
                
                setQuizComplete(true);
            } else {
                setCurrentQuestionNumber(prev => prev + 1);
                loadNextQuestion();
            }
        }, isCorrect ? 500 : 1500);
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
            {/* Header Area */}
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

            {showIntro ? (
                <View style={styles.introOverlay}>
                    <View style={styles.introCard}>
                        <Text style={styles.introEmoji}>🥋</Text>
                        <Text style={styles.introTitle}>Ninja Training</Text>
                        <View style={[styles.introBeltBadge, { backgroundColor: beltColor }]}>
                            <Text style={[styles.introBeltText, { color: beltText }]}>{beltName}</Text>
                        </View>
                        <Text style={styles.introStrand}>{strandTitle}</Text>
                        
                        <View style={styles.tipBox}>
                            <Text style={styles.tipTitle}>TRAINING TIP:</Text>
                            <Text style={styles.tipText}>{getMathsStrandInstruction(strandId)}</Text>
                        </View>

                        <TouchableOpacity 
                            style={[styles.startBtn, { backgroundColor: Colors.primary }]}
                            onPress={() => setShowIntro(false)}
                        >
                            <Text style={styles.startBtnText}>Start Training</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <>
                    {/* Question Area */}
                    <View style={styles.questionContainer}>
                        <Text style={[styles.questionText, question.geometryData && { fontSize: 28 }]}>{question.questionText}</Text>
                        
                        {question.geometryData && (
                            <View style={styles.geometryWrapper}>
                                <GeometryVisualizer data={question.geometryData} />
                            </View>
                        )}

                        <View style={[styles.answerBox, { borderColor: isAnswered ? feedbackColor : '#E5E7EB' }]}>
                           <Text style={[styles.answerText, { color: feedbackColor }]}>
                               {userAnswer || '?'}
                           </Text>
                        </View>
                    </View>

                    {question.isAssisted && (
                        <View style={styles.assistedContainer}>
                            <TimesTableGrid />
                        </View>
                    )}

                    {/* NumPad string entry */}
                    <View style={styles.inputArea}>
                        <NumPad 
                            onKeyPress={handleKeyPress}
                            onBackspace={handleBackspace}
                            onSubmit={handleSubmit}
                            disabled={isAnswered}
                        />
                    </View>
                </>
            )}
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    questionText: {
        fontSize: 40,
        fontWeight: '900',
        color: Colors.text,
        textAlign: 'center',
        ...Platform.select({ web: { fontFamily: 'sans-serif', whiteSpace: 'pre-wrap' }})
    },
    geometryWrapper: {
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    answerBox: {
        marginTop: 15,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#FFF',
        borderRadius: 16,
        borderWidth: 3,
        minWidth: 120,
        alignItems: 'center'
    },
    answerText: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    inputArea: {
        paddingBottom: 100,
    },
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    resultEmoji: {
        fontSize: 60,
        marginBottom: 20,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 3,
        width: '100%',
        maxWidth: 300,
        alignItems: 'center'
    },
    actionBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    tableGridContainer: {
        maxHeight: 120,
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 5,
        marginHorizontal: 20,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tableGridTitle: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: 5,
        color: Colors.textSecondary,
    },
    tableRow: {
        flexDirection: 'row',
    },
    tableCell: {
        width: 30,
        height: 25,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#E5E7EB',
    },
    tableHeaderCell: {
        backgroundColor: '#F3F4F6',
    },
    tableHeaderText: {
        fontWeight: 'bold',
        color: Colors.primary,
    },
    assistedContainer: {
        alignItems: 'center',
    }
});
