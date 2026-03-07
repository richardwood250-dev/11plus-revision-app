export const QUIZ_INSTRUCTIONS = {
    // English
    'Comprehension': "Read the passage carefully and answer the questions that follow.",
    'Cloze': "Choose the word that best completes the sentence.",
    'Grammar': "Select the box with a grammatical or punctuation error, or select No error if there are none.",
    'Spelling': "Select the box with a spelling error, or select No error if there are none.",

    // Verbal Reasoning
    'Linking Words': "Select the word that could go after the first word and before the second word to make 2 new words.",
    'Compound words': "Select one word from each group that can be joined together to make a new, correctly spelt word.",
    'Letter codes': "Work out how the first pair of letters is related, and apply the same rule to find the missing letters.",
    'Letter sequences': "Identify the pattern in the sequence and select the pair of letters that comes next.",
    'Word codes': "Use the examples provided to work out the correct code for the word.",
    'Odd 2 out': "Select the two words that do not share the same connection as the others.",
    'Odd 2 Out': "Select the two words that do not share the same connection as the others.",
    'Letters for numbers': "Use the letter values provided to solve the sum, and select the letter that represents the answer.",
    'Move a letter': "Identify one letter to move from the first word to the second word to create two new correctly spelt words.",
    'Hidden word': "Find the four-letter word hidden across the end of one word and the beginning of the next.",
    'Missing word': "Find the three-letter word that correctly finishes the first word and starts the second.",
    'Missing 3 letters': "Find the three-letter word that correctly finishes the first word and starts the second.",
    'M3L': "Find the three-letter word that correctly finishes the first word and starts the second.",

    // Non-Verbal Reasoning
    'Matrices': "Select the figure that completes the pattern.",
    'Sequences': "Select the figure that logically completes the sequence.",
    'Odd One Out': "Select the figure that is most unlike the others.",
    'Horizontal Code': "Find the letter code that matches the test shape based on the rules.",
    'Figure Analogies': "Choose the figure that completes the second pair in the same way as the first pair."
};

export const getInstruction = (title, topic) => {
    // Try to match by topic first, then title
    if (topic && QUIZ_INSTRUCTIONS[topic]) return QUIZ_INSTRUCTIONS[topic];
    if (title && QUIZ_INSTRUCTIONS[title]) return QUIZ_INSTRUCTIONS[title];

    // Fuzzy/Partial matches
    if (title && title.toLowerCase().includes('comprehension')) return QUIZ_INSTRUCTIONS['Comprehension'];
    if (title && title.toLowerCase().includes('spelling')) return QUIZ_INSTRUCTIONS['Spelling'];
    if (title && title.toLowerCase().includes('grammar')) return QUIZ_INSTRUCTIONS['Grammar'];

    if (topic && topic.toLowerCase().includes('comprehension')) return QUIZ_INSTRUCTIONS['Comprehension'];
    if (topic && topic.toLowerCase().includes('spelling')) return QUIZ_INSTRUCTIONS['Spelling'];
    if (topic && topic.toLowerCase().includes('grammar')) return QUIZ_INSTRUCTIONS['Grammar'];

    return "Read the question carefully and select the best answer.";
};
