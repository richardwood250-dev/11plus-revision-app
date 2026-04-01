import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Dimensions, Modal, SafeAreaView, Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AlphabetStrip } from '../components/AlphabetStrip';
import { ZoomableImage } from '../components/ZoomableImage';
import { ReportButton } from '../components/ReportButton';
import { saveSession } from '../utils/storage';
import { getInstruction } from '../data/instructions';
import { getQuizFeedback } from '../utils/motivation';
import { ResilientImage } from '../components/ResilientImage';

import { Colors } from '../constants/Colors';

export const QuizScreen = ({ route }) => {
    const navigation = useNavigation();
    const { title, questions, config } = route.params;
    const { topic, subject } = config || {};
    console.log('[QuizScreen] Params:', { title, topic, subject, config });

    const instructions = getInstruction(title, topic);

    const [answers, setAnswers] = useState({}); // { [index]: 'A' or ['A','B'] }
    const [status, setStatus] = useState('active'); // 'active' | 'review'
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const scrollViewRef = useRef(null);
    const startTime = useRef(new Date());

    // Config Flags
    const showAlphabet = ['Letter codes', 'Letter sequences', 'Word codes'].includes(title) ||
        ['Letter codes', 'Letter sequences', 'Word codes'].includes(topic);

    const isMultiSelect = title === 'Odd 2 out' || topic === 'Odd 2 Out' || topic === 'Odd 2 out';
    const isLettersForNumbers = title === 'Letters for numbers' || topic === 'Letters for numbers';
    // Move a letter already has Words in the question text thanks to our parser updates? 
    const isMaths = subject === 'Maths';
    const isNVR = subject === 'Non-Verbal' || 
                  ['Matrices', 'Series', 'Codes', 'Similarity', 'Hidden Pictures', 'Horizontal Code'].includes(title) || 
                  ['Matrices', 'Series', 'Codes', 'Similarity', 'Hidden Pictures', 'Horizontal Code'].includes(topic);
    const isCodes = title === 'Horizontal Code' || topic === 'Horizontal Code';

    const handleOptionPress = (questionIndex, option) => {
        if (status === 'review') return;

        setAnswers(prev => {
            const current = prev[questionIndex];

            if (isMultiSelect) {
                // Odd 2 Out Logic: Allow max 2 selections
                let newSelection = current ? [...current] : []; // assume array
                if (typeof current === 'string') newSelection = [current]; // safety

                if (newSelection.includes(option)) {
                    return { ...prev, [questionIndex]: newSelection.filter(o => o !== option) };
                } else {
                    if (newSelection.length < 2) {
                        return { ...prev, [questionIndex]: [...newSelection, option] };
                    } else {
                        Alert.alert("Maximum 2", "Please deselect one before choosing another.");
                        return prev;
                    }
                }
            } else {
                // Single Select Logic
                return { ...prev, [questionIndex]: option };
            }
        });
    };

    const calculateScore = () => {
        let correctCount = 0;
        questions.forEach((q, index) => {
            const userAns = answers[index];
            if (!userAns) return;

            if (Array.isArray(userAns)) {
                // Sort and join to compare with Correct Answer (e.g. "BE")
                const combined = [...userAns].sort().join('');
                if (combined === q.correctAnswer) correctCount++;
            } else {
                // Single answer
                if (userAns === q.correctAnswer) correctCount++;
            }
        });
        return correctCount;
    };

    const handleSubmit = async () => {
        if (!questions || questions.length === 0) {
            Alert.alert("Error", "No questions to submit.");
            return;
        }

        // Check if all answered?
        const answeredCount = Object.keys(answers).length;

        const finishQuiz = async () => {
            try {
                setStatus('review'); // Updates UI immediately
                setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                }, 100);

                // Calculate Stats
                const endTime = new Date();
                const timeInSeconds = Math.floor((endTime - startTime.current) / 1000);

                const results = questions.map((q, index) => {
                    const userAns = answers[index];
                    let isCorrect = false;

                    // Defensive check for question data
                    if (!q) return { isCorrect: false, difficultyIndex: 50 };

                    const correctVal = q.correctAnswer || "";

                    if (Array.isArray(userAns)) {
                        const combined = [...userAns].sort().join('');
                        isCorrect = combined === correctVal;
                    } else {
                        isCorrect = userAns === correctVal;
                    }

                    return {
                        isCorrect,
                        difficultyIndex: 50 // Default medium difficulty since we don't have this data
                    };
                });

                const updatedStats = await saveSession(subject || 'Unknown', results, timeInSeconds, topic || 'General');

                // Check for new records (Motivation)
                if (updatedStats) {
                    const { checkRecords } = require('../utils/motivation');
                    const currentSession = {
                        correct: calculateScore(), // Re-calc score to be safe or use local var if available. 
                        // Actually calculateScore() uses 'answers' state which is current.
                        total: questions.length,
                        time: timeInSeconds,
                        topic: topic || 'General',
                        subject: subject || 'Unknown'
                    };

                    const record = checkRecords(currentSession, updatedStats);
                    if (record) {
                        setTimeout(() => {
                            Alert.alert("🎉 NEW RECORD! 🎉", record.message);
                        }, 500); // Delay slightly to let UI settle
                    }
                }
            } catch (error) {
                console.error("Error submitting quiz:", error);
                Alert.alert("Error", "There was a problem saving your results. Please screenshot your score.");
            }
        };

        if (answeredCount < questions.length) {
            Alert.alert(
                "Incomplete",
                `You have answered ${answeredCount} out of ${questions.length} questions. Are you sure you want to finish?`,
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Submit", onPress: finishQuiz
                    }
                ]
            );
        } else {
            await finishQuiz();
        }
    };

    const isOptionSelected = (questionIndex, option) => {
        const current = answers[questionIndex];
        if (Array.isArray(current)) return current.includes(option);
        return current === option;
    };

    // Helper to get letter for index
    const getLetter = (idx) => String.fromCharCode(65 + idx);

    const openImage = (uri) => {
        setSelectedImage(uri);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>

            {/* Score Overlay for Review Mode */}
            {status === 'review' && (
                <View style={styles.scoreContainer}>
                    <View style={styles.scoreHeader}>
                        <Text style={styles.scoreTitle}>Quiz Complete!</Text>
                        <View style={styles.scoreBadge}>
                            <Text style={styles.scoreValue}>{calculateScore()} / {questions.length}</Text>
                        </View>
                    </View>
                    <Text style={styles.feedbackText}>
                        {getQuizFeedback(calculateScore(), questions.length)}
                    </Text>

                    <TouchableOpacity style={styles.exitBtn} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.exitBtnText}>Back to Home</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Zoom Modal */}
            <Modal
                visible={modalVisible}
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
                animationType="fade"
            >
                <SafeAreaView style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={() => setModalVisible(false)}
                    >
                        <Text style={styles.closeText}>✕ Close</Text>
                    </TouchableOpacity>

                    {selectedImage && <ZoomableImage uri={selectedImage} />}
                </SafeAreaView>
            </Modal>

            {/* Helper Strip */}
            {showAlphabet && <AlphabetStrip />}

            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scroll}>

                {/* Header (General) */}
                <View style={styles.header}>
                    <Text style={styles.topic}>{title}</Text>
                </View>

                {/* Main Instruction */}
                <View style={styles.instructionBox}>
                    <Text style={styles.instructionText}>ℹ️ {instructions}</Text>
                </View>

                {isMaths && (
                    <View style={[styles.proTipBox, { padding: 10, marginBottom: 10 }]}>
                        <Text style={[styles.proTipText, { flex: 1 }]}>
                            📝 <Text style={{ fontWeight: 'bold' }}>Pro Tip:</Text> Grab a pencil and paper to avoid mistakes!
                        </Text>
                        {/* No functional close needed if it scrolls, but let's change color to prove update */}
                    </View>
                )}

                {(isLettersForNumbers || questions.some(q => q.key)) && (
                    <View style={styles.keyContainer}>
                        {/* Show key for the current question? Or key for the set? 
                            The script attaches 'key' to EACH question.
                            Since we scroll, we might need to show the key INSIDE the question block
                            OR if it's the same for all, at top.
                            Letters for numbers csv has ONE line per question, so Key might change per question.
                            Let's inspect data... each row as a Key.
                            So we should render the Key INSIDE the question block.
                        */}
                    </View>
                )}

                {/* Render All Questions */}
                {questions.map((q, qIndex) => (
                    <View key={q.id || qIndex} style={styles.questionBlock}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.qIndex}>Question {qIndex + 1}</Text>
                            <ReportButton questionId={q.id || `${title}_${qIndex}`} />
                        </View>

                        <View style={styles.questionCard}>
                            {q.key && (
                                <View style={styles.keyBox}>
                                    <Text style={styles.keyTitle}>KEY</Text>
                                    <Text style={styles.keyText}>{q.key}</Text>
                                </View>
                            )}

                            {/* Special rendering for "Move a letter" which uses "WORD1 & WORD2" format */}
                            {q.question.includes(' & ') && (title === 'Move a letter' || title === 'Move A Letter' || topic === 'Move a letter') ? (
                                <View style={styles.twoWordContainer}>
                                    <Text style={styles.wordBox}>{q.question.split(' & ')[0]}</Text>
                                    <View style={styles.wordConnector}>
                                        <Text style={styles.connectorText}>&</Text>
                                    </View>
                                    <Text style={styles.wordBox}>{q.question.split(' & ')[1]}</Text>
                                </View>
                            ) : (
                                <Text style={styles.questionText}>{q.question}</Text>
                            )}

                            {q.image && (
                                <TouchableOpacity onPress={() => openImage(q.image)}>
                                    <ResilientImage
                                        uri={q.image}
                                        style={styles.questionImage}
                                        resizeMode="contain"
                                    />
                                    <Text style={styles.tapHint}>🔍 Tap to enlarge</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={[styles.optionsContainer, isNVR && styles.nvrOptionsContainer]}>
                            {q.options.map((option, optIndex) => {
                                const letter = getLetter(optIndex);
                                const isSelected = isOptionSelected(qIndex, letter);

                                // Base Styling
                                let btnStyle = [styles.optionBtn, isNVR && styles.nvrOptionBtn, isCodes && styles.nvrCodesOptionBtn];
                                let textStyle = [styles.optionText, isCodes && styles.nvrCodesOptionText];
                                let labelStyle = [styles.optionLabel, isNVR && styles.nvrOptionLabel, isCodes && styles.nvrCodesOptionLabel];

                                if (status === 'active') {
                                    if (isSelected) {
                                        btnStyle.push(styles.optionSelected);
                                        textStyle.push({ fontWeight: 'bold', color: Colors.primary });
                                        labelStyle.push({ color: Colors.primary });
                                    }
                                } else {
                                    // Review Mode
                                    const correctRaw = q.correctAnswer || ""; // "A" or "BE"
                                    const isCorrect = correctRaw.includes(letter);

                                    if (isCorrect) {
                                        btnStyle.push(styles.optionCorrect);
                                        textStyle.push({ color: 'white' });
                                        labelStyle.push({ color: 'white' });
                                    } else if (isSelected && !isCorrect) {
                                        btnStyle.push(styles.optionWrong);
                                        textStyle.push({ color: 'white' });
                                        labelStyle.push({ color: 'white' });
                                    } else if (isSelected && isCorrect) {
                                        // Correctly selected
                                        btnStyle.push(styles.optionCorrect);
                                        textStyle.push({ color: 'white' });
                                        labelStyle.push({ color: 'white' });
                                    }
                                }

                                return (
                                    <TouchableOpacity
                                        key={optIndex}
                                        style={btnStyle}
                                        onPress={() => handleOptionPress(qIndex, letter)}
                                        disabled={status === 'review'}
                                    >
                                        <Text style={labelStyle}>{letter}</Text>
                                        {(!isNVR || isCodes) && <Text style={textStyle}>{option}</Text>}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Divider */}
                        <View style={styles.divider} />
                    </View>
                ))}

                {/* Submit Button */}
                {status === 'active' && (
                    <TouchableOpacity style={styles.submitBtnLarge} onPress={handleSubmit}>
                        <Text style={styles.submitBtnText}>Submit Quiz</Text>
                    </TouchableOpacity>
                )}

                {status === 'review' && (
                    <TouchableOpacity style={styles.submitBtnLarge} onPress={() => navigation.navigate('Home')}>
                        <Text style={styles.submitBtnText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    // Review Header
    scoreContainer: {
        backgroundColor: Colors.white,
        padding: 20,
        margin: 20,
        borderRadius: 20,
        elevation: 5,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    scoreHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        justifyContent: 'space-between',
        width: '100%',
    },
    scoreTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    scoreBadge: {
        backgroundColor: Colors.primary,
        paddingVertical: 5,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    scoreValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
    },
    feedbackText: {
        fontSize: 18,
        color: Colors.secondary, // Gold/Yellow for motivation? Or maybe Green/Orange depending on score? Let's stick to text color for now or secondary.
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 10,
        fontWeight: '500',
    },
    exitBtn: {
        backgroundColor: Colors.text,
        paddingHorizontal: 30,
        paddingVertical: 12,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    exitBtnText: {
        fontWeight: 'bold',
        color: '#333'
    },
    scroll: {
        padding: 20,
        paddingBottom: 50,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    topic: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#666',
        flex: 1,
    },
    progress: {
        fontSize: 16,
        color: '#888',
    },
    instructionBox: {
        backgroundColor: '#e6f7ff',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    keyBox: {
        backgroundColor: '#f0f0f0',
        padding: 10,
        borderRadius: 8,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    keyTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginBottom: 2,
    },
    keyText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
        fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    },
    twoWordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 15,
        width: '100%',
    },
    wordBox: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        letterSpacing: 2,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        overflow: 'hidden',
    },
    wordConnector: {
        paddingHorizontal: 10,
    },
    connectorText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    instructionText: {
        fontSize: 16,
        color: '#444',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    multiSelectHint: {
        fontSize: 16,
        color: Colors.error,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    proTipBox: {
        backgroundColor: '#fff3cd', // Light yellow warning/tip color
        borderWidth: 1,
        borderColor: '#ffeeba',
        padding: 15,
        borderRadius: 10,
        marginBottom: 20,
    },
    proTipText: {
        fontSize: 16,
        color: '#856404',
        lineHeight: 22,
    },
    questionCard: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        marginBottom: 20,
        elevation: 2,
    },
    questionText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    questionImage: {
        width: '100%',
        height: 200,
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
    },
    tapHint: {
        textAlign: 'center',
        color: '#888',
        marginTop: 5,
        fontSize: 12,
    },
    optionsContainer: {
        width: '100%',
        gap: 12,
    },
    optionBtn: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 15,
        borderWidth: 2,
        borderColor: '#e0e0e0',
        flexDirection: 'row',
        alignItems: 'center',
    },
    optionSelected: {
        borderColor: Colors.primary,
        backgroundColor: Colors.selected,
    },
    optionCorrect: {
        backgroundColor: Colors.success,
        borderColor: Colors.success,
    },
    optionWrong: {
        backgroundColor: Colors.error,
        borderColor: Colors.error,
    },
    optionLabel: {
        fontWeight: 'bold',
        fontSize: 18,
        marginRight: 15,
        color: '#888',
    },
    optionText: {
        fontSize: 18,
        color: Colors.text,
        flexShrink: 1,
    },
    nvrOptionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    nvrOptionBtn: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        padding: 0,
    },
    nvrCodesOptionBtn: {
        width: '30%',
        minWidth: 80,
        height: 70,
        borderRadius: 15,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 5,
    },
    nvrOptionLabel: {
        marginRight: 0,
        fontSize: 20,
    },
    nvrCodesOptionLabel: {
        fontSize: 16,
        marginBottom: 4,
        fontWeight: 'normal',
    },
    nvrCodesOptionText: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    questionBlock: {
        marginBottom: 30,
    },
    qIndex: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.secondary,
        marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#ddd',
        marginTop: 30,
    },
    submitBtnLarge: {
        backgroundColor: Colors.success,
        paddingVertical: 18,
        borderRadius: 30,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 50,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    submitBtnText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 50,
        right: 20,
        backgroundColor: 'rgba(255,255,255,0.3)',
        padding: 10,
        borderRadius: 20,
        zIndex: 1,
    },
    closeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    fullImage: {
        width: width,
        height: height * 0.8,
    }
});
