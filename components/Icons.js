
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

export const FlatIcon = ({ type, size = 60, style }) => {
    const textSize = size * 0.5; // Scale text relative to size

    const baseStyle = {
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
    };

    if (type === 'maths') {
        return (
            <View style={[baseStyle, { backgroundColor: Colors.primary, borderRadius: size / 1.2 }, style]}>
                <Text style={[styles.iconText, { fontSize: textSize }]}>÷</Text>
            </View>
        );
    }
    if (type === 'english') {
        return (
            <View style={[baseStyle, { backgroundColor: Colors.orange, borderRadius: size / 5 }, style]}>
                <Text style={[styles.iconText, { fontSize: textSize }]}>Aa</Text>
            </View>
        );
    }
    if (type === 'verbal') {
        return (
            <View style={[baseStyle, { backgroundColor: Colors.purple, borderRadius: size / 3, borderTopRightRadius: 0 }, style]}>
                <Text style={[styles.iconText, { fontSize: textSize }]}>...</Text>
            </View>
        );
    }
    if (type === 'non-verbal') {
        return (
            <View style={[baseStyle, { backgroundColor: Colors.green, transform: [{ rotate: '45deg' }], borderRadius: size / 6 }, style]}>
                <View style={{ transform: [{ rotate: '-45deg' }] }}>
                    <Text style={[styles.iconText, { fontSize: textSize }]}>🔷</Text>
                </View>
            </View>
        );
    }
    return null;
};

const styles = StyleSheet.create({
    iconText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
