
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BackgroundWatermark } from '../components/BackgroundWatermark';
import { Colors } from '../constants/Colors';

export const SubjectScreen = ({ route }) => {
    const { title } = route.params;
    return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <BackgroundWatermark />
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>Coming Soon</Text>
            <Text style={{ fontSize: 80, marginTop: 20 }}>✅</Text>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 18,
        color: '#666',
        marginTop: 5,
        textAlign: 'center',
    },
});
