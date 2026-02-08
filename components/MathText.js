import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Fraction = ({ num, denom, color = 'black', fontSize = 16 }) => {
    return (
        <View style={styles.fractionContainer}>
            <Text style={[styles.numerator, { color, fontSize: fontSize * 0.85 }]}>{num}</Text>
            <View style={[styles.line, { backgroundColor: color }]} />
            <Text style={[styles.denominator, { color, fontSize: fontSize * 0.85 }]}>{denom}</Text>
        </View>
    );
};

export const MathText = ({ text, style, color = 'black', fontSize = 16 }) => {
    if (!text) return null;

    // Split by fraction pattern: \frac{num}{denom}
    // Regex captures the whole group to keep it in the split array
    const parts = text.split(/(\\frac\{[^}]+\}\{[^}]+\})/g);

    return (
        <View style={[styles.container, style]}>
            {parts.map((part, index) => {
                if (part.startsWith('\\frac{')) {
                    // Extract num and denom
                    // \frac{num}{denom}
                    const match = part.match(/\\frac\{([^}]+)\}\{([^}]+)\}/);
                    if (match) {
                        return <Fraction key={index} num={match[1]} denom={match[2]} color={color} fontSize={fontSize} />;
                    }
                }
                // Regular Text
                // Only render if not empty string (split can create empty strings)
                if (part === '') return null;
                return <Text key={index} style={{ color, fontSize, fontWeight: '500' }}>{part}</Text>;
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    fractionContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 4,
    },
    numerator: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginBottom: -2, // pull closer to line
    },
    line: {
        width: '100%',
        height: 1.5,
        marginVertical: 2,
        minWidth: 12,
    },
    denominator: {
        textAlign: 'center',
        fontWeight: 'bold',
        marginTop: -2, // pull closer to line
    },
});
