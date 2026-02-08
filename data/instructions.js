export const QUIZ_INSTRUCTIONS = {
    // English
    'Comprehension': "Read the passage carefully and answer the questions that follow.",
    'Cloze': "Choose the word that best fits the gap in the sentence to make it make sense.",
    'Grammar': "Select the correct option to complete the sentence or identify the grammatical error.",
    'Spelling': "Identify the correctly spelled word or the error in the sentence.",

    // Verbal Reasoning
    'Compound Words': "Select one word from each group that can be joined to form a new compound word.",
    'Letter codes': "Decide how the first two letters are related to the last two, and apply the same rule to the test word.",
    'Letter sequences': "Find the pair of letters that continues the sequence in the most logical way.",
    'Word codes': "Work out the code for the word using the examples provided.",
    'Odd 2 out': "Select two words that are the odd ones out and do not fit with the others.",
    'Odd 2 Out': "Select two words that are the odd ones out and do not fit with the others.",
    'Letters for numbers': "Work out the value of the word sum using the letter key provided.",
    'Move a letter': "Move one letter from the first word to the second word to make two new real words.",
    'Hidden word': "Find the four-letter word hidden at the end of one word and the beginning of the next.",
    'Missing word': "Find the three-letter word that finishes the first word and starts the second.",

    // Non-Verbal Reasoning
    'Matrices': "Select the option that completes the matrix pattern.",
    'Sequences': "Select the option that completes the sequence logically.",
    'Odd One Out': "Select the figure that is most unlike the others.",
    'Horizontal Code': "Find the letter code that matches the test shape based on the rules.",
    'Figure Analogies': "Choose the figure that completes the second pair in the same way as the first pair."
};

export const getInstruction = (title, topic) => {
    // Try to match by topic first, then title
    if (QUIZ_INSTRUCTIONS[topic]) return QUIZ_INSTRUCTIONS[topic];
    if (QUIZ_INSTRUCTIONS[title]) return QUIZ_INSTRUCTIONS[title];

    // Fuzzy/Partial matches
    if (title.toLowerCase().includes('comprehension')) return QUIZ_INSTRUCTIONS['Comprehension'];

    return "Read the question carefully and select the best answer.";
};
