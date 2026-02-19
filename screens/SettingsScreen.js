import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { clearStats } from '../utils/storage';

import { Colors } from '../constants/Colors';

export const SettingsScreen = () => {
    const navigation = useNavigation();

    const handleReset = () => {
        Alert.alert(
            "Reset All Progress?",
            "This will delete your name, streak, and all quiz scores. This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete Everything",
                    style: "destructive",
                    onPress: async () => {
                        await clearStats();
                        // Reset navigation state to force Setup again
                        navigation.dispatch(
                            CommonActions.reset({
                                index: 0,
                                routes: [{ name: 'Setup' }],
                            })
                        );
                    }
                }
            ]
        );
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Settings</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Privacy & Data</Text>
                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        🛡️ Your privacy is important.
                    </Text>
                    <Text style={styles.bodyText}>

                        We use **anonymous authentication** to securely sync your progress.
                        No personal data (email, name, phone) is collected or stored.
                        Your unique ID is used solely for feature access.
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Feedback & Support</Text>
                <TouchableOpacity
                    style={styles.feedbackBtn}
                    onPress={() => Linking.openURL('https://docs.google.com/forms/d/e/1FAIpQLSe5zi-xFUmJRzAKagLDTWyshkyWL7_aVslrjERAhfx68Ii7HA/viewform?usp=publish-editor')}
                >
                    <Text style={styles.feedbackIcon}>💬</Text>
                    <Text style={styles.feedbackBtnText}>Report a Bug / Request Feature</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>
                <TouchableOpacity style={styles.dangerBtn} onPress={handleReset}>
                    <Text style={styles.dangerBtnText}>Reset All Progress</Text>
                </TouchableOpacity>
                <Text style={styles.hintText}>
                    Use this if you want to start fresh or let someone else play.
                </Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.versionText}>Version 1.0.0</Text>
            </View>

        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: Colors.background,
        padding: 20,
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 30,
        marginTop: 10,
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.neutral,
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: Colors.white,
        padding: 20,
        borderRadius: 15,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    infoText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 10,
    },
    bodyText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    dangerBtn: {
        backgroundColor: Colors.white,
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.danger,
    },
    dangerBtnText: {
        color: Colors.danger,
        fontSize: 18,
        fontWeight: 'bold',
    },
    hintText: {
        marginTop: 10,
        color: '#888',
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    versionText: {
        textAlign: 'center',
        color: '#aaa',
        fontSize: 14,
        marginTop: 20,
    },
    feedbackBtn: {
        backgroundColor: Colors.white,
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    feedbackIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    feedbackBtnText: {
        color: Colors.text,
        fontSize: 16,
        fontWeight: '600',
    }
});
