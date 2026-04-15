import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Polygon, G } from 'react-native-svg';

export const NVRVisualizer = ({ shape, size = 60 }) => {
    if (!shape) return null;

    const renderShape = (s, sz) => {
        const center = sz / 2;
        const color = s.color || '#3B82F6';
        const fill = s.fill ? color : 'transparent';
        const stroke = color;
        const sw = s.borderWidth || 2;
        const rotate = s.rotation || 0;

        const body = (() => {
            const commonProps = { fill, stroke, strokeWidth: sw, strokeDasharray: s.dashed ? "8,4" : "none" };
            switch (s.type) {
                case 'circle':
                    return <Circle cx={center} cy={center} r={sz * 0.4} {...commonProps} />;
                case 'square':
                    const rSize = sz * 0.7;
                    return <Rect x={center - rSize / 2} y={center - rSize / 2} width={rSize} height={rSize} {...commonProps} />;
                case 'triangle':
                    const tSide = sz * 0.8;
                    const h = (Math.sqrt(3) / 2) * tSide;
                    const pts = `${center},${center - h/2} ${center - tSide/2},${center + h/2} ${center + tSide/2},${center + h/2}`;
                    return <Polygon points={pts} {...commonProps} />;
                case 'hexagon':
                    const hexR = sz * 0.45;
                    const hPts = Array.from({length: 6}).map((_, i) => {
                        const angle = (i * 60) * (Math.PI / 180);
                        return `${center + hexR * Math.cos(angle)},${center + hexR * Math.sin(angle)}`;
                    }).join(' ');
                    return <Polygon points={hPts} {...commonProps} />;
                case 'star':
                    const outerR = sz * 0.45;
                    const innerR = sz * 0.2;
                    const sPts = Array.from({length: 10}).map((_, i) => {
                        const r = i % 2 === 0 ? outerR : innerR;
                        const angle = (i * 36 - 90) * (Math.PI / 180);
                        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    }).join(' ');
                    return <Polygon points={sPts} {...commonProps} />;
                default:
                    return null;
            }
        })();

        return (
            <G transform={`rotate(${rotate}, ${center}, ${center})`}>
                {body}
                {s.inner && (
                    <G transform={`translate(${sz * 0.25}, ${sz * 0.25})`}>
                        {renderShape(s.inner, sz * 0.5)}
                    </G>
                )}
            </G>
        );
    };

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg height={size} width={size}>
                {renderShape(shape, size)}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});
