import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions, Animated } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const TutorialOverlay = ({ visible, steps, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [fadeAnim] = useState(new Animated.Value(0));

    useEffect(() => {
        if (visible) {
            setCurrentStep(0);
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);

    if (!visible || !steps || steps.length === 0) return null;

    const step = steps[currentStep];
    const { x, y, width, height, text } = step;

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    // 4-View Spotlight Approach
    // Top, Bottom, Left, Right rectangles around the target
    const topHeight = Math.max(0, y);
    const bottomHeight = Math.max(0, SCREEN_HEIGHT - (y + height));
    const leftWidth = Math.max(0, x);
    const rightWidth = Math.max(0, SCREEN_WIDTH - (x + width));

    // Determine Tooltip Position (Above or Below)
    // Prefer below unless too close to bottom
    const isBottomHalf = y > SCREEN_HEIGHT / 2;
    const tooltipTop = isBottomHalf ? y - 160 : y + height + 20;

    return (
        <View style={styles.absoluteContainer} pointerEvents="auto">
            {/* Dark Overlays */}
            <View style={[styles.overlay, { width: SCREEN_WIDTH, height: topHeight, top: 0, left: 0 }]} />
            <View style={[styles.overlay, { width: SCREEN_WIDTH, height: bottomHeight, bottom: 0, left: 0 }]} />
            <View style={[styles.overlay, { width: leftWidth, height: height, top: y, left: 0 }]} />
            <View style={[styles.overlay, { width: rightWidth, height: height, top: y, right: 0 }]} />

            {/* Spotlight Border */}
            <View style={{
                position: 'absolute',
                top: y - 4,
                left: x - 4,
                width: width + 8,
                height: height + 8,
                borderColor: 'white',
                borderWidth: 2,
                borderRadius: 8,
                shadowColor: 'black',
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 10
            }} />

            {/* Tooltip Dialog */}
            <Animated.View style={[styles.tooltip, { top: tooltipTop, opacity: fadeAnim }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.stepIndicator}>Step {currentStep + 1} of {steps.length}</Text>
                    <TouchableOpacity onPress={onClose}><Text style={{ fontWeight: 'bold', fontSize: 18 }}>✕</Text></TouchableOpacity>
                </View>

                <Text style={styles.tooltipText}>{text}</Text>

                <View style={styles.buttonRow}>
                    <TouchableOpacity onPress={onClose} style={styles.skipBtn}>
                        <Text style={styles.skipText}>Skip</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleNext} style={styles.nextBtn}>
                        <Text style={styles.nextText}>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    absoluteContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999, // Ensure it sits on top
        elevation: 100,
    },
    overlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    tooltip: {
        position: 'absolute',
        left: 20,
        right: 20,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    stepIndicator: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    tooltipText: {
        fontSize: 16,
        color: '#333',
        lineHeight: 24,
        marginBottom: 20,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    skipBtn: {
        padding: 10,
    },
    skipText: {
        color: '#888',
        fontSize: 14,
    },
    nextBtn: {
        backgroundColor: '#4DA6FF',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    nextText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
