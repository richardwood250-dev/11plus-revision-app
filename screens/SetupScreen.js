import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { saveProfile } from '../utils/storage';

import { Colors } from '../constants/Colors';

export const SetupScreen = ({ navigation, onFinish }) => {
    const [name, setName] = useState('');
    const [testDate, setTestDate] = useState(null);
    const [selectedIcon, setSelectedIcon] = useState('🐯');

    const CHARACTER_ICONS = ['🐯', '🐼', '🦊', '🐙', '🦖', '🦄', '🚀', '⭐', '🐴', '🐶', '🐠', '🐹', '🐧', '🐢', '🦋', '🤖'];

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
        const finalName = name.trim() || 'Ninja';
        const finalTestDate = testDate || dateOptions[0];
        const finalIcon = selectedIcon || '🐯';

        await saveProfile(finalName, finalTestDate, finalIcon);

        if (onFinish) {
            onFinish();
            // Force navigation to clear any cached states on web
            setTimeout(() => {
                navigation.navigate('Home');
            }, 100);
        } else {
            // We were navigated here from inside the app to add a new user
            navigation.goBack();
        }
    };

    const handleSkip = async () => {
        await saveProfile('Ninja', dateOptions[0], '🐯');
        
        if (onFinish) {
            onFinish();
            setTimeout(() => {
                navigation.navigate('Home');
            }, 100);
        } else {
            navigation.goBack();
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.scrollContainer} style={{ flex: 1, backgroundColor: Colors.primary }}>
            <View style={styles.card}>
                <Image 
                    source={require('../assets/ninja_header.png')} 
                    style={styles.logo} 
                    resizeMode="contain" 
                />
                <Text style={styles.emoji}>👋</Text>
                <Text style={styles.title}>Welcome!</Text>
                <Text style={styles.subtitle}>Let's set up your profile.</Text>

                <View style={styles.valuePropsContainer}>
                    <Text style={styles.valuePropText}>✓ Free 11+ Quizzes</Text>
                    <Text style={styles.valuePropText}>✓ Track your progress</Text>
                    <Text style={styles.valuePropText}>✓ Build a daily streak</Text>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>What's your name? (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. Alex"
                        value={name}
                        onChangeText={setName}
                        autoCorrect={false}
                    />
                </View>

                <View style={[styles.inputContainer, { zIndex: 10 }]}>
                    <Text style={styles.label}>When is your 11+ Test? (Optional)</Text>
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

                <View style={[styles.inputContainer, { zIndex: 5 }]}>
                    <Text style={styles.label}>Choose your Avatar</Text>
                    <View style={styles.iconGrid}>
                        {CHARACTER_ICONS.map((icon, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.iconButton,
                                    selectedIcon === icon && styles.iconButtonSelected
                                ]}
                                onPress={() => setSelectedIcon(icon)}
                            >
                                <Text style={styles.iconText}>{icon}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSubmit}>
                    <Text style={styles.btnText}>Start Free Training 🚀</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                    <Text style={styles.skipBtnText}>Skip for now</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
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
    logo: {
        width: 200,
        height: 60,
        marginBottom: 10,
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
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
        marginTop: 5,
    },
    iconButton: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    iconButtonSelected: {
        backgroundColor: '#E3F2FD',
        borderColor: Colors.primary,
    },
    iconText: {
        fontSize: 24,
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
    },
    valuePropsContainer: {
        marginBottom: 25,
        alignItems: 'flex-start',
        backgroundColor: '#FFFBEB',
        padding: 15,
        borderRadius: 12,
        width: '100%',
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    valuePropText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 5,
        fontWeight: '500',
    },
    skipButton: {
        width: '100%',
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 5,
    },
    skipBtnText: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold',
    }
});
