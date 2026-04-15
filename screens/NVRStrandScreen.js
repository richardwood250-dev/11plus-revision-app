import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { getNVRStrandBelts } from '../utils/nvrSkills';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getDojoRecords } from '../utils/storage';

export const NVRStrandScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { strandId, strandTitle, strandColor } = route.params;

    const [records, setRecords] = useState({});

    useFocusEffect(
        useCallback(() => {
            let isActive = true;
            getDojoRecords().then(recs => {
                if (isActive) setRecords(recs);
            });
            return () => { isActive = false };
        }, [])
    );

    const belts = getNVRStrandBelts(strandId);

    const formatTime = (secs) => `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;

    const renderBelt = (belt) => {
        return (
            <TouchableOpacity 
                key={belt.id}
                style={[styles.beltCard, { backgroundColor: belt.color }]}
                onPress={() => navigation.navigate('NVRSkillsQuiz', { 
                    strandId: strandId,
                    beltId: belt.id, 
                    beltName: belt.name, 
                    beltColor: belt.color, 
                    beltText: belt.text 
                })}
            >
                <View style={styles.beltContent}>
                    <Text style={[styles.beltTitle, { color: belt.text }]}>{belt.name}</Text>
                    <Text style={[styles.beltDesc, { color: belt.text }]}>{belt.description}</Text>
                    {records[`nvr_${strandId}_${belt.id}`] && (
                        <Text style={[styles.beltRecord, { color: belt.text }]}>
                            🏆 Best: {records[`nvr_${strandId}_${belt.id}`].bestScore}/{records[`nvr_${strandId}_${belt.id}`].maxScore}   ⏱️ {formatTime(records[`nvr_${strandId}_${belt.id}`].bestTime)}
                        </Text>
                    )}
                </View>
                <View style={styles.beltAction}>
                    <Text style={[styles.startBtn, { color: belt.text }]}>Train ></Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { backgroundColor: strandColor, paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{strandTitle}</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.introContainer}>
                    <Text style={styles.introTitle}>Select Your Rank</Text>
                    <Text style={styles.introText}>
                        Progress from White to Black belt by mastering {strandTitle.toLowerCase()} puzzles!
                    </Text>
                </View>

                <View style={styles.beltsContainer}>
                    {belts.map(renderBelt)}
                </View>
            </ScrollView>
        </View>
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
        paddingBottom: 20,
    },
    backBtn: {
        paddingVertical: 10,
        paddingRight: 15,
        width: 60,
    },
    backBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    headerTitle: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    introContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    introTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    introText: {
        fontSize: 15,
        color: Colors.textSecondary,
        lineHeight: 22,
    },
    beltsContainer: {
        gap: 16,
    },
    beltCard: {
        flexDirection: 'row',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    beltContent: {
        flex: 1,
    },
    beltTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    beltDesc: {
        fontSize: 15,
        opacity: 0.9,
    },
    beltRecord: {
        fontSize: 13,
        fontWeight: 'bold',
        opacity: 0.9,
        marginTop: 6,
    },
    beltAction: {
        marginLeft: 15,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
    },
    startBtn: {
        fontWeight: 'bold',
        fontSize: 14,
    }
});
