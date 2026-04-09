import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { ENGLISH_STRANDS } from '../utils/englishSkills';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const EnglishSkillsHomeScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const renderStrand = (strand) => {
        return (
            <TouchableOpacity 
                key={strand.id}
                style={[styles.strandCard, { borderLeftColor: strand.color }]}
                onPress={() => navigation.navigate('EnglishStrand', { strandId: strand.id, strandTitle: strand.title, strandColor: strand.color })}
            >
                <View style={[styles.iconContainer, { backgroundColor: strand.color + '20' }]}>
                    <Text style={styles.iconText}>{strand.icon}</Text>
                </View>
                <View style={styles.strandContent}>
                    <Text style={styles.strandTitle}>{strand.title}</Text>
                    <Text style={styles.strandDesc}>{strand.description}</Text>
                </View>
                <View style={styles.strandAction}>
                    <Text style={[styles.enterBtn, { color: strand.color }]}>Enter ></Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Word Dojo</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.introContainer}>
                    <Text style={styles.introTitle}>Choose Your Discipline</Text>
                    <Text style={styles.introText}>
                        Select an English strand to begin your training. Master each belt from White to Black to become a true Word Ninja!
                    </Text>
                </View>

                <View style={styles.strandsContainer}>
                    {ENGLISH_STRANDS.map(renderStrand)}
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
        backgroundColor: Colors.orange, // Use a different primary color for English
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
    strandsContainer: {
        gap: 16,
    },
    strandCard: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#FFF',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderLeftWidth: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    iconText: {
        fontSize: 24,
    },
    strandContent: {
        flex: 1,
    },
    strandTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 4,
    },
    strandDesc: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    strandAction: {
        marginLeft: 10,
        paddingHorizontal: 8,
    },
    enterBtn: {
        fontWeight: 'bold',
        fontSize: 16,
    }
});
