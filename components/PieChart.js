
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';

export const PieChart = ({ data, size = 100, onPress }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let startAngle = 0;

    if (total === 0) {
        return (
            <Svg height={size} width={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="#eee" />
            </Svg>
        );
    }

    const slices = data.map((item, index) => {
        const angle = (item.value / total) * 360;
        const endAngle = startAngle + angle;

        // Convert angle to coordinates
        const x1 = size / 2 + size / 2 * Math.cos(Math.PI * startAngle / 180);
        const y1 = size / 2 + size / 2 * Math.sin(Math.PI * startAngle / 180);
        const x2 = size / 2 + size / 2 * Math.cos(Math.PI * endAngle / 180);
        const y2 = size / 2 + size / 2 * Math.sin(Math.PI * endAngle / 180);

        const largeArcFlag = angle > 180 ? 1 : 0;

        const pathData = [
            `M ${size / 2} ${size / 2}`,
            `L ${x1} ${y1}`,
            `A ${size / 2} ${size / 2} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `Z`
        ].join(' ');

        startAngle = endAngle;

        return (
            <Path
                key={index}
                d={pathData}
                fill={item.color}
                onPress={onPress}
            />
        );
    });

    return (
        <TouchableOpacity onPress={onPress}>
            <Svg height={size} width={size}>
                {slices}
            </Svg>
        </TouchableOpacity>
    );
};
