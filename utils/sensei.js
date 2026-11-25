import { Platform } from 'react-native';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase-config';

const explanationCache = new Map();

const getEndpoint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
        return '/api/explain';
    }
    return 'https://11plusninja.com/api/explain';
};

// Deterministic FNV-1a 32-bit hash for Firestore document IDs
const hashCacheKey = (str) => {
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `sensei_${(hash >>> 0).toString(36)}`;
};

/**
 * Request an age-appropriate 11+ hint or worked explanation from Sensei (/api/explain).
 */
export const askSensei = async ({
    subject,
    topic,
    question,
    options = [],
    userAnswer = '',
    correctAnswer = '',
    passageText = '',
    imageUrl = '',
    mode = 'explain',
    fallbackReasoning = '',
}) => {
    const cacheKey = `${mode}::${subject}::${topic}::${question}::${imageUrl}::${userAnswer}::${correctAnswer}`;
    if (explanationCache.has(cacheKey)) {
        return { ok: true, text: explanationCache.get(cacheKey), cached: true };
    }

    const docId = hashCacheKey(cacheKey);

    // 1. Check shared Firestore cache first so each question is only generated once
    try {
        const snap = await getDoc(doc(db, 'sensei_cache', docId));
        if (snap.exists() && snap.data()?.explanation) {
            const cachedText = snap.data().explanation;
            explanationCache.set(cacheKey, cachedText);
            return { ok: true, text: cachedText, cached: true };
        }
    } catch {
        // Ignore Firestore read errors (offline or rules) and fall back to API
    }

    try {
        const res = await fetch(getEndpoint(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                subject,
                topic,
                question,
                options,
                userAnswer,
                correctAnswer,
                passageText,
                imageUrl,
                mode,
            }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            if (fallbackReasoning) {
                return { ok: true, text: fallbackReasoning, fallback: true };
            }
            if (data.code === 'MISSING_API_KEY') {
                return {
                    ok: false,
                    text: 'Sensei AI explanations require GEMINI_API_KEY to be set in your environment variables.',
                };
            }
            return { ok: false, text: data.error || 'Sensei is taking a quick breather. Try again!' };
        }

        const text = data.explanation || fallbackReasoning || 'No explanation available.';
        explanationCache.set(cacheKey, text);

        // Save to shared Firestore cache (best-effort)
        if (data.explanation) {
            try {
                await setDoc(doc(db, 'sensei_cache', docId), {
                    explanation: text,
                    subject: subject || '',
                    topic: topic || '',
                    mode,
                    updatedAt: new Date().toISOString(),
                }, { merge: true });
            } catch {
                // Non-blocking if Firestore write is unavailable
            }
        }

        return { ok: true, text };
    } catch (err) {
        if (fallbackReasoning) {
            return { ok: true, text: fallbackReasoning, fallback: true };
        }
        return { ok: false, text: 'Could not reach Sensei right now. Check your connection and try again.' };
    }
};
