
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const BackgroundWatermark = () => (
    <View style={styles.watermarkContainer} pointerEvents="none">
        <Text style={styles.watermarkText}>Free 4 All</Text>
        <Text style={styles.watermarkSubtext}>EDUCATION</Text>
    </View>
);

const styles = StyleSheet.create({
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
        opacity: 0.05,
    },
    watermarkText: {
        fontSize: 60,
        fontWeight: '900',
        color: '#000',
        textAlign: 'center',
        transform: [{ rotate: '-30deg' }],
    },
    watermarkSubtext: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#000',
        textAlign: 'center',
        marginTop: -10,
        transform: [{ rotate: '-30deg' }],
    },
});
