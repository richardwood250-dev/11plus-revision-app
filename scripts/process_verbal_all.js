const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, '../data/verbal_csvs');
const outputFile = path.join(__dirname, '../data/verbal.js');

const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.csv') && !f.startsWith('.'));

// Helper to clean keys
const cleanKey = (k) => k.toLowerCase().trim().replace(/_/g, '').replace(/ /g, '');

// Helper to normalize options
const getOption = (row, headers, keys) => {
    for (const key of keys) {
        const index = headers.findIndex(h => cleanKey(h) === cleanKey(key));
        if (index !== -1 && row[index]) return row[index];
    }
    return null;
};

const processedTopics = {};

files.forEach(file => {
    const filePath = path.join(inputDir, file);
    const content = fs.readFileSync(filePath, 'utf8');

    // Parse Lines
    // Parse Lines using parser

    // Parse Headers
    // Handle CSV quoting? Simple split for now, assuming standard format with no internal commas in standard fields (hopefully)
    // Actually, questions might have commas. Need robust split.
    // Re-use simple parser from before but robustify.

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
        // Note: Verbal analogies options seem to be "BZ", "BX", "AX" etc. 
        // The question text contains the keys?
        // "Wide is to ... (A... C...)"
        // The columns 2-6 seem to be random pair combinations?
        // Actually, looking at the data:
        // VA_01, Question, BZ, BX, AX, BY, CY, A
        // A is the correct answer.
        // BZ, BX etc might be Distractors?
        // Let's assume Col 2-6 are options.
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

        // Special handling for Logical Deduction / Move Letter combo?
        // If "Statement 2" exists, append it?
        const s2Idx = headers.findIndex(h => h.trim() === 'Statement 2');
        if (s2Idx !== -1 && row[s2Idx]) {
            qText += "\n" + row[s2Idx]; // Combine statements
        }

        const conclusionIdx = headers.findIndex(h => h.trim() === 'Conclusion');
        if (conclusionIdx !== -1 && row[conclusionIdx]) {
            qText += "\nConclusion: " + row[conclusionIdx];
        }

        const word2Idx = headers.findIndex(h => h.trim() === 'Word 2');
        if (word2Idx !== -1 && row[word2Idx] && qText) {
            qText += " -> " + row[word2Idx]; // e.g. Word1 -> Word2
        }

        const keyIdx = headers.findIndex(h => h.trim() === 'Key');
        let keyVal = null;
        if (keyIdx !== -1 && row[keyIdx]) {
            keyVal = row[keyIdx];
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

        if (optAIdx !== -1) options.push(row[optAIdx]);
        if (optBIdx !== -1) options.push(row[optBIdx]);
        if (optCIdx !== -1) options.push(row[optCIdx]);
        if (optDIdx !== -1) options.push(row[optDIdx]);
        if (optEIdx !== -1) options.push(row[optEIdx]);

        // Correct Answer
        const correctIdx = headers.findIndex(h => /correct/i.test(h) || /answer/i.test(h));
        let correctVal = (correctIdx !== -1) ? row[correctIdx] : 'A';

        // Normalize Correct Answer
        let finalCorrectLetter = correctVal ? correctVal.trim() : 'A';

        // If the answer is the full text (e.g. "SKIRT-VARY"), try to map it to A/B/C/D/E
        if (finalCorrectLetter.length > 1 && !['A', 'B', 'C', 'D', 'E'].includes(finalCorrectLetter)) {
            const matchIdx = options.findIndex(o => o && o.toLowerCase() === finalCorrectLetter.toLowerCase());
            if (matchIdx !== -1) {
                finalCorrectLetter = String.fromCharCode(65 + matchIdx);
            }
        }

        // Final check for valid letter
        if (!['A', 'B', 'C', 'D', 'E'].includes(finalCorrectLetter)) {
            // If we can't find it, defaulting or logging? 
            // Logic deduction sometimes has Answer text that doesn't match options perfectly?
            // Let's assume it's A if strictly unknown to avoid crash, or filter out?
            // Filter out safest.
            // continue; 
        }

        if (qText && options.length > 0) {
            questions.push({
                id: `${cleanTopicKey}_${i}`,
                question: qText,
                key: keyVal,
                options: options.filter(o => o), // Remove empty
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
