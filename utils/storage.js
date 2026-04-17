import AsyncStorage from '@react-native-async-storage/async-storage';
import { db, auth } from '../firebase-config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { 
    signInAnonymously, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    linkWithCredential,
    EmailAuthProvider,
    signOut
} from 'firebase/auth';

const STATS_KEY = 'QUIZ_STATS_V1';

// --- CLOUD SYNC HELPERS ---
const _getDocRef = (profileId = null) => {
    const user = auth.currentUser;
    if (!user) return null;
    const docId = profileId ? `${user.uid}_${profileId}` : user.uid;
    return doc(db, "users", docId);
};

// Sync data to cloud
const _syncToCloud = async (key, data, profileId = null) => {
    try {
        const user = auth.currentUser;
        if (!user || user.isAnonymous && key !== 'stats') return; // Only sync stats for anon users

        const docId = profileId ? `${user.uid}_${profileId}` : user.uid;
        const ref = doc(db, "users", docId);
        
        await setDoc(ref, { [key]: data }, { merge: true });
    } catch (e) {
        console.log(`Cloud sync failed for ${key}:`, e);
    }
};

export const saveSession = async (subject, results, timeInSeconds, topic = 'General') => {
    try {
        const activeProfileId = await getActiveProfileId();
        const CURRENT_STATS_KEY = activeProfileId ? `${STATS_KEY}_${activeProfileId}` : STATS_KEY;

        const existing = await AsyncStorage.getItem(CURRENT_STATS_KEY);
        const stats = existing ? JSON.parse(existing) : {
            totalQuestions: 0,
            totalCorrect: 0,
            totalTime: 0,
            byDifficulty: {
                easy: { correct: 0, total: 0 },
                medium: { correct: 0, total: 0 },
                hard: { correct: 0, total: 0 }
            },
            bySubject: {},
            streak: 0,
            lastPracticeDate: null,
            // New Records Tracking
            records: {
                mostQuizzesInDay: 0,
                mostTimeInDay: 0,
                bestStreak: 0,
                topicAccuracy: {} // { 'Algebra': 85 }
            },
            dailyStats: {
                date: new Date().toISOString().split('T')[0],
                quizzes: 0,
                time: 0
            }
        };

        // Calculate totals from results
        const sessionTotal = results.length;
        const sessionCorrect = results.filter(r => r.isCorrect).length;
        const sessionAcc = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;

        // Update Global
        stats.totalQuestions += sessionTotal;
        stats.totalCorrect += sessionCorrect;
        stats.totalTime += timeInSeconds;

        // --- STREAK & DAILY LOGIC ---
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const lastDate = stats.lastPracticeDate;

        // Init dailyStats if missing (legacy support)
        if (!stats.dailyStats) {
            stats.dailyStats = { date: today, quizzes: 0, time: 0 };
        }

        // Check if new day for Daily Stats
        if (stats.dailyStats.date !== today) {
            stats.dailyStats = { date: today, quizzes: 0, time: 0 };
        }

        // Update Daily Stats
        stats.dailyStats.quizzes += 1;
        stats.dailyStats.time += timeInSeconds;

        // Update Streak
        if (lastDate !== today) {
            if (lastDate) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                if (lastDate === yesterdayStr) {
                    stats.streak += 1;
                } else {
                    stats.streak = 1;
                }
            } else {
                stats.streak = 1;
            }
            stats.lastPracticeDate = today;
        }

        // --- RECORDS UPDATE ---
        if (!stats.records) {
            stats.records = {
                mostQuizzesInDay: 0,
                mostTimeInDay: 0,
                bestStreak: 0,
                topicAccuracy: {}
            };
        }

        // 1. Most Quizzes in Day
        if (stats.dailyStats.quizzes > stats.records.mostQuizzesInDay) {
            stats.records.mostQuizzesInDay = stats.dailyStats.quizzes;
        }

        // 2. Most Time in Day
        if (stats.dailyStats.time > stats.records.mostTimeInDay) {
            stats.records.mostTimeInDay = stats.dailyStats.time;
        }

        // 3. Best Streak
        if (stats.streak > stats.records.bestStreak) {
            stats.records.bestStreak = stats.streak;
        }

        // 4. Topic Accuracy (Only update if better AND significant attempt e.g. > 5 questions)
        // Or just blindly update if better? Let's say sessionTotal >= 5 to count as a "record"
        if (sessionTotal >= 1) {
            const currentRecord = stats.records.topicAccuracy[topic] || 0;
            if (sessionAcc > currentRecord) {
                stats.records.topicAccuracy[topic] = sessionAcc;
            }
        }

        // Update Difficulty (Overlapping Ranges)
        results.forEach(r => {
            const d = r.difficultyIndex;
            const isCorrect = r.isCorrect ? 1 : 0;

            if (d <= 25) {
                stats.byDifficulty.easy.total += 1;
                stats.byDifficulty.easy.correct += isCorrect;
            }
            if (d >= 13 && d <= 38) {
                stats.byDifficulty.medium.total += 1;
                stats.byDifficulty.medium.correct += isCorrect;
            }
            if (d >= 26) {
                stats.byDifficulty.hard.total += 1;
                stats.byDifficulty.hard.correct += isCorrect;
            }
        });

        // Update Subject & Topic
        if (!stats.bySubject[subject]) {
            stats.bySubject[subject] = {
                time: 0,
                sessions: 0,
                total: 0,
                correct: 0,
                topics: {}
            };
        }

        const subj = stats.bySubject[subject];
        subj.time += timeInSeconds;
        subj.sessions += 1;
        subj.total += sessionTotal;
        subj.correct += sessionCorrect;
        subj.lastPlayed = new Date().toISOString();

        // Update Topic
        if (!subj.topics[topic]) {
            subj.topics[topic] = { total: 0, correct: 0, time: 0, recentScores: [] };
        }
        subj.topics[topic].total += sessionTotal;
        subj.topics[topic].correct += sessionCorrect;
        subj.topics[topic].time += timeInSeconds;

        // Update Rolling Average (Recent Scores)
        if (!subj.topics[topic].recentScores) subj.topics[topic].recentScores = [];
        subj.topics[topic].recentScores.push(sessionAcc);
        if (subj.topics[topic].recentScores.length > 5) {
            subj.topics[topic].recentScores.shift(); // Keep last 5
        }

        // --- RECORD HISTORY ---
        if (!stats.history) stats.history = [];
        stats.history.unshift({
            date: new Date().toISOString(),
            subject: subject,
            topic: topic,
            score: sessionCorrect,
            total: sessionTotal,
            accuracy: sessionAcc,
            time: timeInSeconds
        });
        // Keep last 50
        if (stats.history.length > 50) stats.history = stats.history.slice(0, 50);

        // 1. Save Local
        await AsyncStorage.setItem(CURRENT_STATS_KEY, JSON.stringify(stats));

        // 2. Sync to Cloud
        await _syncToCloud('stats', stats, activeProfileId);

        return stats;
    } catch (e) {
        console.error("Failed to save stats", e);
        return null;
    }
};

