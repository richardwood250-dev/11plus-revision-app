import { getRandomQuiz, getAllTopics } from './quickQuizGenerator';

export const getRecommendation = (stats) => {
    // 0. Initial check
    if (!stats || !stats.bySubject) {
        return {
            title: "Quick Start",
            reason: "Get started with a random mix!",
            action: () => getRandomQuiz()
        };
    }

    const allTopics = getAllTopics();
    const candidateTopics = [];

    // 1. Gather stats for all topics
    allTopics.forEach(t => {
        const key = t.topic;
        const subj = stats.bySubject[t.subject];
        let total = 0;
        let accuracy = 100; // Assume good if unknown
        let lastPlayed = 0; // Epoch

        if (subj && subj.topics && subj.topics[key]) {
            const topicData = subj.topics[key];
            total = topicData.total;
            // Use recentScores if available for better accuracy metric
            if (topicData.recentScores && topicData.recentScores.length > 0) {
                const sum = topicData.recentScores.reduce((a, b) => a + b, 0);
                accuracy = sum / topicData.recentScores.length;
            } else if (total > 0) {
                accuracy = (topicData.correct / total) * 100;
            }
        }

        // Find last played date from history to support "Stale" detection
        // We scan history (most recent first) to find the latest date
        if (stats.history) {
            const hItem = stats.history.find(h => h.subject === t.subject && h.topic === key);
            if (hItem) {
                lastPlayed = new Date(hItem.date).getTime();
            }
        }

        candidateTopics.push({
            ...t,
            total,
            accuracy,
            lastPlayed
        });
    });

    // Strategy 1: Never Played
    const neverPlayed = candidateTopics.filter(c => c.total === 0);
    if (neverPlayed.length > 0) {
        const pick = neverPlayed[Math.floor(Math.random() * neverPlayed.length)];
        return {
            title: `Try ${pick.title}`,
            reason: "You haven't tried this topic yet!",
            config: { subject: pick.subject, topic: pick.topic }
        };
    }

    // Strategy 2: Low Accuracy (< 50%)
    const lowAcc = candidateTopics.filter(c => c.accuracy < 50);
    if (lowAcc.length > 0) {
        // Sort by lowest accuracy
        lowAcc.sort((a, b) => a.accuracy - b.accuracy);
        // Pick the absolute worst
        const pick = lowAcc[0];
        return {
            title: `Practice ${pick.title}`,
            reason: `Score: ${Math.round(pick.accuracy)}%. Let's improve this!`,
            config: { subject: pick.subject, topic: pick.topic }
        };
    }

    // Strategy 3: Stale (Not played in last 3 days)
    // 3 days = 3 * 24 * 60 * 60 * 1000
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    const stale = candidateTopics.filter(c => (now - c.lastPlayed) > threeDays);

    // Sort by oldest lastPlayed (ascending time)
    stale.sort((a, b) => a.lastPlayed - b.lastPlayed);

    if (stale.length > 0) {
        const pick = stale[0]; // Oldest
        return {
            title: `Revise ${pick.title}`,
            reason: "It's been a while since you played this.",
            config: { subject: pick.subject, topic: pick.topic }
        };
    }

    // Fallback: Random
    return {
        title: "Quick Start",
        reason: "You're doing great! Keep it up.",
        action: () => getRandomQuiz()
    };
};
