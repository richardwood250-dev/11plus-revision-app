export const checkRecords = (currentSession, stats) => {
    if (!stats) return null;
    const { history, records, dailyStats, streak } = stats;

    // --- 1. NEW RECORDS CHECK (Ninja Themed) ---
    // Pass current session metrics
    // currentSession: { correct, total, time, topic, subject }

    const isRecord = (val, record) => val >= record && val > 0;

    // A. Best Streak
    if (streak > 0 && streak >= (records?.bestStreak || 0) && streak > 1) {
        // Only celebrate if it's actually rising or a high tie? 
        // Actually saveSession updates bestStreak automatically. 
        // So if streak === records.bestStreak, it is the best.
        // Let's only celebrate continuously if they are ON a best run.
        return {
            type: 'streak',
            value: streak,
            message: `🔥 SHADOW STREAK! You've matched your all-time best of ${streak} days! Stealthy consistency!`
        };
    }

    // B. Daily Quizzes Record
    if (dailyStats && records?.mostQuizzesInDay > 1) {
        if (dailyStats.quizzes >= records.mostQuizzesInDay) {
            return {
                type: 'daily_volume',
                value: dailyStats.quizzes,
                message: `🌪️ LIGHTNING PACE! You've completed ${dailyStats.quizzes} quizzes today! A new daily record!`
            };
        }
    }

    // C. Daily Time Record
    if (dailyStats && records?.mostTimeInDay > 300) { // Min 5 mins to count
        if (dailyStats.time >= records.mostTimeInDay) {
            const mins = Math.floor(dailyStats.time / 60);
            return {
                type: 'daily_time',
                value: mins + 'm',
                message: `🧘 ENDURANCE OF A SENSEI! ${mins} minutes training today! That's your best yet!`
            };
        }
    }

    // D. Topic Accuracy Record
    if (currentSession.topic && records?.topicAccuracy) {
        const acc = Math.round((currentSession.correct / currentSession.total) * 100);
        const recordAcc = records.topicAccuracy[currentSession.topic] || 0;

        // If we just set it in storage, recordAcc will equal acc.
        // We want to celebrate if it's a High Score (e.g. 100% or beat previous).
        // It's hard to know "previous" here without query. 
        // Simple heuristic: If it's 100%, celebrate. If it's > 80% and equals record, celebrate.
        if (acc === 100) {
            return {
                type: 'topic_mastery',
                value: '100%',
                message: `⚔️ FLAWLESS VICTORY! You mastered ${currentSession.topic} with 100% accuracy!`
            };
        }
        if (acc >= recordAcc && recordAcc >= 80 && currentSession.total >= 5) {
            return {
                type: 'topic_best',
                value: acc + '%',
                message: `🥋 SKILL UP! Your best score yet in ${currentSession.topic} (${acc}%)!`
            };
        }
    }


    // --- 2. FALLBACK: MONTHLY RANKING (Legacy but Ninja-fied) ---
    if (!history || history.length < 5) return null;

    // Filter to last 30 days
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const recentHistory = history.filter(h => new Date(h.date) >= thirtyDaysAgo);

    if (recentHistory.length === 0) return null;

    // Check Accuracy Rank
    const currentAcc = Math.round((currentSession.correct / currentSession.total) * 100);
    // Note: recentHistory ALREADY includes the current session because we fetched stats AFTER saving.
    // So we just find the rank of currentSession in recentHistory.

    // Actually, saveSession adds to history unshift. So current IS in history[0].

    const sortedByAccuracy = [...recentHistory].sort((a, b) => b.accuracy - a.accuracy);
    const rankAcc = sortedByAccuracy.findIndex(h => h === recentHistory[0]) + 1; // Find self

    if (rankAcc <= 3 && currentAcc > 60) {
        const medal = rankAcc === 1 ? '🥇 Gold' : rankAcc === 2 ? '🥈 Silver' : '🥉 Bronze';
        return {
            type: 'accuracy_rank',
            rank: rankAcc,
            value: currentAcc + '%',
            message: `${medal} Shuriken! That's your ${rankAcc === 1 ? 'best' : rankAcc === 2 ? '2nd best' : '3rd best'} score this month!`
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
    if (percentage >= 80) return "Excellent work! keep it up! 🚀";
    if (percentage >= 60) return "Good job! You're getting there! 👍";
    if (percentage >= 40) return "Nice try! Keep practicing! 💪";
    return "Don't give up! Practice makes perfect! 📚";
};
