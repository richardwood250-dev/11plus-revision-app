
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, Alert, StyleSheet, Linking } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { BackgroundWatermark } from '../components/BackgroundWatermark';
import { PieChart } from '../components/PieChart';
import { getStats, getProfile, clearStats } from '../utils/storage';
import { FlatIcon } from '../components/Icons';

export const DashboardScreen = () => {
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const isFocused = useIsFocused();
    const [profile, setProfile] = useState(null);
    const [selectedSubject, setSelectedSubject] = useState(null);
    const [expandedChart, setExpandedChart] = useState(null); // 'bar' or 'pie'

    useEffect(() => {
        if (isFocused) {
            const loadStats = async () => {
                setIsLoading(true);
                const data = await getStats();
                const p = await getProfile();
                setStats(data);
                setProfile(p);
                setIsLoading(false);
            };
            loadStats();
        }
    }, [isFocused]);

    if (isLoading) return <View style={styles.container}><Text style={{ marginTop: 20 }}>Loading...</Text></View>;

    if (!stats || !stats.bySubject || Object.keys(stats.bySubject).length === 0) {
        return (
            <View style={styles.container}>
                <BackgroundWatermark />
                <ScrollView contentContainerStyle={styles.scroll}>
                    <Text style={styles.title}>{profile ? `${profile.name}'s Progress 📊` : 'Your Progress 🏆'}</Text>
                    <Text style={styles.placeholderText}>No quizzes played yet! Jump into the Dojo to get started.</Text>
                </ScrollView>
            </View>
        );
    }

    const subjects = ['Maths', 'English', 'Verbal', 'Non-Verbal'];

    const getAcc = (subjKey) => {
        const data = stats.bySubject && stats.bySubject[subjKey];
        if (!data || !data.topics) return 0;

        // Calculate Average of Topic Averages (Rolling last 5)
        let totalTopicAcc = 0;
        let topicCount = 0;

        Object.values(data.topics).forEach(t => {
            // Prioritize recentScores if available and populated
            if (t.recentScores && t.recentScores.length > 0) {
                const sum = t.recentScores.reduce((a, b) => a + b, 0);
                totalTopicAcc += (sum / t.recentScores.length);
                topicCount++;
            } else if (t.total > 0) {
                // Fallback to lifetime if no recentScores (shouldn't happen with backfill)
                totalTopicAcc += (t.correct / t.total) * 100;
                topicCount++;
            }
        });

        if (topicCount === 0) return 0;
        return Math.round(totalTopicAcc / topicCount);
    };

    const getSubjColor = (subj) => {
        if (subj === 'Maths') return Colors.primary;
        if (subj === 'English') return Colors.orange;
        if (subj === 'Verbal') return Colors.purple;
        if (subj === 'Non-Verbal') return Colors.green;
        return '#ccc';
    };

    // Pie Data
    const pieData = subjects.map(s => ({
        value: (stats.bySubject[s]?.time || 0),
        color: getSubjColor(s),
        label: s
    })).filter(d => d.value > 0);

    // Modal Content
    const renderExpandedChart = () => (
        <Modal visible={!!expandedChart} transparent={true} animationType="fade" onRequestClose={() => setExpandedChart(null)}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>{expandedChart === 'bar' ? 'Accuracy Comparison' : 'Time Distribution'}</Text>

                    {expandedChart === 'bar' ? (
                        <View style={[styles.chartContainer, { height: 300, width: '100%' }]}>
                            {subjects.map((subj) => {
                                const acc = getAcc(subj);
                                return (
                                    <View key={subj} style={styles.chartColumn}>
                                        <Text style={styles.barLabelTop}>{acc}%</Text>
                                        <View style={[
                                            styles.bar,
                                            { height: Math.max(acc, 5) + '%', backgroundColor: getSubjColor(subj), width: 50 }
                                        ]} />
                                        <Text style={styles.barLabelBottom}>{subj === 'Non-Verbal' ? 'NVR' : subj}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center' }}>
                            <PieChart data={pieData} size={250} onPress={() => { }} />
                            <View style={styles.legendContainer}>
                                {pieData.map((d, i) => (
                                    <View key={i} style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                                        <Text style={styles.legendText}>{d.label} ({Math.round(d.value / 60)}m)</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    <TouchableOpacity onPress={() => setExpandedChart(null)} style={styles.closeBtnModal}>
                        <Text style={styles.closeBtnText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <BackgroundWatermark />
            {renderExpandedChart()}
            <ScrollView contentContainerStyle={styles.scroll}>
                <Text style={styles.title}>{profile ? `${profile.name}'s Progress 📊` : 'Your Progress 🏆'}</Text>

                {/* --- CHARTS ROW --- */}
                <Text style={styles.sectionHeader}>Overview</Text>
                <Text style={styles.hintText}>Tap charts to enlarge</Text>

                <View style={styles.chartsRow}>
                    {/* Bar Chart (Left) */}
                    <TouchableOpacity style={styles.miniChartCard} onPress={() => setExpandedChart('bar')}>
                        <Text style={styles.miniChartTitle}>Accuracy</Text>
                        <View style={styles.miniBarContainer}>
                            {subjects.map((subj) => (
                                <View key={subj} style={[styles.miniBar, {
                                    height: Math.max(getAcc(subj), 10) + '%',
                                    backgroundColor: getSubjColor(subj)
                                }]} />
                            ))}
                        </View>
                    </TouchableOpacity>

                    {/* Pie Chart (Right) */}
                    <TouchableOpacity style={styles.miniChartCard} onPress={() => setExpandedChart('pie')}>
                        <Text style={styles.miniChartTitle}>Time Spent</Text>
                        <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                            <PieChart data={pieData} size={100} onPress={() => setExpandedChart('pie')} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* --- RECENT ACTIVITY --- */}
                <Text style={styles.sectionHeader}>Recent Activity</Text>
                <View style={styles.historyContainer}>
                    {(!stats.history || stats.history.length === 0) ? (
                        <Text style={styles.placeholderText}>No quizzes played yet.</Text>
                    ) : (
                        stats.history.map((item, index) => (
                            <View key={index} style={styles.historyItem}>
                                <FlatIcon type={item.subject.toLowerCase()} size={40} />
                                <View style={{ flex: 1, marginLeft: 10 }}>
                                    <Text style={styles.historySubject}>{item.subject} - {item.topic}</Text>
                                    <Text style={styles.historyDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                                </View>
                                <View>
                                    <Text style={[styles.historyScore, { color: item.accuracy > 80 ? Colors.green : item.accuracy < 50 ? Colors.error : Colors.orange }]}>
                                        {item.accuracy}%
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>


                <Text style={styles.sectionHeader}>Detailed Breakdown</Text>
                <Text style={styles.hintText}>Select a subject to view topics</Text>

                {/* --- SUBJECT BUTTONS ROW --- */}
                <View style={styles.subjectRow}>
                    {subjects.map((subj) => {
                        const isSelected = selectedSubject === subj;
                        return (
                            <TouchableOpacity
                                key={subj}
                                style={[
                                    styles.subjectBtnSmall,
                                    {
                                        backgroundColor: isSelected ? getSubjColor(subj) : 'white',
                                        borderColor: getSubjColor(subj),
                                        borderWidth: 1
                                    }
                                ]}
                                onPress={() => setSelectedSubject(subj === selectedSubject ? null : subj)}
                            >
                                <Text style={[
                                    styles.subjectBtnText,
                                    { color: isSelected ? 'white' : getSubjColor(subj) }
                                ]}>
                                    {subj === 'Non-Verbal' ? 'NVR' : subj}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* --- DETAILS PANEL --- */}
                {selectedSubject && (
                    <View style={styles.detailsContainer}>
                        <View style={[styles.detailsHeader, { borderLeftColor: getSubjColor(selectedSubject) }]}>
                            <Text style={styles.detailsTitle}>{selectedSubject} Topics</Text>
                            <TouchableOpacity onPress={() => setSelectedSubject(null)}>
                                <Text style={{ color: '#666' }}>Close x</Text>
                            </TouchableOpacity>
                        </View>
                        {(!stats.bySubject[selectedSubject]?.topics) ? (
                            <Text>No data yet.</Text>
                        ) : (
                            Object.entries(stats.bySubject[selectedSubject].topics).map(([topic, tData]) => {
                                // Calculate Rolling Average
                                let tAcc = 0;
                                if (tData.recentScores && tData.recentScores.length > 0) {
                                    const sum = tData.recentScores.reduce((a, b) => a + b, 0);
                                    tAcc = Math.round(sum / tData.recentScores.length);
                                } else if (tData.total > 0) {
                                    // Fallback
                                    const displayCorrect = Math.min(tData.correct, tData.total);
                                    tAcc = Math.round((displayCorrect / tData.total) * 100);
                                }

                                return (
                                    <View key={topic} style={styles.topicRowDetailed}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.topicName}>{topic}</Text>
                                            <Text style={styles.topicSubText}>Recent Form (Last 5)</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={[styles.topicValue, { color: tAcc < 50 ? Colors.error : Colors.primary }]}>
                                                {tAcc}%
                                            </Text>
                                            <View style={styles.miniBarBg}>
                                                <View style={[styles.miniBarFill, { width: tAcc + '%', backgroundColor: getSubjColor(selectedSubject) }]} />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={[styles.mainButton, { marginTop: 40, backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc' }]}
                    onPress={() => {
                        Alert.alert(
                            "Reset Statistics?",
                            "Are you sure you want to reset your stats? Your streak will remain safe.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Reset",
                                    style: "destructive",
                                    onPress: async () => {
                                        await clearStats();
                                        setStats(null);
                                        setSelectedSubject(null);
                                    }
                                }
                            ]
                        );
                    }}
                >
                    <Text style={[styles.btnText, { color: '#666' }]}>Reset Stats</Text>
                </TouchableOpacity>

                {/* Feedback Section */}
                <TouchableOpacity
                    style={[styles.mainButton, { marginTop: 15, backgroundColor: Colors.primary }]}
                    onPress={() => {
                        Linking.openURL('mailto:info@11plusninja.com?subject=App Feedback');
                    }}
                >
                    <Text style={styles.btnText}>Give Feedback / Review</Text>
                </TouchableOpacity>
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    scroll: {
        padding: 20,
        alignItems: 'center',
        paddingBottom: 40,
        width: '100%',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center',
        color: Colors.text,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
        alignSelf: 'flex-start',
        marginBottom: 15,
        marginTop: 10,
    },
    hintText: {
        fontStyle: 'italic',
        color: '#888',
        marginBottom: 10,
        alignSelf: 'center',
    },
    chartsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 30,
        width: '100%'
    },
    miniChartCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        height: 180,
        elevation: 2,
        alignItems: 'center'
    },
    miniChartTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#555'
    },
    miniBarContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        flex: 1,
        width: '100%'
    },
    miniBar: {
        width: 15,
        borderRadius: 3,
    },
    historyContainer: {
        width: '100%',
        marginBottom: 30
    },
    historyItem: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 1
    },
    historyIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center'
    },
    historySubject: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text
    },
    historyDate: {
        fontSize: 12,
        color: '#888'
    },
    historyScore: {
        fontSize: 18,
        fontWeight: 'bold'
    },
    placeholderText: {
        textAlign: 'center',
        color: '#888',
        marginTop: 20,
        fontSize: 16,
    },
    subjectRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        width: '100%',
        gap: 10
    },
    subjectBtnSmall: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 1
    },
    subjectBtnText: {
        fontWeight: 'bold',
        fontSize: 14
    },
    detailsContainer: {
        width: '100%',
        minHeight: 100,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 15,
        elevation: 3,
        marginBottom: 20,
    },
    detailsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
        borderLeftWidth: 4,
        paddingLeft: 10,
    },
    detailsTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    topicRowDetailed: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        paddingBottom: 8,
    },
    topicName: {
        fontSize: 16,
        color: '#555'
    },
    topicSubText: {
        fontSize: 12,
        color: '#999',
    },
    topicValue: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    miniBarBg: {
        width: 60,
        height: 6,
        backgroundColor: '#eee',
        borderRadius: 3,
        marginTop: 4,
    },
    miniBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    mainButton: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 30,
        elevation: 3,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    btnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    // Modal Overrides
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '100%',
        maxHeight: '80%',
        alignItems: 'center',
        elevation: 5
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 20,
        color: Colors.text
    },
    chartContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 2,
        marginBottom: 20,
        borderBottomWidth: 4,
        borderBottomColor: '#eee'
    },
    chartColumn: {
        alignItems: 'center',
        justifyContent: 'flex-end',
        height: '100%',
        flex: 1,
    },
    bar: {
        width: 40,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        marginTop: 5,
    },
    barLabelTop: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 2,
    },
    barLabelBottom: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
    legendContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: 20,
        gap: 15
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    legendDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 6
    },
    legendText: {
        fontSize: 14,
        color: '#555'
    },
    closeBtnModal: {
        marginTop: 20,
        padding: 15,
        backgroundColor: '#eee',
        borderRadius: 10,
        width: '100%',
        alignItems: 'center'
    },
    closeBtnText: {
        fontWeight: 'bold',
        color: '#333'
    },
});
