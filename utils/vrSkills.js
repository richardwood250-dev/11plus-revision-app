import { VERBAL_QUIZ } from '../data/verbal';
import { vocabData } from '../data/vocab';

// Multi-step Letter Logic
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const VR_STRANDS = [
    {
        id: 'meanings',
        title: 'Word Meanings',
        icon: '📖',
        belts: [
            { level: 'white', title: 'Basic Synonyms', description: 'Find words with the same meaning.' },
            { level: 'blue', title: 'Targeted Antonyms', description: 'Find words with opposite meanings.' },
            { level: 'black', title: 'Semantic Pairs', description: 'Two pairs of words with similar links.' }
        ]
    },
    {
        id: 'construction',
        title: 'Word Building',
        icon: '🏗️',
        belts: [
            { level: 'white', title: 'Compound Words', description: 'Combine two words to make one.' },
            { level: 'blue', title: 'Hidden Words', description: 'Find a word hidden across two others.' },
            { level: 'black', title: 'Missing Letters', description: 'Identify letters removed from a word.' }
        ]
    },
    {
        id: 'codes',
        title: 'Codes & Logic',
        icon: '🔐',
        belts: [
            { level: 'white', title: 'Letter Connections', description: 'How does A change to D?' },
            { level: 'blue', title: 'Letter Sequences', description: 'Predict the next letter in the pattern.' },
            { level: 'black', title: 'Number-Letter Codes', description: 'Translate words into secret codes.' }
        ]
    },
    {
        id: 'numbers',
        title: 'Numerical VR',
        icon: '🔢',
        belts: [
            { level: 'white', title: 'Maths Wordplay', description: 'Insert numbers into word patterns.' },
            { level: 'blue', title: 'Number Series', description: 'Find the next number in the line.' },
            { level: 'black', title: 'Word Equations', description: 'Solve for the missing word using maths logic.' }
        ]
    }
];

export function getVRQuestion(strandId, beltLevel) {
    switch (strandId) {
        case 'meanings': return genMeanings(beltLevel);
        case 'construction': return genConstruction(beltLevel);
        case 'codes': return genCodes(beltLevel);
        case 'numbers': return genNumbers(beltLevel);
        default: return null;
    }
}

// --- Generators ---

function genMeanings(belt) {
    if (belt === 'white' || belt === 'blue') {
        const wordObj = pickRandom(vocabData);
        const isAntonym = belt === 'blue';
        
        const distractors = vocabData
            .filter(v => v.word !== wordObj.word)
            .sort(() => Math.random() - 0.5)
            .slice(0, 4)
            .map(v => v.word);

        const target = isAntonym 
            ? wordObj.antonyms.split(', ')[0] 
            : wordObj.synonyms.split(', ')[0];

        const options = [target, ...distractors].sort(() => Math.random() - 0.5);
        
        return {
            questionText: `Which word is an ${isAntonym ? 'antonym (opposite)' : 'synonym (same meaning)'} for: ${wordObj.word.toUpperCase()}?`,
            options: options,
            correctAnswerIndex: options.indexOf(target),
            logic: `Logic: '${wordObj.word}' and '${target}' are ${isAntonym ? 'opposites' : 'similar in meaning'}.`
        };
    }
    
    // Default to static data for complex types
    const items = VERBAL_QUIZ.Homonyms?.questions || [];
    const q = pickRandom(items);
    return {
        ...q,
        questionText: q.question,
        correctAnswerIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(q.correctAnswer),
        logic: "Logic: Find the single word that fits both sets of meanings provided in the brackets."
    };
}

function genConstruction(belt) {
    if (belt === 'white') {
        const q = pickRandom(VERBAL_QUIZ.Compound_words.questions);
        return {
            ...q,
            questionText: q.question,
            correctAnswerIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(q.correctAnswer),
            logic: "Logic: Look at the end of a word in Group 1 and the start of a word in Group 2 to see if they join to make a real word."
        };
    }
    
    const q = pickRandom(VERBAL_QUIZ.Hidden_word.questions);
    return {
        ...q,
        questionText: `Find the 3 or 4 letter word hidden across the words in this sentence:\n"${q.question}"`,
        correctAnswerIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(q.correctAnswer),
        logic: "Logic: The word spans the space between two words (e.g. 'the nEXT REal' has 'EXTRA' hidden)."
    };
}

function genCodes(belt) {
    if (belt === 'white' || belt === 'blue') {
        const startIdx = getRandomInt(0, 10);
        const step = getRandomInt(1, 4);
        const sequence = [0, 1, 2, 3].map(i => ALPHABET[(startIdx + i * step) % 26]);
        const target = ALPHABET[(startIdx + 4 * step) % 26];

        const options = [target, ...ALPHABET.filter(a => a !== target).sort(() => Math.random() - 0.5).slice(0, 4)].sort();

        return {
            questionText: `What is the next letter in this sequence?\n${sequence.join(' , ')} , ?`,
            options: options,
            correctAnswerIndex: options.indexOf(target),
            logic: `Logic: Each letter moves forward by ${step} positions in the alphabet.`
        };
    }

    const q = pickRandom(VERBAL_QUIZ.Corresponding_letters.questions);
    return {
        ...q,
        questionText: q.question,
        correctAnswerIndex: ['A', 'B', 'C', 'D', 'E'].indexOf(q.correctAnswer),
        logic: "Logic: Identify the letter-to-letter mapping used in the first examples and apply it to the final word."
    };
}

function genNumbers(belt) {
    const startNum = getRandomInt(1, 20);
    const step = getRandomInt(2, 8);
    const sequence = [0, 1, 2, 3].map(i => startNum + i * step);
    const target = startNum + 4 * step;

    const options = [target, target + 2, target - step, target + 5, startNum + 5].sort();

    return {
        questionText: `Identify the pattern and find the next number:\n${sequence.join(' , ')} , ?`,
        options: options.map(String),
        correctAnswerIndex: options.indexOf(target),
        logic: `Logic: This sequence is an arithmetic progression, increasing by ${step} each time.`
    };
}

export function getVRStrandBelts(strandId) {
    const strand = VR_STRANDS.find(s => s.id === strandId);
    if (!strand) return [];
    
    return strand.belts.map(belt => {
        let color, text;
        switch (belt.level) {
            case 'white': color = '#FFFFFF'; text = '#333'; break;
            case 'blue': color = '#3B82F6'; text = '#FFF'; break;
            case 'black': color = '#1F2937'; text = '#FFF'; break;
            default: color = '#666'; text = '#FFF';
        }
        return {
            ...belt,
            id: belt.level,
            name: belt.title,
            color,
            text
        };
    });
}

export function getVRStrandInstruction(strandId) {
    const instructions = {
        'meanings': "Unlocking vocabulary! Look for synonyms (same meaning) or antonyms (opposite meaning). Think carefully about how words are used in different contexts.",
        'construction': "Word building puzzles! Watch for hidden words spanning across two others, or identifying the correct parts of a compound word.",
        'codes': "De-coding logical patterns! Calculate alphabet jumps (e.g., +2, -1) to find secret messages or predict the next letter in the line.",
        'numbers': "Mathematical logic in words! Solve word-based equations or identify arithmetic patterns in number sequences."
    };
    return instructions[strandId] || "Master the logic of language with these advanced Verbal Reasoning drills!";
}
