import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { saveProfile } from '../utils/storage';

import { Colors } from '../constants/Colors';

export const SetupScreen = ({ onFinish }) => {
    const [name, setName] = useState('');
    const [testDate, setTestDate] = useState(null);

    // Calculate next 3 Septembers
    // Rules: If current month >= Oct (9), start next year. Else start this year.
    const getTestDateOptions = () => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); // 0 = Jan, 9 = Oct

        let startYear = currentYear;
        if (currentMonth >= 9) { // Sept this year has passed for 11+ purposes mostly? 
            // Actually requirement says: "by October this year it will change to Sept 27..."
            // So if today is Oct 2025 -> options start Sept 2026.
            // If today is Feb 2026 -> options start Sept 2026.
            startYear = currentYear + 1;
        }

        return [
            `Sept ${startYear}`,
            `Sept ${startYear + 1}`,
            `Sept ${startYear + 2}`
        ];
    };

    const dateOptions = getTestDateOptions();

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert("Whoops!", "Please tell us your name.");
            return;
        }
        if (!testDate) {
            Alert.alert("Almost there!", "Please select your 11+ test date.");
            return;
        }

        await saveProfile(name, testDate);
        onFinish();
    };

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.emoji}>👋</Text>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's set up your profile.</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>What's your name?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Alex"
                        value={name}
                        onChangeText={setName}
                        autoCorrect={false}
                    />
                </View>

                <View style={[styles.inputContainer, { zIndex: 10 }]}>
                    <Text style={styles.label}>When is your 11+ Test?</Text>
                    <View style={styles.dateOptionsContainer}>
                        {dateOptions.map((date) => (
                            <TouchableOpacity
                                key={date}
                                style={[
                                    styles.dateOption,
                                    testDate === date && styles.dateOptionSelected
                                ]}
                                onPress={() => setTestDate(date)}
                            >
                                <Text style={[
                                    styles.dateText,
                                    testDate === date && styles.dateTextSelected
                                ]}>{date}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.btnText}>Let's Go! 🚀</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 10,
    },
    emoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 15,
        fontSize: 18,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    dateOptionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 5,
    },
    dateOption: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderRadius: 10,
        padding: 10,
        marginHorizontal: 4,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    dateOptionSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: Colors.primary,
    },
    dateText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    dateTextSelected: {
        color: Colors.primary,
    },
    button: {
        backgroundColor: Colors.secondary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    btnText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    }
});