const _ensureRecentScores = (stats) => {
    // Self-healing: If recentScores are missing, rebuild them from history
    if (!stats || !stats.bySubject) return stats;
    let modified = false;

    // Check if any topic is missing recentScores
    Object.keys(stats.bySubject).forEach(subjKey => {
        const subj = stats.bySubject[subjKey];
        if (subj.topics) {
            Object.keys(subj.topics).forEach(topicKey => {
                if (!subj.topics[topicKey].recentScores) {
                    // Found a missing one, let's rebuild ALL from history to be safe/consistent
                    if (!modified) modified = true;
                }
            });
        }
    });

    if (modified && stats.history) {
        // Rebuild logic
        // 1. Reset all recentScores
        Object.keys(stats.bySubject).forEach(subjKey => {
            const subj = stats.bySubject[subjKey];
            if (subj.topics) {
                Object.keys(subj.topics).forEach(topicKey => {
                    subj.topics[topicKey].recentScores = [];
                });
            }
        });

        // 2. Replay history (Oldest to Newest)
        // stats.history is Newest First, so reverse it
        const chronological = [...stats.history].reverse();
        chronological.forEach(h => {
            const subj = stats.bySubject[h.subject];
            if (subj && subj.topics && subj.topics[h.topic]) {
                const t = subj.topics[h.topic];
                if (!t.recentScores) t.recentScores = [];

                // Calculate acc from history item if not present
                const acc = h.accuracy !== undefined ? h.accuracy : (h.total > 0 ? Math.round((h.score / h.total) * 100) : 0);

                t.recentScores.push(acc);
                if (t.recentScores.length > 5) t.recentScores.shift();
            }
        });

        // We modified the object in memory, we should probably persist it too so we don't recalculate every time
        // But getStats is read-only usually. Let's just return the corrected object. 
        // Calling save here might be recursive or slow.
        // Let's fire-and-forget a save? Or just wait for next save.
        // Better: just return corrected stats. Next saveSession will save it.
    }
    return stats;
};

