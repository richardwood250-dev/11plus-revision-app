export const QUIZ_INSTRUCTIONS = {
    // English
    'Comprehension': "Read the passage carefully and answer the questions that follow.",
    'Cloze': "Choose the word that best completes the sentence.",
    'Grammar': "Select the box with a grammatical or punctuation error, or select No error if there are none.",
    'Spelling': "Select the box with a spelling error, or select No error if there are none.",

    // Verbal Reasoning
    'Linking Words': "Select the word that can be placed after the first word and before the second word to make two new words.",
    'Compound words': "Select one word from each group that can be joined together to make a new, correctly spelt word.",
    'Compound_words': "Select one word from each group that can be joined together to make a new, correctly spelt word.",
    'Corresponding letters': "Work out how the word in the first set of brackets is formed from the outer words, and use the same rule to find the missing word in the second set.",
    'Corresponding_letters': "Work out how the word in the first set of brackets is formed from the outer words, and use the same rule to find the missing word in the second set.",
    'Hidden word': "Find the four-letter word hidden across the end of one word and the beginning of the next.",
    'Hidden_word': "Find the four-letter word hidden across the end of one word and the beginning of the next.",
    'Homonyms': "Find the single word that has a meaning related to both pairs of words in brackets.",
    'Letter codes': "Work out how the first pair of letters is related, and apply the same rule to find the missing letters.",
    'Letter_codes': "Work out how the first pair of letters is related, and apply the same rule to find the missing letters.",
    'Letter sequences': "Identify the pattern in the sequence and select the pair of letters that comes next.",
    'Letter_sequences': "Identify the pattern in the sequence and select the pair of letters that comes next.",
    'Letters for numbers': "Use the letter values provided to solve the sum, and select the letter that represents the answer.",
    'Letters_for_numbers': "Use the letter values provided to solve the sum, and select the letter that represents the answer.",
    'Logical deduction': "Read the information carefully and use logical deduction to answer the question.",
    'Logical_deduction': "Read the information carefully and use logical deduction to answer the question.",
    'M3L': "Find the three letters that complete the unfinished word in capitals to make sense of the sentence.",
    'Missing 3 letters': "Find the three letters that complete the unfinished word in capitals to make sense of the sentence.",
    'Missing word': "Find the three letters that complete the unfinished word in capitals to make sense of the sentence.",
    'Missing letter': "Choose the letter that will correctly end the first word and begin the second word.",
    'Missing_letter': "Choose the letter that will correctly end the first word and begin the second word.",
    'Move a letter': "Identify one letter to move from the first word to the second word to create two new correctly spelt words.",
    'Move_a_letter': "Identify one letter to move from the first word to the second word to create two new correctly spelt words.",
    'Number connections': "Work out the rule connecting the numbers in the first two sets, and apply it to find the missing number in the third set.",
    'Number_connections': "Work out the rule connecting the numbers in the first two sets, and apply it to find the missing number in the third set.",
    'Odd 2 out': "Select the two words that do not share the same connection as the others.",
    'Odd 2 Out': "Select the two words that do not share the same connection as the others.",
    'Odd_2_out': "Select the two words that do not share the same connection as the others.",
    'Sequences': "Identify the pattern in the sequence and choose the option that comes next.",
    'Number sequences': "Identify the pattern in the number sequence and choose the number that comes next.",
    'Syn-Ant': "Select one word from each group that are most similar (synonyms) or most opposite (antonyms) in meaning as indicated.",
    'Syn_Ant': "Select one word from each group that are most similar (synonyms) or most opposite (antonyms) in meaning as indicated.",
    'Verbal analogies': "Choose one word from each set of brackets so that the second pair is related in the same way as the first pair.",
    'Verbal_analogies': "Choose one word from each set of brackets so that the second pair is related in the same way as the first pair.",
    'Word codes': "Use the examples provided to work out the correct code for the word.",
    'Word_codes': "Use the examples provided to work out the correct code for the word.",

    // Non-Verbal Reasoning
    'Matrices': "Select the figure that completes the pattern.",
    'Odd One Out': "Select the figure that is most unlike the others.",
    'Horizontal Code': "Find the letter code that matches the test shape based on the rules.",
    'Figure Analogies': "Choose the figure that completes the second pair in the same way as the first pair.",

    // Maths
    'Maths': "Work out the correct answer for each maths question.",
    'General': "Work out the correct answer for each maths question."
};

