import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { getStrandBelts } from '../utils/englishSkills';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const EnglishStrandScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    
    const { strandId, strandTitle, strandColor } = route.params;
    const belts = getStrandBelts(strandId);

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), backgroundColor: strandColor }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{strandTitle}</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.instruction}>Select a belt to begin your training session.</Text>
                
                <View style={styles.beltsContainer}>
                    {belts.map((belt, index) => (
                        <TouchableOpacity 
                            key={belt.id}
                            style={[
                                styles.beltCard, 
                                { backgroundColor: belt.color },
                                // Add a subtle border for white/light belts so they don't blend in
                                (belt.id === 'white' || belt.id === 'yellow') && { borderWidth: 1, borderColor: '#DDD' }
                            ]}
                            onPress={() => navigation.navigate('EnglishSkillsQuiz', { strandId, beltId: belt.id, strandTitle, beltName: belt.name, strandColor })}
                        >
                            <View style={styles.beltInfo}>
                                <Text style={[styles.beltName, { color: belt.text }]}>{belt.name}</Text>
                                <Text style={[styles.beltDesc, { color: belt.text, opacity: 0.8 }]}>{belt.description}</Text>
                            </View>
                            <View style={styles.playIconContainer}>
                                <Text style={[styles.playIcon, { color: belt.text }]}>▶</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
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
        fontSize: 20,
        fontWeight: 'bold',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 50,
    },
    instruction: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginBottom: 20,
        textAlign: 'center',
    },
    beltsContainer: {
        gap: 12,
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
        shadowRadius: 3,
        elevation: 3,
    },
    beltInfo: {
        flex: 1,
        paddingRight: 10,
    },
    beltName: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    beltDesc: {
        fontSize: 14,
    },
    playIconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    playIcon: {
        fontSize: 16,
        marginLeft: 4, // optical alignment for play button
    }
});
