import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors } from '../constants/Colors';
import { VR_STRANDS } from '../utils/vrSkills';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Helmet } from 'react-helmet-async';

export const VRSkillsHomeScreen = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();

    const renderStrand = (strand) => {
        const strandColor = '#8B5CF6'; // Purple vibe for VR
        return (
            <TouchableOpacity 
                key={strand.id}
                style={[styles.strandCard, { borderLeftColor: strandColor }]}
                onPress={() => navigation.navigate('VRStrand', { strandId: strand.id, strandTitle: strand.title, strandColor: strandColor })}
            >
                <View style={[styles.iconContainer, { backgroundColor: strandColor + '20' }]}>
                    <Text style={styles.iconText}>{strand.icon}</Text>
                </View>
                <View style={styles.strandContent}>
                    <Text style={styles.strandTitle}>{strand.title}</Text>
                    <Text style={styles.strandDesc}>{strand.belts.length} Training Belts</Text>
                </View>
                <View style={styles.strandAction}>
                    <Text style={[styles.enterBtn, { color: strandColor }]}>Enter ></Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <Helmet>
                <title>Verbal Dojo | 11+ Ninja</title>
                <meta name="description" content="Train your verbal reasoning skills for the 11+ exam in the Verbal Dojo." />
            </Helmet>
            <View style={[styles.header, { paddingTop: Math.max(insets.top, 20) }]}>
                <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.backBtn}>
                    <Text style={styles.backBtnText}>← Home</Text>
                </TouchableOpacity>
                <Text accessibilityRole="header" aria-level="1" style={styles.headerTitle}>Verbal Dojo</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.introContainer}>
                    <Text accessibilityRole="header" aria-level="2" style={styles.introTitle}>Master the Word</Text>
                    <Text style={styles.introText}>
                        Verbal Reasoning is about patterns in language and logic. Practice each discipline to improve your speed and accuracy for the 11+!
                    </Text>
                </View>

                <View style={styles.strandsContainer}>
                    {VR_STRANDS.map(renderStrand)}
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
        backgroundColor: '#6D28D9', // Deep Purple
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
