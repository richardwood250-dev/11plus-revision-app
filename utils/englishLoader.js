
// utils/englishLoader.js

const BASE_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/';
const CSV_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-english/refs/heads/main/Questions%20-%20Comprehension.csv';

// Helper to shuffle array
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// Helper: Parse CSV Line
const parseCSVLine = (line) => {
    // Basic CSV parser that handles quotes
    const result = [];
    let start = 0;
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') {
            inQuotes = !inQuotes;
        } else if (line[i] === ',' && !inQuotes) {
            let val = line.substring(start, i);
            // Remove surrounding quotes if present
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            result.push(val.trim());
            start = i + 1;
        }
    }
    // Last item
    let val = line.substring(start);
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    result.push(val.trim());
    return result;
};

export const fetchEnglishQuiz = async () => {
    try {
        console.log('Fetching English CSV...');
        // 10 second timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(CSV_URL, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`CSV Fetch failed: ${response.status}`);
        const text = await response.text();

        const lines = text.split('\n').filter(l => l.trim().length > 0);
        // lines[0] is header.

        // Group by Filename (Last column)
        const fileGroups = {};

        // Skip header (index 0)
        for (let i = 1; i < lines.length; i++) {
            const cols = parseCSVLine(lines[i]);
            // Columns: Ref(0), Question(1), A(2), B(3), C(4), D(5), E(6), Correct(7), Type(8), Filename(9)
            // Note: Check column count. If Filename is missing, skip.
            if (cols.length < 10) continue;

            const filename = cols[9];
            if (!fileGroups[filename]) fileGroups[filename] = [];

            fileGroups[filename].push({
                id: cols[0],
                question: cols[1],
                options: [cols[2], cols[3], cols[4], cols[5], cols[6]].filter(o => o && o !== ''), // Filter empty options if any
                correctAnswer: cols[7].trim(), // This is the text of the answer
                type: cols[8],
                passage: filename // Keep ref
            });
        }

        // 1. Pick Random Passage
        const filenames = Object.keys(fileGroups);
        console.log(`Found ${filenames.length} unique text files in CSV.`);

        if (filenames.length === 0) throw new Error("No passage data found in CSV");

        const selectedFile = filenames[Math.floor(Math.random() * filenames.length)];
        const allQuestionsForPassage = fileGroups[selectedFile];
        console.log(`Selected Passage: ${selectedFile} with ${allQuestionsForPassage.length} questions.`);

        // 2. Fetch Passage Text
        const textUrl = BASE_URL + selectedFile;
        console.log(`Fetching Text URL: ${textUrl}`);

        const txtController = new AbortController();
        const txtTimeoutId = setTimeout(() => txtController.abort(), 10000);

        const textResponse = await fetch(textUrl, { signal: txtController.signal });
        clearTimeout(txtTimeoutId);

        if (!textResponse.ok) throw new Error(`Failed to fetch text file: ${textResponse.status}`);
        const passageText = await textResponse.text();

        // 3. Select Questions (3 of each type)
        // Types: "Retrieval", "Word Meaning", "Inference", "Word Type"
        const byType = {};
        allQuestionsForPassage.forEach(q => {
            if (!byType[q.type]) byType[q.type] = [];
            byType[q.type].push(q);
        });

        let selectedQuestions = [];
        const requiredTypes = ["Retrieval", "Word Meaning", "Inference", "Word Type"];

        requiredTypes.forEach(type => {
            const qs = byType[type] || [];
            console.log(`Type '${type}': Found ${qs.length} questions.`);
            shuffleArray(qs);
            // Take up to 3
            selectedQuestions.push(...qs.slice(0, 3));
        });

        if (selectedQuestions.length === 0) throw new Error("No questions selected after filtering.");

        console.log(`Total questions selected: ${selectedQuestions.length}`);

        // 4. Shuffle Final Selection
        shuffleArray(selectedQuestions);

        // 5. Convert Correct Answer Text to Option Letter
        selectedQuestions = selectedQuestions.map(q => {
            const correctText = q.correctAnswer;
            // Find index
            const correctIndex = q.options.findIndex(opt => opt.trim() === correctText.trim());
            const correctLetter = correctIndex >= 0 ? String.fromCharCode(65 + correctIndex) : '?';

            return {
                ...q,
                correctAnswer: correctLetter // Overwrite with 'A', 'B'...
            };
        });

        return {
            passageText: passageText,
            questions: selectedQuestions,
            config: { subject: 'English', topic: 'Comprehension' }
        };

    } catch (error) {
        console.error("Error fetching english quiz:", error);
        // Rethrow so App.js knows
        throw error;
    }
};
