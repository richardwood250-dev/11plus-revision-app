import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, Polygon, Circle, Path } from 'react-native-svg';
import { Colors } from '../constants/Colors';

export const GeometryVisualizer = ({ data }) => {
    if (!data) return null;

    const renderRectangle = () => {
        return (
            <Svg height="150" width="200" viewBox="0 0 200 150">
                <Rect x="30" y="30" width="140" height="90" fill="transparent" stroke={Colors.primary} strokeWidth="3" />
                {/* Width label */}
                <SvgText x="100" y="20" fontSize="16" fill={Colors.text} textAnchor="middle">
                    {data.w} {data.unit}
                </SvgText>
                {/* Height label */}
                <SvgText x="15" y="80" fontSize="16" fill={Colors.text} textAnchor="middle" transform="rotate(-90 15 80)">
                    {data.h} {data.unit}
                </SvgText>
            </Svg>
        );
    };

    const renderSquare = () => {
        return (
            <Svg height="150" width="150" viewBox="0 0 150 150">
                <Rect x="25" y="25" width="100" height="100" fill="transparent" stroke={Colors.primary} strokeWidth="3" />
                <SvgText x="75" y="15" fontSize="16" fill={Colors.text} textAnchor="middle">
                    {data.side} {data.unit}
                </SvgText>
            </Svg>
        );
    };

    const renderStraightLine = () => {
        return (
            <Svg height="150" width="250" viewBox="0 0 250 150">
                {/* Base straight line */}
                <Line x1="10" y1="120" x2="240" y2="120" stroke={Colors.primary} strokeWidth="3" />
                {/* Intersecting line */}
                <Line x1="125" y1="120" x2="180" y2="30" stroke={Colors.primary} strokeWidth="3" />
                
                {/* Angle arcs */}
                <Path d="M 105 120 A 20 20 0 0 1 135 105" fill="none" stroke={Colors.orange} strokeWidth="2" />
                <Path d="M 145 120 A 30 30 0 0 0 160 85" fill="none" stroke={Colors.purple} strokeWidth="2" />
                
                {/* Angle labels */}
                <SvgText x="115" y="110" fontSize="14" fill={Colors.text} textAnchor="middle">{data.a1}°</SvgText>
                <SvgText x="165" y="105" fontSize="14" fill={Colors.text} textAnchor="middle">x°</SvgText>
            </Svg>
        );
    };

    const renderTriangleAngles = () => {
        return (
            <Svg height="160" width="200" viewBox="0 0 200 160">
                <Polygon points="30,130 170,130 100,30" fill="transparent" stroke={Colors.primary} strokeWidth="3" />
                
                {/* Arcs (Approximate points) */}
                <Path d="M 45 130 A 15 15 0 0 0 50 115" fill="none" stroke={Colors.orange} strokeWidth="2" />
                <Path d="M 155 130 A 15 15 0 0 1 150 115" fill="none" stroke={Colors.orange} strokeWidth="2" />
                <Path d="M 90 45 A 15 15 0 0 1 110 45" fill="none" stroke={Colors.orange} strokeWidth="2" />

                <SvgText x="55" y="125" fontSize="14" fill={Colors.text} textAnchor="start">{data.a1}°</SvgText>
                <SvgText x="145" y="125" fontSize="14" fill={Colors.text} textAnchor="end">{data.a2}°</SvgText>
                <SvgText x="100" y="60" fontSize="14" fill={Colors.text} textAnchor="middle">x°</SvgText>
            </Svg>
        );
    };

    const renderCuboid = () => {
        return (
            <Svg height="160" width="220" viewBox="0 0 220 160">
                {/* Back face */}
                <Polygon points="60,40 180,40 180,100 60,100" fill="transparent" stroke="#A7F3D0" strokeWidth="2" strokeDasharray="5,5" />
                {/* Front face */}
                <Polygon points="30,70 150,70 150,130 30,130" fill="transparent" stroke={Colors.primary} strokeWidth="3" />
                {/* Connecting lines */}
                <Line x1="30" y1="70" x2="60" y2="40" stroke={Colors.primary} strokeWidth="3" />
                <Line x1="150" y1="70" x2="180" y2="40" stroke={Colors.primary} strokeWidth="3" />
                <Line x1="150" y1="130" x2="180" y2="100" stroke={Colors.primary} strokeWidth="3" />
                <Line x1="30" y1="130" x2="60" y2="100" stroke="#A7F3D0" strokeWidth="2" strokeDasharray="5,5" />

                {/* Labels */}
                <SvgText x="90" y="145" fontSize="14" fill={Colors.text} textAnchor="middle">{data.w}{data.unit}</SvgText>
                <SvgText x="165" y="125" fontSize="14" fill={Colors.text} textAnchor="start">{data.d}{data.unit}</SvgText>
                <SvgText x="15" y="100" fontSize="14" fill={Colors.text} textAnchor="end">{data.h}{data.unit}</SvgText>
            </Svg>
        );
    };

    switch (data.type) {
        case 'rectangle': return renderRectangle();
        case 'square': return renderSquare();
        case 'straight_line': return renderStraightLine();
        case 'triangle_angles': return renderTriangleAngles();
        case 'cuboid': return renderCuboid();
        default: return null;
    }
};