const normalizeKey = (key) => (key || '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const getInstruction = (title, topic, subject) => {
    const isVerbal = subject === 'Verbal' || subject === 'Verbal Reasoning';
    const isNonVerbal = subject === 'Non-Verbal' || subject === 'Non-Verbal Reasoning';
    const isMaths = subject === 'Maths';

    const cleanTopic = normalizeKey(topic);
    const cleanTitle = normalizeKey(title);

    // Sequences disambiguation between Verbal (numbers) and Non-Verbal (figures)
    if (cleanTopic === 'sequences' || cleanTitle === 'sequences') {
        if (isNonVerbal) return "Select the figure that logically completes the sequence.";
        if (isVerbal) return "Identify the pattern in the number sequence and choose the number that comes next.";
    }

    // Direct match by topic first, then title
    if (topic && QUIZ_INSTRUCTIONS[topic]) return QUIZ_INSTRUCTIONS[topic];
    if (title && QUIZ_INSTRUCTIONS[title]) return QUIZ_INSTRUCTIONS[title];

    // Normalized match across all keys in QUIZ_INSTRUCTIONS
    for (const [k, v] of Object.entries(QUIZ_INSTRUCTIONS)) {
        const cleanK = normalizeKey(k);
        if (cleanK === cleanTopic || cleanK === cleanTitle) {
            if (cleanK === 'sequences') {
                if (isNonVerbal) return "Select the figure that logically completes the sequence.";
                if (isVerbal) return "Identify the pattern in the number sequence and choose the number that comes next.";
            }
            return v;
        }
    }

    // Fuzzy/Partial matches
    const combined = `${title || ''} ${topic || ''}`.toLowerCase();
    if (combined.includes('comprehension')) return QUIZ_INSTRUCTIONS['Comprehension'];
    if (combined.includes('spelling')) return QUIZ_INSTRUCTIONS['Spelling'];
    if (combined.includes('grammar')) return QUIZ_INSTRUCTIONS['Grammar'];
    if (combined.includes('cloze')) return QUIZ_INSTRUCTIONS['Cloze'];
    if (combined.includes('homonym')) return QUIZ_INSTRUCTIONS['Homonyms'];
    if (combined.includes('corresponding')) return QUIZ_INSTRUCTIONS['Corresponding letters'];
    if (combined.includes('letter code')) return QUIZ_INSTRUCTIONS['Letter codes'];
    if (combined.includes('letter seq')) return QUIZ_INSTRUCTIONS['Letter sequences'];
    if (combined.includes('letters for number') || combined.includes('number for letter')) return QUIZ_INSTRUCTIONS['Letters for numbers'];
    if (combined.includes('compound')) return QUIZ_INSTRUCTIONS['Compound words'];
    if (combined.includes('linking')) return QUIZ_INSTRUCTIONS['Linking Words'];
    if (combined.includes('move a letter')) return QUIZ_INSTRUCTIONS['Move a letter'];
    if (combined.includes('hidden word')) return QUIZ_INSTRUCTIONS['Hidden word'];
    if (combined.includes('missing letter')) return QUIZ_INSTRUCTIONS['Missing letter'];
    if (combined.includes('missing 3') || combined.includes('m3l')) return QUIZ_INSTRUCTIONS['M3L'];
    if (combined.includes('number conn')) return QUIZ_INSTRUCTIONS['Number connections'];
    if (combined.includes('odd 2') || combined.includes('odd two')) return QUIZ_INSTRUCTIONS['Odd 2 out'];
    if (combined.includes('odd one')) return QUIZ_INSTRUCTIONS['Odd One Out'];
    if (combined.includes('syn') || combined.includes('ant')) return QUIZ_INSTRUCTIONS['Syn-Ant'];
    if (combined.includes('analogi')) return isNonVerbal ? QUIZ_INSTRUCTIONS['Figure Analogies'] : QUIZ_INSTRUCTIONS['Verbal analogies'];
    if (combined.includes('matrix') || combined.includes('matrices')) return QUIZ_INSTRUCTIONS['Matrices'];
    if (combined.includes('horizontal')) return QUIZ_INSTRUCTIONS['Horizontal Code'];
    if (combined.includes('word code')) return QUIZ_INSTRUCTIONS['Word codes'];
    if (combined.includes('deduction') || combined.includes('logic')) return QUIZ_INSTRUCTIONS['Logical deduction'];

    // Tailored fallbacks by subject
    if (isMaths) return "Work out the correct answer for each maths question.";
    if (isNonVerbal) return "Select the figure that correctly solves each puzzle.";
    if (isVerbal) return "Work out the correct answer using logic and verbal reasoning.";
    if (subject === 'English') return "Read carefully and choose the best answer for each question.";

    return "Select the best answer for each question.";
};

/**
 * Returns a specific, friendly question prompt for puzzle types whose raw question text
 * only contains pairs/patterns (e.g. Homonyms "(performance, drama) (fun, game)" or
 * Corresponding Letters "(SMILE [GUM] MUG) (EXAM [ ? ] DAWN)") instead of a full question sentence.
 */
