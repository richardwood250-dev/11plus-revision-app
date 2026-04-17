import React, { useState, useEffect } from 'react';
import { 
    View, Text, TextInput, TouchableOpacity, StyleSheet, 
    KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Alert 
} from 'react-native';
import { signUp, logIn } from '../utils/storage';
import { generateUsername } from '../utils/usernameGenerator';
import { Colors } from '../constants/Colors';
import { BackgroundWatermark } from '../components/BackgroundWatermark';

export const AuthScreen = ({ navigation, route }) => {
    const isLoginMode = route.params?.mode === 'login';
    const [mode, setMode] = useState(isLoginMode ? 'login' : 'signup');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (mode === 'signup' && !username) {
            handleGenerateName();
        }
    }, [mode]);

    const handleGenerateName = () => {
        setUsername(generateUsername());
    };

    const handleSubmit = async () => {
        if (!username || !password) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);
        const result = mode === 'login' 
            ? await logIn(username, password) 
            : await signUp(username, password);

        setIsLoading(false);

        if (result.success) {
            Alert.alert("Success!", mode === 'login' ? "Logged in successfully" : "Account created and progress synced!");
            navigation.navigate('Home');
        } else {
            Alert.alert("Error", result.error || "Authentication failed");
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <BackgroundWatermark />
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.card}>
                    <Image 
                        source={require('../assets/ninja_header.png')} 
                        style={styles.logo} 
                        resizeMode="contain" 
                    />
                    
                    <Text style={styles.title}>
                        {mode === 'login' ? 'Welcome Back!' : 'Ninja Signup'}
                    </Text>
                    <Text style={styles.subtitle}>
                        {mode === 'login' 
                            ? 'Login to sync your progress across devices.' 
                            : 'Create a Ninja Account to save your progress.'}
                    </Text>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Your Ninja Name</Text>
                        <View style={styles.usernameRow}>
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="SpeedyTiger42"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                                editable={mode === 'login'}
                            />
                            {mode === 'signup' && (
                                <TouchableOpacity style={styles.regenBtn} onPress={handleGenerateName}>
                                    <Text style={styles.regenBtnText}>🔄</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                        {mode === 'signup' && (
                            <Text style={styles.hint}>This is your unique username. Keep it safe!</Text>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Choose a Password</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Min 6 characters"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity 
                        style={[styles.button, isLoading && { opacity: 0.7 }]} 
                        onPress={handleSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>
                                {mode === 'login' ? 'Login 🚀' : 'Create My Account 🚀'}
                            </Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.switchBtn} 
                        onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    >
                        <Text style={styles.switchBtnText}>
                            {mode === 'login' 
                                ? "Don't have a Ninja Account? Sign Up" 
                                : "Already have an account? Login"}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.backBtn} 
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.backBtnText}>Not now, maybe later</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 25,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    logo: {
        width: 180,
        height: 50,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    inputContainer: {
        width: '100%',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#555',
        marginBottom: 8,
        marginLeft: 5,
    },
    usernameRow: {
        flexDirection: 'row',
        gap: 10,
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        color: Colors.text,
    },
    regenBtn: {
        backgroundColor: Colors.secondary,
        width: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
    },
    regenBtnText: {
        fontSize: 20,
    },
    hint: {
        fontSize: 12,
        color: Colors.primary,
        fontStyle: 'italic',
        marginTop: 5,
        marginLeft: 5,
    },
    button: {
        backgroundColor: Colors.primary,
        width: '100%',
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    btnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    switchBtn: {
        marginTop: 20,
        padding: 10,
    },
    switchBtnText: {
        color: Colors.primary,
        fontSize: 15,
        fontWeight: '600',
    },
    backBtn: {
        marginTop: 10,
        padding: 10,
    },
    backBtnText: {
        color: '#9CA3AF',
        fontSize: 14,
    }
});
