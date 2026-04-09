// utils/englishSkills.js

export const ENGLISH_STRANDS = [
  { id: 'spelling', title: 'Spelling & Morphology', description: 'Phonics, suffixes, and silent letters', color: '#10B981', icon: '🔤' },
  { id: 'grammar', title: 'Grammar & Syntax', description: 'Nouns, verbs, adjectives, clauses', color: '#8B5CF6', icon: '📚' },
  { id: 'punctuation', title: 'Punctuation', description: 'Commas, apostrophes, and speech', color: '#EF4444', icon: '✍️' },
  { id: 'vocab', title: 'Vocabulary & Synonyms', description: 'Synonyms, antonyms, and word types', color: '#F59E0B', icon: '📖' },
  { id: 'verbal', title: 'Rapid Verbal', description: 'Odd ones out, word connections', color: '#3B82F6', icon: '🧩' }
];

export const BELTS = [
  { id: 'white', name: 'White Belt', color: '#E2E8F0', text: '#333' },
  { id: 'yellow', name: 'Yellow Belt', color: '#FCD34D', text: '#854D0E' },
  { id: 'orange', name: 'Orange Belt', color: '#F97316', text: '#FFF' },
  { id: 'green', name: 'Green Belt', color: '#22C55E', text: '#FFF' },
  { id: 'blue', name: 'Blue Belt', color: '#3B82F6', text: '#FFF' },
  { id: 'brown', name: 'Brown Belt', color: '#78350F', text: '#FFF' },
  { id: 'black', name: 'Black Belt', color: '#111827', text: '#FFF' },
];

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getStrandBelts(strandId) {
    const descriptions = {
        'spelling': [
            'Simple plurals (-s, -es)',
            'Basic Suffixes (-ing, -ed)',
            'Silent letters',
            'Homophones (their/there)',
            'The i before e rule',
            'Common 11+ exceptions',
            'Mixed Spelling Mastery'
        ],
        'grammar': [
            'Identifying Nouns',
            'Identifying Verbs',
            'Identifying Adjectives',
            'Simple vs Compound Sentences',
            'Tense agreement',
            'Clauses & Conjunctions',
            'Mixed Grammar Mastery'
        ],
        'punctuation': [
            'Capital letters & Full stops',
            'Question & Exclamation marks',
            'Commas in a list',
            'Apostrophes for possession',
            'Apostrophes for contraction',
            'Speech marks',
            'Mixed Punctuation Mastery'
        ],
        'vocab': [
            'Basic Synonyms',
            'Basic Antonyms',
            'Adjectives of Degree',
            '11+ Standard Synonyms',
            '11+ Standard Antonyms',
            'Words with multiple meanings',
            'Mixed Vocabulary Mastery'
        ],
        'verbal': [
            'Compound words',
            'Hidden words',
            'Odd two out',
            'Letter connections',
            'Word Analogies',
            'Advanced Logical deduction',
            'Mixed Verbal Mastery'
        ]
    };

    const strDesc = descriptions[strandId] || descriptions['spelling'];
    
    return BELTS.map((belt, idx) => ({
        ...belt,
        description: strDesc[idx] || 'Skill training'
    }));
}

import { vocabGameBank } from '../data/vocabGameBank';
import { SPELLING_QUIZ } from '../data/spelling';
import { GRAMMAR_QUIZ } from '../data/grammar';

