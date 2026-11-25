import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { askSensei } from '../utils/sensei';
import { Colors } from '../constants/Colors';

export const SenseiExplainButton = ({
    subject,
    topic,
    question,
    options = [],
    userAnswer = '',
    correctAnswer = '',
    passageText = '',
    imageUrl = '',
    mode = 'explain',
    fallbackReasoning = '',
}) => {
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState(null);
    const [isOpen, setIsOpen] = useState(false);

    const handlePress = async () => {
        if (response) {
            setIsOpen(!isOpen);
            return;
        }
        setIsOpen(true);
        setLoading(true);
        const res = await askSensei({
            subject,
            topic,
            question,
            options,
            userAnswer,
            correctAnswer,
            passageText,
            imageUrl,
            mode,
            fallbackReasoning,
        });
        setResponse(res);
        setLoading(false);
    };

    const label = mode === 'hint' ? '💡 Sensei Hint' : '🥷 Explain Why';

    return (
        <View style={styles.wrapper}>
            <TouchableOpacity style={styles.btn} onPress={handlePress} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                    <Text style={styles.btnText}>
                        {response && isOpen ? 'Hide Sensei ▲' : label}
                    </Text>
                )}
            </TouchableOpacity>

            {isOpen && (loading || response) && (
                <View style={[styles.card, response && !response.ok && styles.cardMuted]}>
                    <Text style={styles.cardHeader}>
                        {mode === 'hint' ? '🥷 Sensei Hint' : '🥷 Sensei Explanation'}
                    </Text>
                    {loading ? (
                        <Text style={styles.loadingText}>Sensei is thinking...</Text>
                    ) : (
                        <Text style={styles.cardBody}>{response?.text}</Text>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginTop: 10,
        width: '100%',
    },
    btn: {
        alignSelf: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
    },
    btnText: {
        color: Colors.primary,
        fontWeight: '700',
        fontSize: 13,
    },
    card: {
        marginTop: 8,
        backgroundColor: '#F8FAFC',
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
        borderRadius: 10,
        padding: 12,
    },
    cardMuted: {
        borderLeftColor: '#94A3B8',
    },
    cardHeader: {
        fontSize: 13,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 4,
    },
    loadingText: {
        fontSize: 13,
        color: '#64748B',
        fontStyle: 'italic',
    },
    cardBody: {
        fontSize: 14,
        color: '#1E293B',
        lineHeight: 20,
    },
});
