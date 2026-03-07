const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../data/verbal_csvs');
const outputFile = path.join(__dirname, '../data/verbal.js');

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.csv') && !f.startsWith('.'));

// Helper for true randomization (Fisher-Yates)
const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Helper to clean keys
const cleanKey = (k) => k.toLowerCase().trim().replace(/_/g, '').replace(/ /g, '');

// Helper to sanitize text and fix Unicode corruption (Mojibake)
const sanitizeText = (text) => {
    if (!text) return text;
    let sanitized = text;
    // Fix Windows-1252 / UTF-8 Mojibake artifacts
    sanitized = sanitized.replace(/Ã¢â‚¬â€/g, "-");     // Em-dash
    sanitized = sanitized.replace(/â€”/g, "-");        // Em-dash standard
    sanitized = sanitized.replace(/Ã¢â‚¬â€œ/g, "-");   // En-dash
    sanitized = sanitized.replace(/â€“/g, "-");        // En-dash standard
    sanitized = sanitized.replace(/Ã¢â‚¬Â¦/g, "...");    // Ellipsis
    sanitized = sanitized.replace(/â€¦/g, "...");        // Ellipsis standard
    sanitized = sanitized.replace(/Ã¢â‚¬Ëœ/g, "'");     // Left single quote
    sanitized = sanitized.replace(/Ã¢â‚¬â„¢/g, "'");    // Right single quote
    sanitized = sanitized.replace(/â€˜/g, "'");        // Left single quote standard
    sanitized = sanitized.replace(/â€™/g, "'");        // Right single quote standard
    sanitized = sanitized.replace(/Ã¢â‚¬Å“/g, '"');     // Left double quote
    sanitized = sanitized.replace(/Ã¢â‚¬Â /g, '"');     // Right double quote
    sanitized = sanitized.replace(/â€œ/g, '"');        // Left double quote standard
    sanitized = sanitized.replace(/â€ /g, '"');        // Right double quote standard

    // Fallback for residual characters
    sanitized = sanitized.replace(/Ã¢â‚¬/g, "'");

    // Finally trim whitespace just in case
    return sanitized.trim();
};

// Helper to normalize options
const getOption = (row, headers, keys) => {
    for (const key of keys) {
        const index = headers.findIndex(h => cleanKey(h) === cleanKey(key));
        if (index !== -1 && row[index]) return sanitizeText(row[index]);
    }
    return null;
};

const processedTopics = {};

