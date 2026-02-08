import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { saveProfile } from '../utils/storage';

const Colors = {
    primary: '#4DA6FF',
    secondary: '#FFD700',
    background: '#F0F8FF',
    white: '#FFFFFF',
    text: '#333',
};

export const SetupScreen = ({ onFinish }) => {
    const [name, setName] = useState('');
    const [year, setYear] = useState('');

    const handleSubmit = async () => {
        if (!name.trim()) {
            Alert.alert("Whoops!", "Please tell us your name.");
            return;
        }

        await saveProfile(name, year);
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

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>What school year are you in?</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. 5"
                        value={year}
                        onChangeText={setYear}
                        keyboardType="numeric"
                        maxLength={2}
                    />
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
