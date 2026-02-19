const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'grammar_raw.csv');
const rawData = fs.readFileSync(csvPath, 'utf8');

// CSV Parser
function parseCSV(text) {
    const lines = text.split('\n').filter(l => l.trim());
    // Verify headers? Skipping for now, assuming structure

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const row = [];
        let inQuotes = false;
        let currentValue = '';

        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                if (j + 1 < line.length && line[j + 1] === '"') {
                    currentValue += '"';
                    j++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                row.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        row.push(currentValue);
        rows.push(row);
    }
    return rows;
}

const rows = parseCSV(rawData);
const passages = {};

rows.forEach(row => {
    // PassageID, LineNum, PartA, PartB, PartC, PartD, CorrectAnswer, Explanation
    // Note: row length might vary if Explanation contains commas, but our parser handles quotes.
    if (row.length < 7) return;

    let parts = [row[2], row[3], row[4], row[5]]; // Mutable for speech mark fix

    // Heuristic A: Restore missing opening speech marks (Excel strips leading single quotes)
    // Pattern: One of the parts ends with `'` (and is not just an apostrophe word like "don't")
    // and is followed by a speech verb or the sentence structure implies speech.
    const speechVerbs = ['said', 'shouted', 'asked', 'whispered', 'cried', 'replied', 'warned', 'thought', 'yelled', 'screamed', 'agreed', 'promised', 'mumbled', 'groaned'];

    // Check if any part ends with ' which serves as a closing quote
    let closingQuoteIndex = -1;
    for (let i = 0; i < parts.length; i++) {
        const p = parts[i].trim();
        if (p.endsWith("'") && !p.endsWith("n't")) { // ignore don't, won't etc at end (rare but possible)
            // Double check it looks like a closing quote
            closingQuoteIndex = i;
            break;
        }
    }

    if (closingQuoteIndex !== -1) {
        // Check if we already have an opening quote in part 0
        if (!parts[0].trim().startsWith("'")) {
            // Check context: Does the part after the quote look like a speech tag?
            // or is it just a speech sentence?
            // e.g. "Come here', he said" -> Part[closingQuoteIndex+1] starts with 'he' or 'said' etc.

            let likelySpeech = false;

            // Case 1: Next part contains a speech verb
            if (closingQuoteIndex + 1 < parts.length) {
                const nextPart = parts[closingQuoteIndex + 1].toLowerCase();
                if (speechVerbs.some(v => nextPart.includes(v)) || ['he', 'she', 'dad', 'mum', 'tom', 'ben'].some(p => nextPart.startsWith(p.toLowerCase()))) {
                    likelySpeech = true;
                }
            }

            // Case 2: The closing quote part ITSELF ends with "' said..." (if merged?) 
            // unlikely given CSV structure, but possible if split wrong.

            // Case 3: Just simple heuristic: If we have a closing quote and no opening quote, duplicate it at start.
            // We must be careful of things like "It's" at end of line? Unlikely.
            // apostrophes are usually inside words. ' at end is almost always a close quote or gloss.
            // Let's assume valid grammar data implies close quote.

            if (likelySpeech || true) { // Defaulting to true for now as ' at end of part is strong signal in this dataset
                // console.log(`Restoring speech mark for ${row[0]} Line ${row[1]}: "${parts[0]}..."`);
                parts[0] = "'" + parts[0];
            }
        }
    }

    const pId = row[0];
    const lineNum = row[1];

    const correctRaw = row[6].trim().toUpperCase(); // A, B, C, D, N

    // Map CorrectAnswer: N -> E
    const correctAnswer = correctRaw === 'N' ? 'E' : correctRaw;

    // Construct Options
    // A, B, C, D, No Error
    const options = [...parts, "No Error"];

    if (!passages[pId]) {
        passages[pId] = {
            id: pId,
            lines: {}, // Use object to dedupe by LineNum
            questions: []
        };
    }

    // Reconstruct Line Text
    const lineText = parts.join(' ');
    // Store line text by number to deduplicate (last write wins)
    passages[pId].lines[lineNum] = `(${lineNum}) ${lineText}`;

    passages[pId].questions.push({
        id: `${pId}_${lineNum}`,
        lineNum: parseInt(lineNum), // Store for sorting
        question: `Line ${lineNum}: Find the error`,
        options: options,
        correctAnswer: correctAnswer,
        explanation: row[7] || ""
    });
});

const finalQuestions = [];

Object.values(passages).forEach(p => {
    // Sort lines 1..12
    const sortedLineNums = Object.keys(p.lines).sort((a, b) => parseInt(a) - parseInt(b));
    const fullText = sortedLineNums.map(n => p.lines[n]).join('\n\n');

    // Deduplicate questions too? 
    // The user might have duplicate rows for the SAME Question ID.
    // Let's use a map for questions by LineNum too.
    const uniqueQuestions = {};
    p.questions.forEach(q => {
        uniqueQuestions[q.lineNum] = q;
    });

    Object.values(uniqueQuestions).sort((a, b) => a.lineNum - b.lineNum).forEach(q => {
        finalQuestions.push({
            id: q.id,
            passage: fullText,
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation
        });
    });
});

const fileContent = `export const GRAMMAR_QUIZ = ${JSON.stringify(finalQuestions, null, 2)};`;

fs.writeFileSync(path.join(__dirname, '../data/grammar.js'), fileContent);
console.log(`Generated ${finalQuestions.length} questions from ${Object.keys(passages).length} passages.`);
