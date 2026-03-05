import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MATHS_QUIZ } from '../data/maths';

import { Colors } from '../constants/Colors';

import { ENGLISH_QUIZ } from '../data/english';
import { CLOZE_QUIZ } from '../data/cloze';
import { GRAMMAR_QUIZ } from '../data/grammar';
import { SPELLING_QUIZ } from '../data/spelling';
import { VR_COMPOUND_QUIZ } from '../data/vr_compound';
import { VERBAL_QUIZ } from '../data/verbal';
import { nonverbal } from '../data/nonverbal';

import { fetchEnglishQuiz } from '../utils/englishLoader';

export const QuizConfigScreen = ({ route }) => {
    const navigation = useNavigation();
    const { subject: initialSubject = 'Maths' } = route.params || {};

    // State
    const [difficulty, setDifficulty] = useState('easy');
    const [length, setLength] = useState(10);
    const [subject, setSubject] = useState(initialSubject);
    const [topic, setTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Reset topic when subject changes
    useEffect(() => {
        if (subject === 'Maths') setTopic('All');
        else if (subject === 'English') setTopic('Comprehension');
        else if (subject === 'Verbal') setTopic('Compound Words');
        else if (subject === 'Non-Verbal') setTopic('Matrices');
    }, [subject]);

    const activeColor =
        subject === 'Maths' ? Colors.primary :
            (subject === 'English' ? '#FF8C00' :
                (subject === 'Verbal' ? '#BA55D3' : '#32CD32'));

    const handleStart = () => {
        if (subject === 'Maths') {
            navigation.navigate('Test', {
                questions: MATHS_QUIZ,
                title: 'Maths Quiz',
                config: { difficulty, length, subject: 'Maths', topic: 'General' }
            });
        } else if (subject === 'English') {
            // English Flow
            if (topic === 'Comprehension') {
                // Fetch dynamic data
                async function startComp() {
                    try {
                        setIsLoading(true);
                        const data = await fetchEnglishQuiz();
                        setIsLoading(false);
                        navigation.navigate('Comprehension', { ...data, title: 'Comprehension' });
                    } catch (err) {
                        setIsLoading(false);
                        Alert.alert("Error", "Failed to load Comprehension: " + err.message);
                    }
                }
                startComp();
            } else {
                // For Cloze, Grammar, Spelling - these ARE passage based, so we route to Comprehension
                // but we need to pick a random passage group from their static data.

                let sourceData = [];
                if (topic === 'Cloze') sourceData = CLOZE_QUIZ;
                else if (topic === 'Grammar') sourceData = GRAMMAR_QUIZ;
                else if (topic === 'Spelling') sourceData = SPELLING_QUIZ;

                if (sourceData && sourceData.length > 0) {
                    // Helper to group by passage
                    // Helper to group by passage (robust against ID variations)
                    const getRandomPassageGroup = (data, activeTopic) => {
                        const groups = {};

                        data.forEach(q => {
                            let key = 'Unique';

                            if (activeTopic === 'Grammar') {
                                // Grammar: Group by ID Prefix (e.g. Story_01)
                                // Standard Grammar ID: Story_XX_Name_LineNum
                                const parts = q.id.split('_');
                                if (parts.length >= 3) {
                                    // Remove the last part (line number)
                                    // e.g. Story_01_Title_1 -> Story_01_Title
                                    parts.pop();
                                    key = parts.join('_');
                                } else {
                                    key = q.id;
                                }
                            } else {
                                // Spelling / Cloze: Group by Passage Text
                                // (Handles Spelling_001 vs Spelling_070 better)
                                key = q.passage ? q.passage.trim() : 'Unique';
                            }

                            if (!groups[key]) groups[key] = [];
                            groups[key].push(q);
                        });

                        // Pick random group
                        let groupKeys = Object.keys(groups);

                        // Filter out incomplete groups
                        // For Grammar, we strictly want 12 questions.
                        // For others, we ensure a reasonable minimum to avoid broken data.
                        if (activeTopic === 'Grammar') {
                            groupKeys = groupKeys.filter(k => groups[k].length >= 12);
                        } else {
                            groupKeys = groupKeys.filter(k => groups[k].length >= 5);
                        }

                        if (groupKeys.length === 0) {
                            console.warn('No valid groups found for topic:', activeTopic);
                            return null;
                        }

                        const randomKey = groupKeys[Math.floor(Math.random() * groupKeys.length)];
                        let passageQuestions = groups[randomKey];

                        // Sort by Question Number/ID naturally
                        // Try to extract numbers from ID or Question text
                        passageQuestions.sort((a, b) => {

                            // For Grammar, we want strictly line 1..12
                            if (activeTopic === 'Grammar') {
                                const getLine = (id) => {
                                    const parts = id.split('_');
                                    const num = parseInt(parts[parts.length - 1], 10);
                                    return isNaN(num) ? 0 : num;
                                };
                                return getLine(a.id) - getLine(b.id);
                            }

                            // Fallback sort - Use Natural Sort for "Question 1", "Question 10" etc.
                            return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
                        });

                        // For Grammar, ensure we found a valid passage
                        // (Use the first question's passage as the story text)
                        const text = passageQuestions[0]?.passage || randomKey;

                        return {
                            passageText: text,
                            questions: passageQuestions
                        };
                    };

                    const { passageText, questions } = getRandomPassageGroup(sourceData, topic);

                    navigation.navigate('Comprehension', {
                        title: topic + ' Quiz',
                        passageText: passageText,
                        questions: questions,
                        config: { subject: 'English', topic: topic }
                    });

                } else {
                    Alert.alert("Coming Soon", `${topic} content is not ready yet.`);
                }
            }
        } else if (subject === 'Non-Verbal') {
            if (nonverbal[topic]) {
                const dataset = nonverbal[topic].questions;

                // Helper to select diverse questions guaranteed strictly unique by image stem
                const selectDiverseQuestions = (questions, count) => {
                    const shuffled = [...questions].sort(() => 0.5 - Math.random());
                    const selected = [];
                    const seenStems = new Set();

                    for (const q of shuffled) {
                        if (selected.length >= count) break;

                        let stem = q.id;
                        if (q.image) {
                            try {
                                let filename = decodeURIComponent(q.image.split('/').pop());
                                // Extract the stem (part before the last underscore, ignoring extensions or parens)
                                filename = filename.replace(/\.\w+$/, ''); // remove .png
                                filename = filename.replace(/\s*\(\d+\)$/, ''); // remove any (1)
                                const lastUnderscore = filename.lastIndexOf('_');
                                if (lastUnderscore > -1) {
                                    stem = filename.substring(0, lastUnderscore);
                                } else {
                                    stem = filename.replace(/\d+$/, ''); // fallback for no underscore
                                }
                            } catch (e) {
                                stem = q.id;
                            }
                        }

                        // Enforce strictly one question per stem
                        if (!seenStems.has(stem)) {
                            selected.push(q);
                            seenStems.add(stem);
                        }
                    }

                    return selected;
                };

                const selectedQuestions = selectDiverseQuestions(dataset, 8); // 8 questions per session

                navigation.navigate('Quiz', {
                    title: nonverbal[topic].title,
                    questions: selectedQuestions,
                    config: { subject, topic }
                });
            } else {
                Alert.alert("Error", "Topic data not found!");
            }
        } else if (subject === 'Verbal') {
            if (topic === 'Compound Words') {
                // Shuffle and pick 10
                const shuffled = [...VR_COMPOUND_QUIZ].sort(() => 0.5 - Math.random());
                const selectedQuestions = shuffled.slice(0, 10);

                navigation.navigate('Quiz', {
                    questions: selectedQuestions,
                    config: { subject, topic }
                });
            } else if (VERBAL_QUIZ[topic]) {
                // Generic handler for dynamic topics
                const dataset = VERBAL_QUIZ[topic].questions;
                const shuffled = [...dataset].sort(() => 0.5 - Math.random());
                const selectedQuestions = shuffled.slice(0, 10); // Standardize on 10 random questions

                navigation.navigate('Quiz', {
                    title: VERBAL_QUIZ[topic].title, // Pass title
                    questions: selectedQuestions,
                    config: { subject, topic }
                });
            } else {
                Alert.alert("Error", "Topic data not found!");
            }
        }
    };

    const OptionBtn = ({ label, value, current, onSelect }) => (
        <TouchableOpacity
            style={[styles.btn, current === value && { backgroundColor: '#e6f7ff', borderColor: activeColor }]}
            onPress={() => onSelect(value)}
        >
            <Text style={[styles.btnText, current === value && { color: activeColor, fontWeight: 'bold' }]}>{label}</Text>
        </TouchableOpacity>
    );

    if (isLoading) {
        return (
            <View style={styles.loading}>
                <Text>Loading English Content...</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{subject} Quiz</Text>
            </View>

            {/* Topics */}
            <View style={styles.content}>

                {subject === 'English' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Topic</Text>
                        <View style={styles.row}>
                            <OptionBtn label="Comprehension" value="Comprehension" current={topic} onSelect={setTopic} />
                            <OptionBtn label="Cloze" value="Cloze" current={topic} onSelect={setTopic} />
                            <OptionBtn label="Grammar" value="Grammar" current={topic} onSelect={setTopic} />
                            <OptionBtn label="Spelling" value="Spelling" current={topic} onSelect={setTopic} />
                        </View>
                    </View>
                )}

                {subject === 'Maths' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Difficulty</Text>
                        <View style={styles.row}>
                            <OptionBtn label="Easy" value="easy" current={difficulty} onSelect={setDifficulty} />
                            <OptionBtn label="Medium" value="medium" current={difficulty} onSelect={setDifficulty} />
                            <OptionBtn label="Hard" value="hard" current={difficulty} onSelect={setDifficulty} />
                        </View>

                        <View style={{ height: 20 }} />

                        <Text style={styles.sectionTitle}>Number of Questions ({length})</Text>
                        <View style={styles.row}>
                            {[10, 20, 30].map(val => (
                                <OptionBtn
                                    key={val}
                                    label={`${val} Qs`}
                                    value={val}
                                    current={length}
                                    onSelect={setLength}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {subject === 'Verbal' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Topic</Text>
                        <View style={styles.row}>
                            <OptionBtn label="Compound Words" value="Compound Words" current={topic} onSelect={setTopic} />
                            {Object.keys(VERBAL_QUIZ).map(key => (
                                <OptionBtn
                                    key={key}
                                    label={VERBAL_QUIZ[key].title}
                                    value={key}
                                    current={topic}
                                    onSelect={setTopic}
                                />
                            ))}
                        </View>
                    </View>
                )}

                {subject === 'Non-Verbal' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Select Topic</Text>
                        <View style={styles.row}>
                            {Object.keys(nonverbal).map(key => (
                                <OptionBtn
                                    key={key}
                                    label={nonverbal[key].title}
                                    value={key}
                                    current={topic}
                                    onSelect={setTopic}
                                />
                            ))}
                        </View>
                    </View>
                )}

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.startBtn, { backgroundColor: activeColor, opacity: isLoading ? 0.7 : 1 }]}
                        onPress={handleStart}
                        disabled={isLoading}
                    >
                        <Text style={styles.startBtnText}>{isLoading ? 'Loading...' : 'Start Test 🚀'}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background, padding: 20 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, paddingTop: 10 },
    backBtn: { padding: 10, marginRight: 10 },
    backText: { fontSize: 24, fontWeight: 'bold', color: '#555' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', flex: 1, marginRight: 40 },

    content: { paddingBottom: 40 },
    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 18, marginBottom: 15, fontWeight: 'bold', color: '#555' },
    label: { fontSize: 18, marginBottom: 15, fontWeight: 'bold', color: '#555' },

    row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    btn: { backgroundColor: 'white', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 25, borderWidth: 1, borderColor: '#ddd', marginBottom: 10 },
    btnText: { fontSize: 16, color: '#555' },

    footer: { marginTop: 20, alignItems: 'center' },
    startBtn: { paddingVertical: 18, paddingHorizontal: 60, borderRadius: 30, elevation: 5 },
    startBtnText: { color: 'white', fontSize: 22, fontWeight: 'bold' },

    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
