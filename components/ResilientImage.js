import React, { useState, useEffect } from 'react';
import { Image, View, Text } from 'react-native';

export const ResilientImage = ({ uri, style, resizeMode }) => {
    const [currentUri, setCurrentUri] = useState(uri);
    const [hasError, setHasError] = useState(false);
    const [attemptedFix, setAttemptedFix] = useState(false);

    useEffect(() => {
        // Reset when prop changes
        setCurrentUri(uri);
        setHasError(false);
        setAttemptedFix(false);
    }, [uri]);

    const handleError = () => {
        if (!attemptedFix) {
            // Try to fix casing: lowercase filename -> UPPERCASE filename
            // Regex to find the filename at the end of the URL
            // e.g. .../main/p2q2_1.png -> .../main/P2Q2_1.png
            const parts = currentUri.split('/');
            const filename = parts.pop();
            if (filename) {
                // Heuristic: The user mentioned p2q36 -> P2Q35 pattern.
                // So we try uppercasing the filename (extension usually lowercase? png/PNG?)
                // Let's try uppercasing the base name, keeping extension as is?
                // Or just uppercase the whole filename. GitHub usually uses lowercase extensions but let's be careful.

                // Let's safe-bet: Uppercase the Whole Filename including extension if it fails?
                // Or just the `p2q` part.

                const upperFilename = filename.toUpperCase();

                // If it was already uppercase, this won't help. 
                // But the user said "lower case letters... instead of capital".
                // So we assume the broken one is lower, and we want upper.

                if (upperFilename !== filename) {
                    const newUri = [...parts, upperFilename].join('/');
                    console.log(`[ResilientImage] Retrying with: ${newUri}`);
                    setCurrentUri(newUri);
                    setAttemptedFix(true);
                    return;
                }
            }
        }
        // If we already tried or it didn't change anything
        setHasError(true);
    };

    if (hasError) {
        return (
            <View style={[style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#eee' }]}>
                <Text style={{ fontSize: 20 }}>🖼️</Text>
                <Text style={{ color: '#888', fontSize: 10 }}>Image not found</Text>
            </View>
        );
    }

    return (
        <Image
            source={{ uri: currentUri }}
            style={style}
            resizeMode={resizeMode}
            onError={handleError}
        />
    );
};
