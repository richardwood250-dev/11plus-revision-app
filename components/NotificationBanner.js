import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Linking, Animated } from 'react-native';
import { Colors } from '../constants/Colors';

export const NotificationBanner = () => {
    const [visible, setVisible] = useState(false);
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        // Check local storage for dismissal (Web only mostly, but safe for native check)
        const checkDismissal = async () => {
            if (Platform.OS === 'web') {
                const dismissedAt = localStorage.getItem('ninja_banner_dismissed');
                if (dismissedAt) {
                    const diff = Date.now() - parseInt(dismissedAt, 10);
                    // 24 hours = 24 * 60 * 60 * 1000 = 86400000 ms
                    if (diff < 86400000) {
                        return; // Still dismissed
                    }
                }
            }
            // Show banner
            setVisible(true);
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        };

        checkDismissal();
    }, []);

    const handleDismiss = () => {
        Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setVisible(false);
            if (Platform.OS === 'web') {
                localStorage.setItem('ninja_banner_dismissed', Date.now().toString());
            }
        });
    };

    if (!visible) return null;

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <View style={styles.contentContainer}>
                <View style={styles.textContainer}>
                    <Text style={styles.primaryText}>
                        Help us keep 11 Plus Ninja 100% free! We are adding new practice papers and 'Ninja Challenges' every week.
                    </Text>
                    <View style={styles.ctaContainer}>
                        <Text style={styles.activityText}>Have a suggestion or found a bug? We'd love your feedback: </Text>
                        <TouchableOpacity onPress={() => Linking.openURL('mailto:info@11plusninja.com')}>
                            <Text style={styles.linkText}>info@11plusninja.com</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <TouchableOpacity onPress={handleDismiss} style={styles.closeButton}>
                    <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        backgroundColor: '#1F2937', // Deep Charcoal
        paddingVertical: 12,
        paddingHorizontal: 16,
        zIndex: 1000, // Ensure it sits on top
        elevation: 10,
        ...Platform.select({
            web: {
                position: 'sticky', // Sticky at top
                top: 0,
            }
        })
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content
        maxWidth: 1000,
        alignSelf: 'center',
        width: '100%',
    },
    textContainer: {
        flex: 1,
        alignItems: 'center',
    },
    primaryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 4,
    },
    ctaContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    activityText: {
        color: '#D1D5DB', // Light Grey
        fontSize: 13,
        textAlign: 'center',
    },
    linkText: {
        color: Colors.primary, // Brand Blue
        fontWeight: 'bold',
        fontSize: 13,
        textDecorationLine: 'underline',
        marginLeft: 4,
    },
    closeButton: {
        padding: 8,
        marginLeft: 16,
    },
    closeText: {
        color: '#9CA3AF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