export const getStats = async () => {
    try {
        let stats = null;
        const activeProfileId = await getActiveProfileId();
        const CURRENT_STATS_KEY = activeProfileId ? `${STATS_KEY}_${activeProfileId}` : STATS_KEY;

        // 1. Attempt Cloud Fetch (if online & auth)
        const user = auth.currentUser;
        if (user) {
            try {
                const docId = activeProfileId ? `${user.uid}_${activeProfileId}` : user.uid;
                const ref = doc(db, "users", docId);
                const docSnap = await getDoc(ref);
                if (docSnap.exists()) {
                    const cloudData = docSnap.data();
                    if (cloudData.stats) {
                        stats = cloudData.stats;
                        await AsyncStorage.setItem(CURRENT_STATS_KEY, JSON.stringify(stats));
                    }
                }
            } catch (cloudErr) {
                console.log("Cloud fetch failed, using local");
            }
        }

        // 2. Fallback to Local if Cloud didn't yield
        if (!stats) {
            const json = await AsyncStorage.getItem(CURRENT_STATS_KEY);
            stats = json ? JSON.parse(json) : null;
        }

        return _ensureRecentScores(stats);
    } catch (e) {
        return null;
    }
};

export const getStreak = async () => {
    const stats = await getStats();
    return stats ? stats.streak : 0;
};

export const clearStats = async () => {
    const activeProfileId = await getActiveProfileId();
    const CURRENT_STATS_KEY = activeProfileId ? `${STATS_KEY}_${activeProfileId}` : STATS_KEY;

    await AsyncStorage.removeItem(CURRENT_STATS_KEY);
    
    // Clear cloud too
    const user = auth.currentUser;
    if (user) {
        const docId = activeProfileId ? `${user.uid}_${activeProfileId}` : user.uid;
        const ref = doc(db, "users", docId);
        // We can't easily delete the doc without more cleanup, but we can set it to empty/null or overwrite.
        // Let's just overwrite with empty stats structure if we wanted to be thorough, but
        // for "clearStats" usually just local is standard unless explicitly "Delete Account".
        // Let's keep it safe: if we clear local, we disconnect from that history.
        // If they sign in again, they might re-download it?
        // Yes, getStats would re-download!
        // So we MUST clear cloud if we want the reset to 'stick'.
        try {
            await setDoc(ref, {}, { merge: false }); // Wipe it
        } catch (e) { console.log("Failed to clear cloud stats", e); }
    }
};

// --- Profile Storage ---
const PROFILE_KEY = 'USER_PROFILE_V1'; // Legacy single user key
const PROFILES_ALL_KEY = 'USER_PROFILES_ALL_V1';
const ACTIVE_PROFILE_KEY = 'ACTIVE_PROFILE_ID_V1';

export const saveProfile = async (name, testDate, icon = '🤖') => {
    try {
        const id = Date.now().toString();
        const newProfile = { id, name, testDate, icon, joined: new Date().toISOString() };

        let profiles = [];

        // Check for legacy profile and migrate
        const legacyJson = await AsyncStorage.getItem(PROFILE_KEY);
        if (legacyJson) {
            const legacyProfile = JSON.parse(legacyJson);
            // Only migrate if we don't already have an ALL array
            const allJson = await AsyncStorage.getItem(PROFILES_ALL_KEY);
            if (!allJson) {
                // Assign an ID to legacy profile (usually 1st user)
                legacyProfile.id = 'legacy_user_1';
                if (!legacyProfile.icon) legacyProfile.icon = '🤖'; // Legacy fallback
                profiles.push(legacyProfile);

                // If this is the first ever create after migration, ensure current stats 
                // belong to legacy_user_1 by leaving them on the root key.
            }
        }

        const allJson = await AsyncStorage.getItem(PROFILES_ALL_KEY);
        if (allJson) {
            profiles = JSON.parse(allJson);
        }

        profiles.push(newProfile);

        await AsyncStorage.setItem(PROFILES_ALL_KEY, JSON.stringify(profiles));
        await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);

        // Sync profiles to cloud if logged in
        if (auth.currentUser && !auth.currentUser.isAnonymous) {
            await _syncToCloud('profiles', profiles);
        }

        return newProfile;
    } catch (e) {
        return null;
    }
};

