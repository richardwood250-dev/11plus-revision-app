
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export const InterstitialAd = ({ visible, onClose }) => (
    <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.interstitialAllow}>
            <View style={styles.interstitialContent}>
                <Text style={styles.interstitialTitle}>FULL SCREEN AD</Text>
                <Text style={styles.interstitialText}>This is a simulated interstitial ad.</Text>
                <TouchableOpacity style={styles.closeAdBtn} onPress={onClose}>
                    <Text style={styles.closeAdText}>Close Ad</Text>
                </TouchableOpacity>
            </View>
        </View>
    </Modal>
);

const styles = StyleSheet.create({
    interstitialAllow: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    interstitialContent: {
        width: '85%',
        height: '60%',
        backgroundColor: '#fff',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    interstitialTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20
    },
    interstitialText: {
        fontSize: 16,
        marginBottom: 40,
        textAlign: 'center'
    },
    closeAdBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        backgroundColor: '#333',
        borderRadius: 25
    },
    closeAdText: {
        color: '#fff',
        fontWeight: 'bold'
    },
});
