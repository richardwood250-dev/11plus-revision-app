
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export const AdRail = ({ side }) => (
    <View style={[
        styles.adRail,
        side === 'left' ? { left: 'calc(50% - 240px - 180px)' } : { right: 'calc(50% - 240px - 180px)' },
        Platform.OS !== 'web' && { display: 'none' } // Only show on web
    ]}>
        <View style={styles.adPlaceholder}>
            <Text style={styles.adText}>AD SPACE</Text>
            <Text style={styles.adSubText}>160 x 600</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    adRail: {
        position: 'absolute', // 'fixed' in web css terms but absolute relative to root works if root is 100vh
        top: '50%',
        width: 160,
        height: 600,
        marginTop: -300, // half height to center vertically
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        ...Platform.select({
            web: { position: 'fixed' } // Ensure it stays on scroll
        })
    },
    adPlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#E3F2FD', // Light Blue
        borderWidth: 1,
        borderColor: '#90CAF9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    adText: {
        color: '#1976D2',
        fontWeight: 'bold',
        fontSize: 18,
        textAlign: 'center'
    },
    adSubText: {
        color: '#1976D2',
        fontSize: 12,
        marginTop: 5
    },
});
