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
        const isAcuteA1 = data.a1 < 90;
        
        let lineEndX;
        let pA1, pX, textA1, textX;

        if (isAcuteA1) {
            // Leans Left. Left is acute, Right is obtuse
            lineEndX = 70;
            pA1 = "M 105 120 A 25 25 0 0 1 114 102";
            textA1 = { x: 105, y: 110 };

            pX = "M 145 120 A 25 25 0 0 0 114 102";
            textX = { x: 140, y: 105 };
        } else {
            // Leans Right. Left is obtuse, Right is acute
            lineEndX = 180;
            pA1 = "M 105 120 A 25 25 0 0 1 136 102";
            textA1 = { x: 110, y: 105 };

            pX = "M 145 120 A 20 20 0 0 0 136 102";
            textX = { x: 145, y: 110 };
        }

        return (
            <Svg height="150" width="250" viewBox="0 0 250 150">
                <Line x1="10" y1="120" x2="240" y2="120" stroke={Colors.primary} strokeWidth="3" />
                <Line x1="125" y1="120" x2={lineEndX} y2="30" stroke={Colors.primary} strokeWidth="3" />
                
                <Path d={pA1} fill="none" stroke={Colors.orange} strokeWidth="2" />
                <Path d={pX} fill="none" stroke={Colors.purple} strokeWidth="2" />
                
                <SvgText x={textA1.x} y={textA1.y} fontSize="14" fill={Colors.text} textAnchor="middle">{data.a1}°</SvgText>
                <SvgText x={textX.x} y={textX.y} fontSize="14" fill={Colors.text} textAnchor="middle">x°</SvgText>
            </Svg>
        );
    };

    const renderTriangleAngles = () => {
        return (
            <Svg height="160" width="200" viewBox="0 0 200 160">
                <Polygon points="30,130 170,130 100,30" fill="transparent" stroke={Colors.primary} strokeWidth="3" />
                
                {/* Arcs aligned correctly to triangle edges */}
                {/* Bottom Left: Vertex is 30,130. Slope 10/7. */}
                <Path d="M 50 130 A 20 20 0 0 0 42 113" fill="none" stroke={Colors.orange} strokeWidth="2" />
                
                {/* Bottom Right: Vertex is 170,130. Slope -10/7. */}
                <Path d="M 150 130 A 20 20 0 0 1 158 113" fill="none" stroke={Colors.orange} strokeWidth="2" />
                
                {/* Top: Vertex is 100,30. */}
                <Path d="M 86 50 A 20 20 0 0 0 114 50" fill="none" stroke={Colors.orange} strokeWidth="2" />

                <SvgText x="55" y="125" fontSize="14" fill={Colors.text} textAnchor="start">{data.a1}°</SvgText>
                <SvgText x="145" y="125" fontSize="14" fill={Colors.text} textAnchor="end">{data.a2}°</SvgText>
                <SvgText x="100" y="65" fontSize="14" fill={Colors.text} textAnchor="middle">x°</SvgText>
            </Svg>
        );
    };

    const renderCuboid = () => {
        return (
            <Svg height="160" width="260" viewBox="-30 0 250 160">
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
                <SvgText x="20" y="100" fontSize="14" fill={Colors.text} textAnchor="end">{data.h}{data.unit}</SvgText>
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
