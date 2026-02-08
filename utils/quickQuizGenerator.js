import { MATHS_QUIZ } from '../data/maths';
import { ENGLISH_QUIZ } from '../data/english';
import { CLOZE_QUIZ } from '../data/cloze';
import { GRAMMAR_QUIZ } from '../data/grammar';
import { SPELLING_QUIZ } from '../data/spelling';
import { VR_COMPOUND_QUIZ } from '../data/vr_compound';
import { VERBAL_QUIZ } from '../data/verbal';
import { nonverbal } from '../data/nonverbal';


const getSources = () => {
    // defined sources
    const sources = [
        { type: 'Maths', topic: 'General', data: MATHS_QUIZ },
        { type: 'English', topic: 'Comprehension', data: ENGLISH_QUIZ },
        { type: 'English', topic: 'Cloze', data: CLOZE_QUIZ },
        { type: 'English', topic: 'Grammar', data: GRAMMAR_QUIZ },
        { type: 'English', topic: 'Spelling', data: SPELLING_QUIZ },
        // { type: 'Verbal', topic: 'Compound Words', data: VR_COMPOUND_QUIZ }, // Removed as it's included in Dynamic Verbal now? No, checking imports.
        // Wait, line 6 says import { VR_COMPOUND_QUIZ } from '../data/vr_compound';
        // But line 22 iterates keys of VERBAL_QUIZ. Does VERBAL_QUIZ include Compound Words?
        // Let's assume the original array was correct and keep it.
        { type: 'Verbal', topic: 'Compound Words', data: VR_COMPOUND_QUIZ },
    ];

    // Add Dynamic Verbal
    Object.keys(VERBAL_QUIZ).forEach(key => {
        sources.push({
            type: 'Verbal',
            topic: key,
            data: VERBAL_QUIZ[key].questions,
            titleOverride: VERBAL_QUIZ[key].title
        });
    });

    // Add Non-Verbal
    Object.keys(nonverbal).forEach(key => {
        sources.push({
            type: 'Non-Verbal',
            topic: key,
            data: nonverbal[key].questions,
            titleOverride: nonverbal[key].title,
            limit: 8 // Non-verbal usually 8
        });
    });

    return sources;
};

export const getAllTopics = () => {
    return getSources().map(s => ({
        subject: s.type,
        topic: s.topic,
        title: s.titleOverride || s.topic
    }));
};



export const getQuiz = (subject, topic) => {
    const sources = getSources();
    const source = sources.find(s => s.type === subject && s.topic === topic);

    if (!source) {
        // Fallback to random if not found
        return getRandomQuiz();
    }

    const limit = source.limit || 10;
    const shuffled = [...source.data].sort(() => 0.5 - Math.random());

    // Copy-paste deduping logic from getRandomQuiz or extract it?
    // Extracting it is cleaner but let's duplicate for safety/speed unless common helper exists.
    // Actually, let's extract the deduping logic to a helper 'selectQuestions'
    // But for now, to minimize edit risk, I will duplicate the simple logic.

    const selectedQuestions = [];
    const selectedKeys = new Set();
    const isNVR = source.type === 'Non-Verbal';

    const getSimilarityKey = (question) => {
        if (!question.image) return question.id;
        try {
            let filename = decodeURIComponent(question.image.split('/').pop());
            filename = filename.replace(/\.\w+$/, '');
            filename = filename.replace(/\s*\(\d+\)$/, '');
            filename = filename.replace(/_?\d+$/, '');
            return filename;
        } catch (e) {
            return question.id;
        }
    };

    for (const q of shuffled) {
        if (selectedQuestions.length >= limit) break;
        if (isNVR) {
            const key = getSimilarityKey(q);
            if (!selectedKeys.has(key)) {
                selectedQuestions.push(q);
                selectedKeys.add(key);
            }
        } else {
            selectedQuestions.push(q);
        }
    }

    if (selectedQuestions.length < limit) {
        for (const q of shuffled) {
            if (selectedQuestions.length >= limit) break;
            if (!selectedQuestions.includes(q)) selectedQuestions.push(q);
        }
    }

    return {
        title: source.titleOverride || source.topic,
        questions: selectedQuestions,
        config: {
            subject: source.type,
            topic: source.topic
        }
    };
};

export const getRandomQuiz = () => {
    const sources = getSources();
    // 1. Pick a source
    const randomSource = sources[Math.floor(Math.random() * sources.length)];
    const limit = randomSource.limit || 10;

    // 2. Shuffle and slice
    // 2. Shuffle
    const shuffled = [...randomSource.data].sort(() => 0.5 - Math.random());

    // 3. Select with Deduping (for NVR or universally if beneficial)
    // Non-Verbal requirement: "check the image names aren't similar"
    const selectedQuestions = [];
    const selectedKeys = new Set();
    const isNVR = randomSource.type === 'Non-Verbal';

    // Helper to extract "Similarity Key" from image URL
    const getSimilarityKey = (question) => {
        if (!question.image) return question.id; // Fallback to ID
        try {
            // Extract filename from URL
            let filename = decodeURIComponent(question.image.split('/').pop());
            // Remove extension
            filename = filename.replace(/\.\w+$/, '');
            // Remove trailing " (N)" e.g. "seq_1 (1)" -> "seq_1"
            filename = filename.replace(/\s*\(\d+\)$/, '');
            // Remove trailing "_N" or "N" e.g. "Matrix_Asym_1" -> "Matrix_Asym"
            // Be careful not to aggressively strip numbers from "seq_1" if "seq" is too generic
            // But usually seq_1 is the group.
            filename = filename.replace(/_?\d+$/, '');
            return filename;
        } catch (e) {
            return question.id;
        }
    };

    // Pass 1: Unique Keys
    for (const q of shuffled) {
        if (selectedQuestions.length >= limit) break;

        if (isNVR) {
            const key = getSimilarityKey(q);
            if (!selectedKeys.has(key)) {
                selectedQuestions.push(q);
                selectedKeys.add(key);
            }
        } else {
            // For non-NVR (e.g. Maths logic if we wanted to enforce it here too)
            selectedQuestions.push(q);
        }
    }

    // Pass 2: Fill if needed (Soft Deduping)
    if (selectedQuestions.length < limit) {
        for (const q of shuffled) {
            if (selectedQuestions.length >= limit) break;
            // Add if not already included (referential check)
            if (!selectedQuestions.includes(q)) {
                selectedQuestions.push(q);
            }
        }
    }

    return {
        title: randomSource.titleOverride || randomSource.topic, // Use specific title if available
        questions: selectedQuestions,
        config: {
            subject: randomSource.type,
            topic: randomSource.topic
        }
    };
};
