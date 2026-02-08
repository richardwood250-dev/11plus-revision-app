
const fs = require('fs');
const readline = require('readline');

const CSV_FILE = 'temp_homonyms.csv';
const TARGET_FILE = 'data/verbal.js';

async function processFile() {
    // 1. Read and Parse CSV
    const fileContent = fs.readFileSync(CSV_FILE, 'utf8');
    const lines = fileContent.split(/\r?\n/).filter(l => l.trim().length > 0);
    const headers = parseCSVLine(lines[0]);

    // Header mapping based on inspection:
    // id, question_text, pair1, pair2, option_A, option_B, option_C, option_D, option_E, answer

    const questions = [];

    for (let i = 1; i < lines.length; i++) {
        const row = parseCSVLine(lines[i]);
        if (!row || row.length < 10) continue;

        const idStr = row[0];
        const questionText = row[1];
        // pair1 = row[2]
        // pair2 = row[3]
        const options = [
            row[4], // A
            row[5], // B
            row[6], // C
            row[7], // D
            row[8]  // E
        ];
        const answerText = row[9];

        let correctLetter = null;
        const letters = ['A', 'B', 'C', 'D', 'E'];

        // Find which option matches the answer text (case-insensitive trim)
        const matchIndex = options.findIndex(opt => opt.trim().toLowerCase() === answerText.trim().toLowerCase());

        if (matchIndex !== -1) {
            correctLetter = letters[matchIndex];
        } else {
            console.warn(`Warning: Could not match answer "${answerText}" for Question ${idStr}: ${questionText}`);
            // Fallback or skip? Let's default to null or try exact match
        }

        questions.push({
            id: `Homonyms_${idStr}`,
            question: questionText,
            key: null,
            options: options.map(o => o.trim().toUpperCase()), // Standardize to uppercase options? 
            // Previous data had "PLAY", "BOLT". 
            // CSV has "hard", "rock". 
            // User request says "replace old questions", 
            // Old questions had UPPERCASE options. 
            // I should probably uppercase them for consistency.
            correctAnswer: correctLetter
        });
    }

    console.log(`Parsed ${questions.length} questions from CSV.`);

    // 2. Read Target File and Replace Line
    const targetContent = fs.readFileSync(TARGET_FILE, 'utf8');
    const targetLines = targetContent.split(/\r?\n/);

    let homonymsLineIndex = -1;
    for (let i = 0; i < targetLines.length; i++) {
        if (targetLines[i].trim().startsWith('"Homonyms":')) {
            homonymsLineIndex = i;
            break;
        }
    }

    if (homonymsLineIndex === -1) {
        console.error("Error: Could not find 'Homonyms' key in verbal.js");
        process.exit(1);
    }

    console.log(`Found Homonyms at line ${homonymsLineIndex + 1}`);

    // Construct new object structure
    // Matches: "Homonyms": { "title": "Homonyms", "questions": [...] },
    // Only keeping the JSON structure, need to be careful with trailing comma

    const newEntry = `  "Homonyms": { "title": "Homonyms", "questions": ${JSON.stringify(questions)} }` + (homonymsLineIndex < targetLines.length - 1 ? ',' : '');

    // Replace the line
    targetLines[homonymsLineIndex] = newEntry;

    // 3. Write back
    fs.writeFileSync(TARGET_FILE, targetLines.join('\n'), 'utf8');
    console.log("Successfully updated verbal.js");
}

// Simple CSV parser handling quotes
function parseCSVLine(text) {
    const result = [];
    let curValue = '';
    let inQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (inQuote) {
            if (char === '"') {
                if (i + 1 < text.length && text[i + 1] === '"') {
                    curValue += '"';
                    i++;
                } else {
                    inQuote = false;
                }
            } else {
                curValue += char;
            }
        } else {
            if (char === '"') {
                inQuote = true;
            } else if (char === ',') {
                result.push(curValue);
                curValue = '';
            } else {
                curValue += char;
            }
        }
    }
    result.push(curValue);
    return result;
}

processFile();
