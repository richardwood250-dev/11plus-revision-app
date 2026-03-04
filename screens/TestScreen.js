import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal, SafeAreaView, Dimensions, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MathText } from '../components/MathText';
import { ReportButton } from '../components/ReportButton';
import { ResilientImage } from '../components/ResilientImage';
import { saveSession, getStats } from '../utils/storage';
import { checkRecords } from '../utils/motivation';
import MotivationModal from '../components/MotivationModal';

import { Colors } from '../constants/Colors';

export const TestScreen = ({ route }) => {
    const navigation = useNavigation();
    const { questions, config } = route.params;
    const { subject } = config || {};

    const [testQuestions, setTestQuestions] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [activeImage, setActiveImage] = useState(null);

    // Motivation State
    const [motivationVisible, setMotivationVisible] = useState(false);
    const [motivationData, setMotivationData] = useState(null);

    // Timer & Stats
    const [startTime] = useState(Date.now());
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            if (!isSubmitted) {
                setDuration(Math.floor((Date.now() - startTime) / 1000));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isSubmitted]);

    // Initialize Test
    useEffect(() => {
        // 1. Filter by Difficulty
        let filtered = questions;
        if (config.difficulty === 'easy') {
            filtered = questions.filter(q => q.difficultyIndex <= 25);
        } else if (config.difficulty === 'medium') {
            filtered = questions.filter(q => q.difficultyIndex >= 13 && q.difficultyIndex <= 38);
        } else if (config.difficulty === 'hard') {
            filtered = questions.filter(q => q.difficultyIndex >= 26);
        }

        // 2. Select Unique Topics (Prefix Rule)
        // We want to pick 'config.length' questions, but no duplicates of 'key'.
        const shuffled = [...filtered].sort(() => 0.5 - Math.random());
        const selected = [];
        const usedKeys = new Set();

        for (const q of shuffled) {
            if (selected.length >= config.length) break;

            const key = q.prefix || (q.id ? q.id.split('_')[0] : Math.random().toString());
            if (!usedKeys.has(key)) {
                selected.push(q);
                usedKeys.add(key);
            }
        }

        // Fallback loop removed to prevent duplicate variations.
        // If there are fewer unique questions than requested, the quiz will just be shorter.
        // 3. Sort by Difficulty
        selected.sort((a, b) => a.difficultyIndex - b.difficultyIndex);

        setTestQuestions(selected);
    }, []);

    const handleOptionSelect = (qId, option) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [qId]: option }));
    };

    const handleSubmit = async () => {
        // Check if all answered
        if (Object.keys(answers).length < testQuestions.length) {
            Alert.alert("Incomplete", "Please answer all questions before finishing.");
            return;
        }

        setIsSubmitted(true);
        const score = calculateScore();

        // Prepare detailed results for overlap calculation
        const results = testQuestions.map(q => ({
            difficultyIndex: q.difficultyIndex,
            isCorrect: answers[q.id] === q.correctAnswer
        }));

        // Save Stats
        const updatedStats = await saveSession(subject, results, duration, config.topic);

        if (updatedStats && updatedStats.history) {
            const currentSession = {
                correct: results.filter(r => r.isCorrect).length,
                total: results.length,
                time: duration,
                topic: config.topic || 'General',
                subject: subject
            };

            // Pass full updatedStats to checkRecords
            const record = checkRecords(currentSession, updatedStats);
            if (record) {
                setMotivationData(record);
                setMotivationVisible(true);
            }
        }

        Alert.alert("Finished!", `You scored ${score}/${testQuestions.length} in ${Math.floor(duration / 60)}m ${duration % 60}s`);
    };

    const calculateScore = () => {
        let score = 0;
        testQuestions.forEach(q => {
            if (answers[q.id] === q.correctAnswer) score++;
        });
        return score;
    };



    const openZoom = (img) => {
        setActiveImage(img);
        setModalVisible(true);
    };

    return (
        <View style={styles.container}>
            {/* Motivation Modal */}
            <MotivationModal
                visible={motivationVisible}
                onClose={() => setMotivationVisible(false)}
                data={motivationData}
            />

            {/* Zoom Modal */}
            <Modal visible={modalVisible} transparent={true} onRequestClose={() => setModalVisible(false)}>
                <SafeAreaView style={styles.modalContainer}>
                    <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                        <Text style={styles.closeText}>✕ Close</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                        <ScrollView
                            maximumZoomScale={5.0} // Enable Zoom
                            minimumZoomScale={1.0}
                            centerContent={true}
                            contentContainerStyle={{ width: width, height: height * 0.8 }}
                            style={{ flex: 1 }}
                            showsHorizontalScrollIndicator={false}
                            showsVerticalScrollIndicator={false}
                        >
                            {activeImage && <Image source={{ uri: activeImage }} style={styles.fullImage} resizeMode="contain" />}
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>

            {/* Header */}
            <View style={styles.topBar}>
                <Text style={styles.topBarTitle}>Test Mode ({testQuestions.length} Qs)</Text>
                {isSubmitted && (
                    <Text style={styles.finalScore}>Score: {calculateScore()}/{testQuestions.length}</Text>
                )}
            </View>

            <ScrollView contentContainerStyle={styles.scroll}>
                {subject === 'Maths' && (
                    <View style={[styles.proTipBox, { padding: 10, margin: 10 }]}>
                        <Text style={styles.proTipText}>
                            📝 <Text style={{ fontWeight: 'bold' }}>Pro Tip:</Text> Grab a pencil and paper to avoid mistakes!
                        </Text>
                    </View>
                )}

                {testQuestions.map((q, index) => {
                    const userAnswer = answers[q.id];
                    const isCorrect = userAnswer === q.correctAnswer;

                    let cardStyle = styles.questionCard;
                    if (isSubmitted) {
                        cardStyle = [styles.questionCard, isCorrect ? styles.cardCorrect : styles.cardWrong];
                    }

                    return (
                        <View key={q.id} style={cardStyle}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                                <Text style={styles.qNum}>Question {index + 1} (Diff: {q.difficultyIndex})</Text>
                                <ReportButton questionId={q.id} />
                            </View>
                            {q.question.includes(' & ') && (title === 'Move a letter' || title === 'Move A Letter') ? (
                                <View style={styles.twoWordContainer}>
                                    <Text style={styles.wordBox}>{q.question.split(' & ')[0]}</Text>
                                    <View style={styles.wordConnector}>
                                        <Text style={styles.connectorText}>&</Text>
                                    </View>
                                    <Text style={styles.wordBox}>{q.question.split(' & ')[1]}</Text>
                                </View>
                            ) : (
                                <MathText text={q.question} fontSize={18} color="#333" style={{ marginBottom: 15 }} />
                            )}

                            {q.image && (
                                <TouchableOpacity onPress={() => openZoom(q.image)}>
                                    <ResilientImage uri={q.image} style={styles.qImage} resizeMode="contain" />
                                </TouchableOpacity>
                            )}

                            <View style={styles.optionsGrid}>
                                {q.options.map((opt, i) => {
                                    const isSelected = userAnswer === opt;
                                    const isRealAnswer = q.correctAnswer === opt;

                                    let btnStyle = [styles.optBtn]; // Start as array
                                    let textStyle = styles.optText;

                                    if (isSubmitted) {
                                        if (isRealAnswer) {
                                            btnStyle.push(styles.optBtnCorrect);
                                        } else if (isSelected) {
                                            btnStyle.push(styles.optBtnWrong);
                                        }
                                    } else {
                                        if (isSelected) {
                                            btnStyle.push(styles.optBtnSelected);
                                        }
                                    }

                                    return (
                                        <TouchableOpacity
                                            key={i}
                                            style={btnStyle}
                                            onPress={() => handleOptionSelect(q.id, opt)}
                                            disabled={isSubmitted}
                                        >
                                            <MathText text={opt} fontSize={16} color="#333" />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}

                <View style={styles.footer}>
                    {!isSubmitted ? (
                        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
                            <Text style={styles.submitBtnText}>Submit Test</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.submitBtn} onPress={() => navigation.goBack()}>
                            <Text style={styles.submitBtnText}>Done</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </ScrollView>
        </View>
    );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    topBar: { padding: 15, backgroundColor: 'white', elevation: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    topBarTitle: { fontSize: 18, fontWeight: 'bold' },
    finalScore: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
    proTipBox: {
        backgroundColor: '#fff3cd',
        borderWidth: 1,
        borderColor: '#ffeeba',
        padding: 15,
        borderRadius: 10,
        margin: 15,
        marginBottom: 5,
    },
    proTipText: {
        fontSize: 16,
        color: '#856404',
        lineHeight: 22,
    },
    scroll: { padding: 15, paddingBottom: 150 },
    questionCard: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginBottom: 20, elevation: 1 },
    cardCorrect: { borderWidth: 2, borderColor: Colors.success },
    cardWrong: { borderWidth: 2, borderColor: Colors.error },
    qNum: { color: '#888', marginBottom: 5, fontSize: 12 },
    qText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
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
    qImage: { width: '100%', height: 150, marginBottom: 10, backgroundColor: '#eee' },
    optionsGrid: { flexDirection: 'column', gap: 10, width: '100%' },
    optBtn: {
        borderWidth: 2,
        borderColor: '#ddd',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white'
    },
    optBtnSelected: {
        backgroundColor: '#E0F0FF',
        borderColor: '#2196F3' // Blue
    },
    optBtnCorrect: {
        backgroundColor: '#E8F5E9',
        borderColor: '#4CAF50' // Green
    },
    optBtnWrong: {
        backgroundColor: '#FFEBEE',
        borderColor: '#F44336' // Red
    },
    optText: { fontSize: 16, fontWeight: '500', color: '#333', textAlign: 'center' },
    footer: { marginTop: 20, alignItems: 'center' },
    submitBtn: { backgroundColor: Colors.primary, paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
    submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
    // Modal
    modalContainer: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center' },
    closeBtn: { position: 'absolute', top: 50, right: 20, padding: 10, zIndex: 1 },
    closeText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    fullImage: { width: width, height: height * 0.8 },
});