export const getProfiles = async () => {
    try {
        // Migration check
        const allJson = await AsyncStorage.getItem(PROFILES_ALL_KEY);
        if (allJson) {
            let loadedProfiles = JSON.parse(allJson);
            // Ensure backwards compatibility with missing icons
            loadedProfiles = loadedProfiles.map(p => ({ ...p, icon: p.icon || '🤖' }));
            return loadedProfiles;
        }

        // Fallback to legacy
        const legacyJson = await AsyncStorage.getItem(PROFILE_KEY);
        if (legacyJson) {
            const legacyProfile = JSON.parse(legacyJson);
            legacyProfile.id = 'legacy_user_1';
            if (!legacyProfile.icon) legacyProfile.icon = '🤖';

            // Auto-migrate
            await AsyncStorage.setItem(PROFILES_ALL_KEY, JSON.stringify([legacyProfile]));
            await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, 'legacy_user_1');
            return [legacyProfile];
        }

        return [];
    } catch (e) {
        return [];
    }
};

export const switchProfile = async (id) => {
    try {
        await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, id);
        return true;
    } catch (e) {
        return false;
    }
};

export const getActiveProfileId = async () => {
    try {
        const id = await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
        if (id) return id;

        // If no active ID, check if we have legacy user
        const legacyJson = await AsyncStorage.getItem(PROFILE_KEY);
        if (legacyJson) {
            return 'legacy_user_1'; // Our assumed ID for migrated user
        }

        return null;
    } catch (e) {
        return null;
    }
};

export const getProfile = async () => {
    try {
        const activeId = await getActiveProfileId();
        if (!activeId) return null;

        const profiles = await getProfiles();
        const active = profiles.find(p => p.id === activeId);

        if (active) return active;

        // Fallback robust check
        if (profiles.length > 0) {
            await switchProfile(profiles[0].id);
            return profiles[0];
        }

        return null;
    } catch (e) {
        return null;
    }
};

// --- Tutorial Storage ---
const TUTORIAL_KEY = 'TUTORIAL_SEEN_V1';

export const saveTutorialSeen = async () => {
    try {
        await AsyncStorage.setItem(TUTORIAL_KEY, 'true');
    } catch (e) {
        // ignore
    }
};

export const getTutorialSeen = async () => {
    try {
        const val = await AsyncStorage.getItem(TUTORIAL_KEY);
        return val === 'true';
    } catch (e) {
        return false;
    }
};

// --- Dojo Storage ---
const DOJO_RECORDS_KEY = 'DOJO_RECORDS_V1';

export const saveDojoRecord = async (strandId, beltId, score, maxScore, timeInSeconds) => {
    try {
        const activeProfileId = await getActiveProfileId();
        const key = activeProfileId ? `${DOJO_RECORDS_KEY}_${activeProfileId}` : DOJO_RECORDS_KEY;
        const existing = await AsyncStorage.getItem(key);
        const records = existing ? JSON.parse(existing) : {};

        const recordId = `${strandId}_${beltId}`;
        const currentBest = records[recordId];

        let isNewRecord = false;

        if (!currentBest) {
            isNewRecord = true;
            records[recordId] = { bestScore: score, bestTime: timeInSeconds, maxScore };
        } else {
            if (score > currentBest.bestScore) {
                isNewRecord = true;
                records[recordId] = { bestScore: score, bestTime: timeInSeconds, maxScore };
            } else if (score === currentBest.bestScore && timeInSeconds < currentBest.bestTime) {
                isNewRecord = true;
                records[recordId] = { bestScore: score, bestTime: timeInSeconds, maxScore };
            }
        }

        if (isNewRecord) {
            await AsyncStorage.setItem(key, JSON.stringify(records));
            
            // Sync to cloud if permanent
            if (auth.currentUser && !auth.currentUser.isAnonymous) {
                await _syncToCloud('dojoRecords', records, activeProfileId);
            }
        }

        return isNewRecord;
    } catch (e) {
        return false;
    }
};

export const getDojoRecords = async () => {
    try {
        const activeProfileId = await getActiveProfileId();
        const key = activeProfileId ? `${DOJO_RECORDS_KEY}_${activeProfileId}` : DOJO_RECORDS_KEY;
        const existing = await AsyncStorage.getItem(key);
        return existing ? JSON.parse(existing) : {};
    } catch (e) {
        return {};
    }
};

