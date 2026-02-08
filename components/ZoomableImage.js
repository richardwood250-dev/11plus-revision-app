// ZoomableImage.js
import React, { useRef, useState } from 'react';
import { StyleSheet, Dimensions, Animated, View, TouchableOpacity, Text, Platform } from 'react-native';
// import { PinchGestureHandler, State } from 'react-native-gesture-handler'; // Disable Pinch for broad compatibility first if causing issues

const { width, height } = Dimensions.get('window');

export const ZoomableImage = ({ uri }) => {
    // We need a ref for the Animated.Value to persist
    const scale = useRef(new Animated.Value(1)).current;
    const [currentScale, setCurrentScale] = useState(1);

    // Track the conceptual scale in state so we can +/- it.
    // However, Animated.Value is what drives the transform.
    // We can just animate to absolute values.

    /* 
    // Disable Pinch temporarily to rule out conflicts on Web
    const onPinchEvent = Animated.event(
        [{ nativeEvent: { scale: scale } }],
        { useNativeDriver: Platform.OS !== 'web' }
    );

    const onPinchStateChange = event => {
        if (event.nativeEvent.oldState === State.ACTIVE) {
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: Platform.OS !== 'web'
            }).start();
            setCurrentScale(1);
        }
    };
    */

    const animateScale = (newScale) => {
        Animated.spring(scale, {
            toValue: newScale,
            useNativeDriver: Platform.OS !== 'web' // Web doesn't support transform with native driver well in some RN versions
        }).start();
    };

    const handleZoomIn = () => {
        const newScale = Math.min(currentScale + 0.5, 3); // Max zoom 3x
        setCurrentScale(newScale);
        animateScale(newScale);
    };

    const handleZoomOut = () => {
        const newScale = Math.max(currentScale - 0.5, 1); // Min zoom 1x
        setCurrentScale(newScale);
        animateScale(newScale);
    };

    return (
        <View style={styles.container}>
            {/* 
            <PinchGestureHandler
                onGestureEvent={onPinchEvent}
                onHandlerStateChange={onPinchStateChange}
            >
            */}
            <Animated.Image
                source={{ uri: uri }}
                style={[
                    styles.image,
                    {
                        transform: [{ scale: scale }]
                    }
                ]}
                resizeMode="contain"
            />
            {/* </PinchGestureHandler> */}

            {/* Manual Controls */}
            <View style={styles.controls}>
                <TouchableOpacity onPress={handleZoomOut} style={styles.btn}>
                    <Text style={styles.btnText}>-</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleZoomIn} style={styles.btn}>
                    <Text style={styles.btnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height * 0.8,
    },
    controls: {
        position: 'absolute',
        bottom: 50,
        flexDirection: 'row',
        gap: 20
    },
    btn: {
        backgroundColor: 'rgba(0,0,0,0.6)',
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'white'
    },
    btnText: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold',
        marginTop: -5
    }
});
