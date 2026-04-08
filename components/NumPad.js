import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

export const NumPad = ({ onKeyPress, onSubmit, onBackspace, disabled }) => {
    const renderKey = (val, action, isCommand = false) => (
        <TouchableOpacity
            key={val}
            style={[
                styles.key,
                isCommand && styles.commandKey,
                (val === 'Enter') && styles.submitKey
            ]}
            onPress={() => {
                if (disabled) return;
                if (val === 'Enter') onSubmit();
                else if (val === 'Del') onBackspace();
                else action(val);
            }}
            disabled={disabled}
        >
            <Text style={[
                styles.keyText,
                isCommand && styles.commandKeyText,
                (val === 'Enter') && styles.submitKeyText
            ]}>
                {val}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                {renderKey('7', onKeyPress)}
                {renderKey('8', onKeyPress)}
                {renderKey('9', onKeyPress)}
            </View>
            <View style={styles.row}>
                {renderKey('4', onKeyPress)}
                {renderKey('5', onKeyPress)}
                {renderKey('6', onKeyPress)}
            </View>
            <View style={styles.row}>
                {renderKey('1', onKeyPress)}
                {renderKey('2', onKeyPress)}
                {renderKey('3', onKeyPress)}
            </View>
            <View style={styles.row}>
                {renderKey('.', onKeyPress)}
                {renderKey('0', onKeyPress)}
                {renderKey('Del', null, true)}
            </View>
            <View style={styles.row}>
                {renderKey('Enter', null, true)}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        maxWidth: 400,
        alignSelf: 'center',
        padding: 10,
        gap: 10,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    key: {
        flex: 1,
        backgroundColor: '#FFF',
        paddingVertical: width > 600 ? 15 : 10,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    keyText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    commandKey: {
        backgroundColor: '#F3F4F6',
    },
    commandKeyText: {
        fontSize: 18,
        color: Colors.textSecondary,
    },
    submitKey: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    submitKeyText: {
        color: '#FFF',
        fontSize: 20,
    }
});
