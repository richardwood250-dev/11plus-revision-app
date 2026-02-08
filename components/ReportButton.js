import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, Alert } from 'react-native';

const FORM_URL = "https://docs.google.com/forms/d/e/1FAIpQLScvYYbvXwykCDdO3SvTZ_jXRkKOqUGaMXGN98rI9gDdjy0k9Q/viewform?usp=pp_url&entry.28272770=";

export const ReportButton = ({ questionId, style }) => {
    const handlePress = async () => {
        const fullUrl = `${FORM_URL}${encodeURIComponent(questionId)}`;
        try {
            const supported = await Linking.canOpenURL(fullUrl);
            if (supported) {
                await Linking.openURL(fullUrl);
            } else {
                Alert.alert("Error", "Cannot open browser for reporting.");
            }
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Something went wrong trying to open the report form.");
        }
    };

    return (
        <TouchableOpacity style={[styles.container, style]} onPress={handlePress}>
            <Text style={styles.icon}>🚩</Text>
            <Text style={styles.text}>Flag Error</Text>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 5,
        opacity: 0.6,
    },
    icon: {
        fontSize: 14,
        marginRight: 4,
    },
    text: {
        fontSize: 12,
        color: '#666',
        textDecorationLine: 'underline',
    }
});
