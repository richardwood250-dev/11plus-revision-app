export const checkRecords = (currentSession, stats) => {
    if (!stats) return null;
    const { dailyStats, streak, records } = stats;

    // --- 1. STREAK CELEBRATIONS (First quiz of the day) ---
    if (dailyStats && dailyStats.quizzes === 1) {
        if (streak > 1) {
            if (streak === (records?.bestStreak || 0)) {
                return {
                    type: 'streak_best',
                    value: streak,
                    message: `🔥 ALL-TIME BEST! You've matched your best ever ${streak} day streak! Unstoppable consistency!`
                };
            } else {
                return {
                    type: 'streak_extended',
                    value: streak,
                    message: `🔥 STREAK EXTENDED! Fantastic effort. You're on a ${streak} day roll! Keep it up, ninja!`
                };
            }
        } else if (streak === 1) {
            return {
                type: 'streak_start',
                value: streak,
                message: `🌱 FIRST STEP! You've started a 1 day streak! Come back tomorrow to keep it growing!`
            };
        }
    }

    // --- 2. DAILY MILESTONES ---
    if (dailyStats) {
        // Celebrate every 5th quiz in a day
        if (dailyStats.quizzes > 0 && dailyStats.quizzes % 5 === 0) {
            return {
                type: 'daily_volume',
                value: dailyStats.quizzes,
                message: `🌪️ LIGHTNING PACE! You've completed ${dailyStats.quizzes} quizzes today! Incredible dedication to your training!`
            };
        }
    }

    // --- 3. TOPIC MASTERY ---
    if (currentSession && currentSession.topic && currentSession.total > 0) {
        const acc = Math.round((currentSession.correct / currentSession.total) * 100);

        if (acc === 100) {
            // 50% chance to show a flawless message (so it doesn't get annoying if they get 100% often)
            if (Math.random() > 0.5 && currentSession.total >= 3) {
                return {
                    type: 'topic_mastery',
                    value: '100%',
                    message: `⚔️ FLAWLESS VICTORY! You mastered ${currentSession.topic} with 100% accuracy!`
                };
            }
        } else if (acc >= 80 && currentSession.total >= 5) {
            // 30% chance to show a positive reinforcement for 80%+
            if (Math.random() > 0.7) {
                return {
                    type: 'topic_best',
                    value: acc + '%',
                    message: `🥋 SKILL UP! Absolutely fantastic score in ${currentSession.topic} (${acc}%)!`
                };
            }
        }
    }

    // --- 4. RANDOM MOTIVATION ---
    // Give a 15% chance of a motivational boost if nothing else triggered
    if (Math.random() > 0.85) {
        const BOOSTS = [
            "You are doing incredibly well. Every question helps your ninja brain grow!",
            "Every question answered is another step closer to mastery!",
            "Fantastic focus! Your hard work is paying off.",
            "Stay sharp! You're making continuous, solid progress.",
            "Great job maintaining your discipline and training."
        ];
        const boost = BOOSTS[Math.floor(Math.random() * BOOSTS.length)];
        return {
            type: 'motivation',
            value: '',
            message: `🌟 ${boost}`
        };
    }

    return null;
};

export const getGreeting = (name) => {
    const hour = new Date().getHours();
    let timeGreeting = "Good Evening";
    if (hour < 12) timeGreeting = "Good Morning";
    else if (hour < 18) timeGreeting = "Good Afternoon";

    return `${timeGreeting}, ${name}!`;
};

export const getQuizFeedback = (score, total) => {
    if (!total) return "Practice complete!";
    const percentage = (score / total) * 100;
    if (percentage === 100) return "Perfect Score! 🌟";
    if (percentage >= 80) return "Excellent work! Keep it up! 🚀";
    if (percentage >= 60) return "Good job! You're getting there! 👍";
    if (percentage >= 40) return "Nice try! Keep practicing! 💪";
    return "Don't give up! Practice makes perfect! 📚";
};