export const getQuestionPrompt = (questionText, title, topic, subject) => {
    const text = (questionText || '').trim();

    // If the question text already has a full question / instruction sentence, don't duplicate
    if (
        /^select one word/i.test(text) ||
        /^find the two words/i.test(text) ||
        /^find the (synonyms|antonyms)/i.test(text) ||
        /^if the code/i.test(text) ||
        /^read the schedule/i.test(text) ||
        /^which (country|value|option|figure|word|letter|number|sentence|shape)/i.test(text) ||
        /^what (is|does|are|comes)/i.test(text) ||
        /^how (many|much|is)/i.test(text)
    ) {
        return null;
    }

    const cleanTopic = normalizeKey(topic);
    const cleanTitle = normalizeKey(title);
    const combined = `${title || ''} ${topic || ''}`.toLowerCase();
    const isVerbal = subject === 'Verbal' || subject === 'Verbal Reasoning';

    if (cleanTopic === 'homonyms' || cleanTitle === 'homonyms' || combined.includes('homonym')) {
        return "Which word has a meaning related to both pairs in brackets?";
    }

    if (cleanTopic === 'correspondingletters' || cleanTitle === 'correspondingletters' || combined.includes('corresponding')) {
        return "Which word completes the second pair using the same rule?";
    }

    if (cleanTopic === 'missingletter' || cleanTitle === 'missingletter' || combined.includes('missing letter')) {
        return "Which letter correctly finishes the first word and begins the second?";
    }

    if (cleanTopic === 'numberconnections' || cleanTitle === 'numberconnections' || combined.includes('number connection')) {
        return "Which number completes the pattern in the third set?";
    }

    if (cleanTopic === 'lettercodes' || cleanTitle === 'lettercodes' || combined.includes('letter code')) {
        return "Which pair of letters completes the code?";
    }

    if (cleanTopic === 'lettersequences' || cleanTitle === 'lettersequences' || combined.includes('letter sequence')) {
        return "Which letters come next in the sequence?";
    }

    if (cleanTopic === 'sequences' || cleanTitle === 'sequences' || (combined.includes('sequence') && !combined.includes('letter'))) {
        if (isVerbal || /^[\d\s\[\]?,.-]+$/.test(text)) {
            return "Which number comes next in the sequence?";
        }
    }

    if (cleanTopic === 'lettersfornumbers' || cleanTitle === 'lettersfornumbers' || combined.includes('letters for number')) {
        return "Solve the equation using the key to find the correct letter:";
    }

    if (cleanTopic === 'movealetter' || cleanTitle === 'movealetter' || combined.includes('move a letter')) {
        return "Move one letter from the first word to the second word to create two new words:";
    }

    if (cleanTopic === 'hiddenword' || cleanTitle === 'hiddenword' || combined.includes('hidden word')) {
        return "Find the four-letter word hidden across two adjacent words:";
    }

    if (cleanTopic === 'm3l' || cleanTitle === 'm3l' || combined.includes('missing 3') || combined.includes('m3l')) {
        return "Find the three letters that complete the word in capitals:";
    }

    if (cleanTopic === 'linkingwords' || cleanTitle === 'linkingwords' || combined.includes('linking word')) {
        return "Select the word that joins with both words to make two new words:";
    }

    if (cleanTopic === 'verbalanalogies' || cleanTitle === 'verbalanalogies' || combined.includes('analogi')) {
        return "Complete the analogy:";
    }

    // Pattern-based fallbacks if topic/title was omitted or unrecognised
    // e.g. "(performance, drama) (fun, game)"
    if (/^\([a-z\s,-]+\)\s*\([a-z\s,-]+\)$/i.test(text)) {
        return "Which word has a meaning related to both pairs in brackets?";
    }
    // e.g. "(SMILE [GUM] MUG) (EXAM [ ? ] DAWN)"
    if (/\[\s*\?\s*\]/.test(text) && /\([A-Z\s]+\[.+\]\s*[A-Z\s]+\)/i.test(text)) {
        return "Which word completes the second pair using the same rule?";
    }
    // e.g. "(3 [15] 5) (3 [30] 10) (4 [?] 10)"
    if (/\[\s*\?\s*\]/.test(text) && /\(\d+\s*\[\d+\]\s*\d+\)/.test(text)) {
        return "Which number completes the pattern in the third set?";
    }
    // e.g. "GRAP [ ? ] ACH"
    if (/^[A-Za-z]+\s*\[\s*\?\s*\]\s*[A-Za-z]+$/.test(text)) {
        return "Which letter correctly finishes the first word and begins the second?";
    }
    // e.g. "37 33 29 25 [?]"
    if (/^[\d\s]+\[\s*\?\s*\]$/.test(text)) {
        return "Which number comes next in the sequence?";
    }
    // e.g. "JL is to LN as YN is to [?]"
    if (/is to.+as.+is to/i.test(text)) {
        return "Which pair of letters completes the code?";
    }

    return null;
};