// --- Auth Helper to be called by App.js ---
export const initializeAuth = async () => {
    try {
        if (!auth.currentUser) {
            // Attempt to recover previous session implicitly by Firebase SDK
            // If none, sign in anonymously
            console.log("Auth init starting...");
        }
    } catch (e) {
        console.error("Auth init failed:", e);
    }
};

export const signUp = async (username, password) => {
    try {
        const email = `${username.toLowerCase()}@11plusninja.com`;
        const user = auth.currentUser;

        if (user && user.isAnonymous) {
            // Link anonymous account to permanent credentials
            const credential = EmailAuthProvider.credential(email, password);
            await linkWithCredential(user, credential);
        } else {
            // Create fresh account
            await createUserWithEmailAndPassword(auth, email, password);
        }

        // After signup, sync everything to cloud immediately
        await syncAllToCloud();
        return { success: true };
    } catch (e) {
        console.error("Signup failed:", e);
        return { success: false, error: e.message };
    }
};

export const logIn = async (username, password) => {
    try {
        const email = `${username.toLowerCase()}@11plusninja.com`;
        await signInWithEmailAndPassword(auth, email, password);
        
        // Download all cloud data
        await fetchAllFromCloud();
        return { success: true };
    } catch (e) {
        return { success: false, error: e.message };
    }
};

export const logout = async () => {
    await signOut(auth);
    // We stay as logged out (anon) until App.js re-inits or user logs in.
    // For now, let's just clear sensitive local storage that shouldn't persist across users
    await AsyncStorage.removeItem(PROFILES_ALL_KEY);
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
    await AsyncStorage.removeItem(STATS_KEY);
    await AsyncStorage.removeItem(DOJO_RECORDS_KEY);
};

export const syncAllToCloud = async () => {
    if (!auth.currentUser || auth.currentUser.isAnonymous) return;

    const profiles = await getProfiles();
    if (profiles.length > 0) await _syncToCloud('profiles', profiles);

    // Sync stats and records for EACH profile
    for (const p of profiles) {
        const statsKey = p.id === 'legacy_user_1' ? STATS_KEY : `${STATS_KEY}_${p.id}`;
        const dojoKey = p.id === 'legacy_user_1' ? DOJO_RECORDS_KEY : `${DOJO_RECORDS_KEY}_${p.id}`;
        
        const stats = await AsyncStorage.getItem(statsKey);
        const records = await AsyncStorage.getItem(dojoKey);

        if (stats) await _syncToCloud('stats', JSON.parse(stats), p.id);
        if (records) await _syncToCloud('dojoRecords', JSON.parse(records), p.id);
    }
};

export const fetchAllFromCloud = async () => {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            const data = snap.data();
            
            // 1. Sync Profiles
            if (data.profiles) {
                await AsyncStorage.setItem(PROFILES_ALL_KEY, JSON.stringify(data.profiles));
                if (data.profiles.length > 0) {
                    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, data.profiles[0].id);
                }
            }

            // 2. Sync Stats & Records for each profile
            // We need to fetch individual profile documents if they are stored separately,
            // but our _syncToCloud handles them as individual docs with ID uid_profileId.
            // Let's assume for now we only fetch the main user doc if we put everything there, 
            // OR we iterate.
            
            // Actually, my _syncToCloud uses `profileId ? ${user.uid}_${profileId} : user.uid`.
            // So we need to fetch those too.
            if (data.profiles) {
                for (const p of data.profiles) {
                    const pRef = doc(db, "users", `${user.uid}_${p.id}`);
                    const pSnap = await getDoc(pRef);
                    if (pSnap.exists()) {
                        const pData = pSnap.data();
                        const statsKey = p.id === 'legacy_user_1' ? STATS_KEY : `${STATS_KEY}_${p.id}`;
                        const dojoKey = p.id === 'legacy_user_1' ? DOJO_RECORDS_KEY : `${DOJO_RECORDS_KEY}_${p.id}`;

                        if (pData.stats) await AsyncStorage.setItem(statsKey, JSON.stringify(pData.stats));
                        if (pData.dojoRecords) await AsyncStorage.setItem(dojoKey, JSON.stringify(pData.dojoRecords));
                    }
                }
            }
        }
    } catch (e) {
        console.error("Fetch all failed:", e);
    }
};