files.forEach(file => {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Robust CSV Parser (State Machine)
    function parseCSV(text) {
        const rows = [];
        let currentRow = [];
        let currentVal = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            const nextChar = text[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    currentVal += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                currentRow.push(currentVal.trim());
                currentVal = '';
            } else if ((char === '\r' || char === '\n') && !inQuotes) {
                if (char === '\r' && nextChar === '\n') i++;
                currentRow.push(currentVal.trim());
                if (currentRow.length > 0 || currentVal !== '') rows.push(currentRow);
                currentRow = [];
                currentVal = '';
            } else {
                currentVal += char;
            }
        }
        if (currentVal || currentRow.length > 0) {
            currentRow.push(currentVal.trim());
            rows.push(currentRow);
        }
        return rows;
    }

    let rows = parseCSV(content);
    if (rows.length < 1) return;

    // Handle Headerless Files (Verbal Analogies)
    let headers = rows[0];
    let startIndex = 1;

    // specific check for Verbal Analogies or if row 0 looks like data
    const topicKey = file.replace('Questions - ', '')
        .replace('.csv', '')
        .replace(/\(\d+\)/, '')
        .replace(/\./g, '')
        .trim();

    if (topicKey === 'Verbal analogies' || (headers[0] && headers[0].startsWith('VA_'))) {
        // Inject headers
        headers = ['ID', 'Question', 'OptionA', 'OptionB', 'OptionC', 'OptionD', 'OptionE', 'Correct Answer'];
        startIndex = 0; // consume first row as data
    } else {
        headers = rows[0]; // Standard headers
    }

    const cleanTopicKey = topicKey.replace(/[^a-zA-Z0-9]/g, '_'); // safe key

    const questions = [];

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (row.length < 2) continue; // Skip empty

        // Question Detection
        let qText = getOption(row, headers, [
            'question', 'Question', 'QuestionID',
            'Question Text', // Logical Deduction
            'Question Pairs', // Homonyms
            'Equation', // Letters for numbers
            'Statement 1', // Logical Deduction (Maybe combine with S2? For now just S1 or S1+S2)
            'Word 1', // Move a letter
            'Word', // Compound words maybe?
            'Analogies' // Verbal analogies? Let's assume standard "Question" or check file.
        ]);

        // Special handling for Logical Deduction / Move Letter combo
        const s2Idx = headers.findIndex(h => cleanKey(h) === cleanKey('Statement 2'));
        if (s2Idx !== -1 && row[s2Idx]) {
            qText += "\n" + sanitizeText(row[s2Idx]); // Combine statements
        }

        const conclusionIdx = headers.findIndex(h => cleanKey(h) === cleanKey('Conclusion'));
        if (conclusionIdx !== -1 && row[conclusionIdx]) {
            qText += "\nConclusion: " + sanitizeText(row[conclusionIdx]);
        }

        const word2Idx = headers.findIndex(h => cleanKey(h) === cleanKey('Word 2'));
        if (word2Idx !== -1 && row[word2Idx] && qText) {
            qText += " & " + sanitizeText(row[word2Idx]);
        }

        const keyIdx = headers.findIndex(h => cleanKey(h) === cleanKey('Key'));
        let keyVal = null;
        if (keyIdx !== -1 && row[keyIdx]) {
            keyVal = sanitizeText(row[keyIdx]);
        }

        // Options
        const options = [];

        // Try standard "OptionA" or "option a" pattern
        let optAIdx = headers.findIndex(h => /option\s*a/i.test(h));
        let optBIdx = headers.findIndex(h => /option\s*b/i.test(h));
        let optCIdx = headers.findIndex(h => /option\s*c/i.test(h));
        let optDIdx = headers.findIndex(h => /option\s*d/i.test(h));
        let optEIdx = headers.findIndex(h => /option\s*e/i.test(h));

        // If not found, try simple "A", "B", "C" pattern (exact match to avoid "Answer")
        if (optAIdx === -1) optAIdx = headers.findIndex(h => h.trim() === 'A');
        if (optBIdx === -1) optBIdx = headers.findIndex(h => h.trim() === 'B');
        if (optCIdx === -1) optCIdx = headers.findIndex(h => h.trim() === 'C');
        if (optDIdx === -1) optDIdx = headers.findIndex(h => h.trim() === 'D');
        if (optEIdx === -1) optEIdx = headers.findIndex(h => h.trim() === 'E');

        if (optAIdx !== -1) options.push(sanitizeText(row[optAIdx]));
        if (optBIdx !== -1) options.push(sanitizeText(row[optBIdx]));
        if (optCIdx !== -1) options.push(sanitizeText(row[optCIdx]));
        if (optDIdx !== -1) options.push(sanitizeText(row[optDIdx]));
        if (optEIdx !== -1) options.push(sanitizeText(row[optEIdx]));

        // Correct Answer
        const correctIdx = headers.findIndex(h => /correct/i.test(h) || /answer/i.test(h));
        let correctVal = (correctIdx !== -1) ? row[correctIdx] : 'A';

        // Normalize Correct Answer
        let finalCorrectLetter = correctVal ? correctVal.trim() : 'A';
        // Secure sanitization for 'Letters for numbers' where answers are 'OptionE'
        finalCorrectLetter = finalCorrectLetter.replace(/^option\s*/i, '');

        // If the answer is the full text (e.g. "SKIRT-VARY") or a literal single character (e.g. "K" in Missing Letter)
        // Try to map it to A/B/C/D/E by searching the options array
        if (cleanTopicKey === 'Missing_letter' || cleanTopicKey === 'Move_a_letter' || !['A', 'B', 'C', 'D', 'E'].includes(finalCorrectLetter)) {
            const matchIdx = options.findIndex(o => o && o.toLowerCase() === sanitizeText(finalCorrectLetter).toLowerCase());
            if (matchIdx !== -1) {
                finalCorrectLetter = String.fromCharCode(65 + matchIdx);
            }
        }

        // Manual override for Hidden_word_47 duplicate valid answer "hen"
        if (qText === "The new estate is huge now.") {
            qText = "That new estate is huge now.";
            if (options[0] === "The new") {
                options[0] = "That new";
            }
        }

        // --- SHUFFLE OPTIONS ---
        let filteredOptions = options.filter(o => o); // Remove empty

        if (filteredOptions.length > 0) {
            // 1. Identify the exact text of the correct answer BEFORE shuffling
            // Default to 'A' index on crash, but it should be strongly typed natively
            const originalCorrectIdx = Math.max(0, finalCorrectLetter.charCodeAt(0) - 65);
            let correctText = filteredOptions[originalCorrectIdx] || filteredOptions[0];

            // 2. Shuffle the options
            filteredOptions = shuffleArray(filteredOptions);

            // 3. Find where the correctText moved to
            const newCorrectIdx = filteredOptions.indexOf(correctText);

            // 4. Update the letter
            finalCorrectLetter = String.fromCharCode(65 + (newCorrectIdx !== -1 ? newCorrectIdx : 0));
        }

        if (qText && filteredOptions.length > 0) {
            questions.push({
                id: `${cleanTopicKey}_${i}`,
                question: qText,
                key: keyVal,
                options: filteredOptions,
                correctAnswer: finalCorrectLetter
            });
        }
    }

    if (questions.length > 0) {
        console.log(`Processed ${topicKey}: ${questions.length} questions`);
        processedTopics[cleanTopicKey] = {
            title: topicKey,
            questions: questions
        };
    }
});

// Write output
let outputContent = 'export const VERBAL_QUIZ = {\n';
Object.keys(processedTopics).forEach(key => {
    outputContent += `  "${key}": ${JSON.stringify(processedTopics[key])},\n`;
});
outputContent += '};\n';

fs.writeFileSync(outputFile, outputContent);
console.log('Finished writing data/verbal.js');
