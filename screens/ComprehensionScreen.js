import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getInstruction } from '../data/instructions';

import { Colors as BaseColors } from '../constants/Colors';

const Colors = {
    ...BaseColors,
    primary: '#FF8C00', // Orange for English
    background: '#FFF5E6', // Light Orange
    selected: '#FFE0B2',
};

export const ComprehensionScreen = ({ route }) => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const { questions, passageText } = route.params;

    const [groupedPassages, setGroupedPassages] = useState([]);
    const [answers, setAnswers] = useState({}); // { questionId: selectedOption }
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(null);

    // Dynamic Title
    React.useLayoutEffect(() => {
        navigation.setOptions({
            title: route.params.title || 'Comprehension',
        });
    }, [navigation, route.params.title]);

    // Timer & Stats (Per session)
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

    // Use passed data directly
    useEffect(() => {
        if (passageText && questions) {
            setGroupedPassages([{
                text: passageText,
                questions: questions
            }]);
        }
    }, [questions, passageText]);

    const handleOptionSelect = (qId, optionLetter) => {
        if (isSubmitted) return;
        setAnswers(prev => ({ ...prev, [qId]: optionLetter }));
    };

    const handleSubmit = async () => {
        const currentGroup = groupedPassages[0];
        const allQuestions = currentGroup.questions;

        if (isSubmitted) return;

        if (Object.keys(answers).length < allQuestions.length) {
            Alert.alert("Incomplete", "Please answer all questions before finishing.");
            return;
        }

        setIsSubmitted(true);

        let score = 0;
        const results = [];
        allQuestions.forEach(q => {
            const isCorrect = answers[q.id] === q.correctAnswer;
            if (isCorrect) score++;
            results.push({
                difficultyIndex: 1,
                isCorrect: isCorrect
            });
        });

        const { saveSession } = require('../utils/storage');
        const { checkRecords } = require('../utils/motivation');

        // Default to 'Comprehension' if not passed
        const topic = route.params.config?.topic || 'Comprehension';
        const updatedStats = await saveSession('English', results, duration, topic);

        if (updatedStats) {
            const currentSession = {
                correct: score,
                total: allQuestions.length,
                time: duration,
                topic: topic,
                subject: 'English'
            };
            const recordMsg = checkRecords(currentSession, updatedStats);
            if (recordMsg) {
                // Ensure specific ninja styling
                Alert.alert("🎉 NINJA RECORD! 🎉", recordMsg.message);
            }
        }

        setScore(score);
    };

    if (groupedPassages.length === 0) {
        return (
            <View style={styles.loading}>
                <Text>Loading...</Text>
                <Text style={{ fontSize: 10, color: '#888', marginTop: 10 }}>
                    Debug: Text={passageText ? 'Yes' : 'No'}, Qs={questions ? questions.length : 'None'}
                </Text>
            </View>
        );
    }

    const currentGroup = groupedPassages[0];
    const configTopic = route.params.config?.topic;
    const title = route.params.title || '';

    // Robust detection: Check config topic OR title hints
    const isGrammar = configTopic === 'Grammar' || title.includes('Grammar');
    const isSpelling = configTopic === 'Spelling' || title.includes('Spelling');

    const settingsTopic = isGrammar ? 'Grammar' : (isSpelling ? 'Spelling' : (configTopic || 'Comprehension'));
    const instructions = getInstruction(route.params.title, settingsTopic);

    // Explicitly check for Grammar or Spelling to use single pane
    const useSinglePane = isGrammar || isSpelling;

    const renderQuestions = () => (
        <View style={useSinglePane ? styles.questionsContainerSingle : styles.questionsContainerSplit}>
            {isSubmitted && (
                <View style={styles.scoreCard}>
                    <Text style={styles.scoreTitle}>Quiz Complete!</Text>
                    <Text style={styles.scoreText}>You scored {score} / {currentGroup.questions.length}</Text>
                </View>
            )}
            {currentGroup.questions.map((q, index) => {
                const userAnswer = answers[q.id];
                const isCorrect = userAnswer === q.correctAnswer;

                let cardStyle = styles.questionCard;
                if (isSubmitted) {
                    cardStyle = [styles.questionCard, isCorrect ? styles.cardCorrect : styles.cardWrong];
                }

                return (
                    <View key={q.id} style={cardStyle}>
                        <Text style={styles.qText}>{index + 1}.{useSinglePane ? '' : ` ${q.question}`}</Text>
                        <View style={styles.optionsGrid}>
                            {q.options.map((opt, i) => {
                                const letter = String.fromCharCode(65 + i); // A, B, C...
                                const isSelected = userAnswer === letter;
                                const isRealCorrect = q.correctAnswer === letter;

                                let btnStyle = [styles.optBtn];
                                // Minimal style for Grammar/Spelling
                                if (useSinglePane) btnStyle.push(styles.optBtnMinimal);

                                if (isSubmitted) {
                                    if (isRealCorrect) {
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
                                        onPress={() => handleOptionSelect(q.id, letter)}
                                        disabled={isSubmitted}
                                    >
                                        {/* Layout: Vertical for Grammar/Spelling (Label Above), Row for others */}
                                        <View style={{ flexDirection: useSinglePane ? 'column' : 'row', alignItems: useSinglePane ? 'center' : 'flex-start' }}>
                                            {useSinglePane && (
                                                <Text style={[styles.optLetter, { marginBottom: 4, fontSize: 12 }]}>{letter}</Text>
                                            )}

                                            {!useSinglePane && (
                                                <Text style={[styles.optLetter, isSelected && { fontWeight: 'bold', color: Colors.primary }]}>{letter}. </Text>
                                            )}

                                            <Text style={[styles.optText, useSinglePane && { textAlign: 'center', fontSize: 15 }]}>{opt}</Text>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                        {isSubmitted && q.explanation && (
                            <View style={styles.explanationBox}>
                                <Text style={styles.explanationTitle}>Explanation:</Text>
                                <Text style={styles.explanationText}>{q.explanation}</Text>
                            </View>
                        )}
                    </View>
                );
            })}

            <View style={styles.navBar}>
                {isSubmitted ? (
                    <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.navBtn, { backgroundColor: '#ccc', width: '100%' }]}>
                        <Text style={styles.navText}>Done</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleSubmit} style={[styles.navBtn, { backgroundColor: Colors.primary, width: '100%' }]}>
                        <Text style={styles.navText}>Submit Answers</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

            {useSinglePane ? (
                // SINGLE PANE LAYOUT (Scroll everything together)
                <ScrollView contentContainerStyle={styles.singlePaneScroll}>
                    <View style={styles.instructionBox}>
                        <Text style={styles.instructionText}>ℹ️ {instructions}</Text>
                    </View>

                    {/* Passage text hidden for Grammar/Spelling as requested 
                    <View style={styles.passageContainer}>
                        <Text style={styles.passageText}>{currentGroup.text}</Text>
                    </View> 
                    */}

                    {renderQuestions()}
                </ScrollView>
            ) : (
                // SPLIT LAYOUT (Passage fixed top, Questions scroll bottom)
                <>
                    {/* Top Half: Passage */}
                    <View style={styles.topHalf}>
                        <ScrollView contentContainerStyle={styles.passageScroll}>
                            <View style={styles.instructionBox}>
                                <Text style={styles.instructionText}>ℹ️ {instructions}</Text>
                            </View>
                            <Text style={styles.passageText}>{currentGroup.text}</Text>
                        </ScrollView>
                    </View>

                    {/* Divider */}
                    <View style={styles.divider} />

                    {/* Bottom Half: Questions */}
                    <View style={styles.bottomHalf}>
                        <ScrollView contentContainerStyle={styles.questionsScroll}>
                            {renderQuestions()}
                        </ScrollView>
                    </View>
                </>
            )}

        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Layout
    topHalf: { flex: 0.45, backgroundColor: 'white', borderBottomWidth: 1, borderColor: '#ccc' },
    bottomHalf: { flex: 0.55, backgroundColor: '#F9F9F9' },
    divider: { height: 5, backgroundColor: Colors.primary },

    // Single Pane
    singlePaneScroll: { padding: 20, paddingBottom: 100 },
    passageContainer: { marginBottom: 20 },
    questionsContainerSingle: { marginTop: 20 },
    questionsContainerSplit: {},

    // Instructions
    instructionBox: {
        padding: 10,
        backgroundColor: '#E3F2FD',
        margin: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#90CAF9'
    },
    instructionText: {
        fontSize: 14,
        color: '#0D47A1',
        fontStyle: 'italic'
    },

    // Passage
    passageScroll: { padding: 20 },
    passageText: { fontSize: 18, lineHeight: 28, fontFamily: 'serif', color: '#222' },

    // Questions
    questionsScroll: { padding: 15, paddingBottom: 50 },
    questionCard: { backgroundColor: 'white', padding: 15, borderRadius: 10, marginBottom: 15, elevation: 1 },
    cardCorrect: { borderWidth: 2, borderColor: Colors.success },
    cardWrong: { borderWidth: 2, borderColor: Colors.error },
    qText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },



    optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', gap: 10 },
    optBtn: { width: '47%', borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 8, backgroundColor: 'white' },
    optBtnMinimal: { width: 'auto', minWidth: 60, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#eee' }, // Cleaner look for grammar
    optBtnSelected: { backgroundColor: Colors.selected, borderColor: Colors.primary },
    optBtnCorrect: { backgroundColor: '#E8F5E9', borderColor: Colors.success },
    optBtnWrong: { backgroundColor: '#FFEBEE', borderColor: Colors.error },
    optText: { fontSize: 16, flex: 1 },
    optLetter: { fontSize: 16, color: '#888', fontWeight: 'bold' },

    // Nav
    navBar: { flexDirection: 'row', justifyContent: 'center', marginTop: 10, marginBottom: 40 },
    navBtn: { padding: 15, borderRadius: 8, backgroundColor: Colors.primary, minWidth: 200, alignItems: 'center' },
    navText: { color: 'white', fontWeight: 'bold', fontSize: 18 },

    // Score
    scoreCard: { backgroundColor: Colors.secondary, padding: 15, borderRadius: 10, marginBottom: 20, alignItems: 'center', elevation: 2 },
    scoreTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5 },
    scoreText: { fontSize: 18, fontWeight: 'bold', color: '#555' },

    // Explanation
    explanationBox: { marginTop: 15, padding: 10, backgroundColor: '#FFFDE7', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: Colors.secondary },
    explanationTitle: { fontWeight: 'bold', marginBottom: 5, color: '#FBC02D' },
    explanationText: { fontStyle: 'italic', color: '#555' }
});
