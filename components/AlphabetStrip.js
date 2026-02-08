import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

export const AlphabetStrip = () => {
    return (
        <View style={styles.container}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
                {ALPHABET.map((letter, index) => (
                    <View key={letter} style={styles.letterBox}>
                        <Text style={styles.letter}>{letter}</Text>
                        <Text style={styles.number}>{index + 1}</Text>
                    </View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        marginBottom: 10,
    },
    scroll: {
        paddingHorizontal: 10,
        gap: 5,
    },
    letterBox: {
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 5,
        backgroundColor: '#f0f8ff',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: '#d0e0f0',
        minWidth: 35,
    },
    letter: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    number: {
        fontSize: 10,
        color: '#666',
        marginTop: 2,
    }
});
