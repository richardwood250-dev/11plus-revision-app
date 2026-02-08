
export const getProximityColor = (stats, subject) => {
    // Colors
    const GREEN = '#32CD32'; // LimeGreen
    const YELLOW = '#FFD700'; // Gold
    const ORANGE = '#FFA500'; // Orange
    const RED = '#FF4500'; // OrangeRed
    const NEUTRAL = '#FFFFFF'; // White (Default)
    const GRAY = '#dcdcdc'; // Gainsboro (No data)

    if (!stats || !stats.bySubject || !stats.bySubject[subject]) {
        // No data yet, return formatted object for "New/Neutral"
        return { borderColor: '#ccc', backgroundColor: NEUTRAL, status: 'New' };
    }

    const data = stats.bySubject[subject];
    if (data.total === 0) {
        return { borderColor: '#ccc', backgroundColor: NEUTRAL, status: 'New' };
    }

    // 1. Accuracy Score (0 = Good, 1 = Bad)
    const accuracy = data.correct / data.total; // 0.0 to 1.0
    // We want high accuracy -> Low Urgency. 
    // If acc < 50%, Urgency = 1.
    // If acc > 90%, Urgency = 0.
    let accuracyUrgency = 0;
    if (accuracy < 0.6) accuracyUrgency = 1.0;
    else if (accuracy > 0.9) accuracyUrgency = 0.0;
    else {
        // Linear between 0.6 and 0.9
        // 0.6 -> 1, 0.9 -> 0
        accuracyUrgency = 1 - ((accuracy - 0.6) / 0.3);
    }

    // 2. Recency Score (0 = Good/Recent, 1 = Bad/Old)
    let recencyUrgency = 0;
    if (data.lastPlayed) {
        const lastDate = new Date(data.lastPlayed);
        const now = new Date();
        const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);

        if (diffDays < 1) recencyUrgency = 0.0;      // Played today
        else if (diffDays < 3) recencyUrgency = 0.2; // Played recently
        else if (diffDays < 7) recencyUrgency = 0.6; // A week ago
        else recencyUrgency = 1.0;                   // > 1 week
    } else {
        // Has data but no date? Assume old.
        recencyUrgency = 1.0;
    }

    // Final Urgency: Take the WORST case.
    const urgency = Math.max(accuracyUrgency, recencyUrgency);

    // Map to Color
    let color = GREEN;
    let bgColor = '#F0FFF0'; // Honeydew (Light Green)

    if (urgency > 0.7) {
        color = RED;
        bgColor = '#FFF0F0'; // LavenderBlush (Light Red)
    } else if (urgency > 0.3) {
        color = ORANGE;
        bgColor = '#FFF8DC'; // Cornsilk (Light Yellow)
    }

    return {
        borderColor: color,
        backgroundColor: bgColor,
        urgency
    };
};