export function generateEnglishSkillQuestion(strandId, beltId) {
    let questionText = '';
    let correctAnswer = '';
    let options = [];
    let inputMode = 'multiple_choice';

    const getMock = (arr) => arr[Math.floor(Math.random() * arr.length)];

    if (strandId === 'spelling') {
        const spellingItem = getMock(SPELLING_QUIZ);
        // The options array holds the sliced sentence. We can rebuild the target sentence!
        const sentence = spellingItem.options.slice(0, 4).join(' ');
        questionText = `Find the spelling error:\n\n"${sentence}"`;
        options = [...spellingItem.options];
        // The correctAnswer is A, B, C, D, E. Map it to the actual option text:
        const ansIndex = spellingItem.correctAnswer.charCodeAt(0) - 65; // 'A' -> 0
        correctAnswer = options[ansIndex];
        inputMode = 'multiple_choice'; // Overwrite to MC since we use options now

    } else if (strandId === 'grammar') {
        const grammarItem = getMock(GRAMMAR_QUIZ);
        const sentence = grammarItem.options.slice(0, 4).join(' ');
        questionText = `Find the grammar or punctuation error:\n\n"${sentence}"`;
        options = [...grammarItem.options];
        const ansIndex = grammarItem.correctAnswer.charCodeAt(0) - 65;
        correctAnswer = options[ansIndex];
        inputMode = 'multiple_choice';

    } else if (strandId === 'vocab') {
        const vocabItem = getMock(vocabGameBank);
        const typeStr = vocabItem.missionType; // Synonym, Antonym, or Root
        
        if (typeStr === 'Root') {
            questionText = `What does the root '${vocabItem.word}' mean?`;
        } else {
            questionText = `What is the ${typeStr.toLowerCase()} for: ${vocabItem.word.toUpperCase()}?`;
        }
        
        correctAnswer = vocabItem.options[vocabItem.correctIndex];
        options = [...vocabItem.options];
    } else if (strandId === 'punctuation') {
        const qList = [
            { q: 'Which punctuation ends a question?', a: '?', opts: ['.', ',', '?', '!'] },
            { q: 'Which is used for a contraction of "Do not"?', a: 'Don\'t', opts: ['Dont', 'Do\'nt', 'Don\'t', 'Don t'] },
            { q: 'Which is used for a contraction of "Can not"?', a: 'Can\'t', opts: ['Cant', 'Can\'t', 'Ca\'nt', 'Cannot'] },
            { q: 'Which punctuation separates items in a list?', a: 'Comma', opts: ['Comma', 'Full stop', 'Apostrophe', 'Hyphen'] },
            { q: 'Identify the missing punctuation: \nWow__', a: '!', opts: ['.', ',', '?', '!'] },
            { q: 'Identify the missing punctuation: \n__Hello__ he said.', a: '"', opts: [',', '.', '"', '?'] },
            { q: 'What belongs to the dog? \nThe ___ bone', a: 'dog\'s', opts: ['dogs', 'dog\'s', 'dogs\'', 'dogs\'s'] },
            { q: 'Plural possession (belonging to many cats):\nThe ____ bowls', a: 'cats\'', opts: ['cats', 'cat\'s', 'cats\'', 'cat'] }
        ];
        const selected = getMock(qList);
        questionText = selected.q;
        correctAnswer = selected.a;
        options = selected.opts;
    } else {
        // Fallback for verbal or others
        const qList = [
            { q: 'Find the odd one out: Apple, Banana, Carrot, Orange', a: 'Carrot', opts: ['Apple', 'Banana', 'Carrot', 'Orange'] },
            { q: 'Find the odd one out: Dog, Cat, Horse, Snake', a: 'Snake', opts: ['Dog', 'Cat', 'Horse', 'Snake'] },
            { q: 'Find the odd one out: Red, Blue, Green, Square', a: 'Square', opts: ['Red', 'Blue', 'Green', 'Square'] },
            { q: 'Find the compound word: Sun + ___', a: 'Flower', opts: ['Flower', 'Water', 'Table', 'Shoe'] },
            { q: 'Find the compound word: Rain + ___', a: 'Bow', opts: ['Drop', 'Bow', 'Coat', 'All of these'] },
            { q: 'Find the hidden word in: "\nThe dog ran"', a: 'ran', opts: ['The', 'dog', 'ran', 'None'] },
            { q: 'Find the hidden 3-letter animal in:\n"He is a catnip lover"', a: 'cat', opts: ['bat', 'cat', 'rat', 'dog'] },
            { q: 'If Tree = Branch, Car = ?', a: 'Wheel', opts: ['Drive', 'Wheel', 'Road', 'Fast'] }
        ];
        const selected = getMock(qList);
        questionText = selected.q;
        correctAnswer = selected.a;
        options = selected.opts;
    }

    // Shuffle options if they exist
    let finalOptions = [...options];
    if (finalOptions.length > 0) {
        for (let i = finalOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [finalOptions[i], finalOptions[j]] = [finalOptions[j], finalOptions[i]];
        }
    }

    return {
        questionText,
        correctAnswer,
        options: finalOptions,
        inputMode,
        id: Math.random().toString(36).substr(2, 9)
    };
}
