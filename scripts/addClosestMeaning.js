const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CSV_FILE = path.join(__dirname, '../temp_closest_meaning.csv');
const TARGET_FILE = path.join(__dirname, '../data/verbal.js');

async function processFile() {
    const fileStream = fs.createReadStream(CSV_FILE);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const questions = [];
    let idCounter = 1;

    for await (const line of rl) {
        // Simple CSV parser handling quoted strings
        const regex = /(?:^|,)(?:"([^"]*)"|([^",]*))/g;
        let matches = [];
        let match;
        while ((match = regex.exec(line)) !== null) {
            // match[1] is quoted content, match[2] is unquoted
            matches.push(match[1] || match[2]);
        }

        // Cleanup Matches: existing regex might capture empty strings or undefined
        // Let's use a simpler split if no internal commas, but the Question has commas inside.
        // Actually, let's use a standard CSV regex logic or library logic simulation.

        // Proper CSV split logic
        const row = [];
        let current = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuote = !inQuote;
            } else if (char === ',' && !inQuote) {
                row.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        row.push(current);

        if (row.length < 7) continue; // Skip malformed lines

        const questionText = row[0].replace(/^"|"$/g, ''); // Remove surrounding quotes if manual parse failed to
        const opts = row.slice(1, 6);
        const correctText = row[6].trim();

        // Find Correct Option Index
        let correctIndex = opts.findIndex(o => o.trim() === correctText);
        if (correctIndex === -1) {
            console.warn(`Warning: Correct answer "${correctText}" not found in options for Q${idCounter}.`);
            continue;
        }

        const letter = String.fromCharCode(65 + correctIndex); // 0->A, 1->B...

        questions.push({
            id: `Closest_meaning_${idCounter++}`,
            question: questionText,
            key: null,
            options: opts.map(o => o.trim()),
            correctAnswer: letter
        });
    }

    const newQuizData = {
        title: "Closest meaning",
        questions: questions
    };

    // Read existing file
    let content = fs.readFileSync(TARGET_FILE, 'utf8');

    // Find the end of the object to insert before
    const lastBraceIndex = content.lastIndexOf('}');
    if (lastBraceIndex === -1) {
        throw new Error("Could not find closing brace in verbal.js");
    }

    // Prepare string to insert
    const insertString = `,\n  "Closest_meaning": ${JSON.stringify(newQuizData, null, 2)}`;

    // Reconstruct file content
    // Warning: last brace is closing the object. We need to insert before it.
    // Also ensuring comma from previous item.
    // The previous item might forbid a leading comma if we just append?
    // Actually, simply appending `,\n "Key": ...` before the last `}` works if the list isn't empty.

    // Check if there is a trailing comma or need to add one? 
    // JSON doesn't mind trailing commas in some versions, but JS objects do or don't depending on strictness.
    // However, usually `VERBAL_QUIZ = { ... }`.
    // We should be safe appending `, "Key": ...` 

    const newContent = content.substring(0, lastBraceIndex) + insertString + "\n" + content.substring(lastBraceIndex);

    fs.writeFileSync(TARGET_FILE, newContent);
    console.log(`Successfully added ${questions.length} questions to Closest_meaning.`);
}

processFile().catch(console.error);
