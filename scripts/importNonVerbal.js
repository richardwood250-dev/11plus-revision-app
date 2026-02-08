const fs = require('fs');
const https = require('https');

const BASE_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/main/';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/main/';

const FILES = [
    { name: 'Matrices', file: 'Questions - NV Matrices.csv', idPrefix: 'nv_mat' },
    { name: 'Sequences', file: 'Questions - NV Sequences.csv', idPrefix: 'nv_seq' },
    { name: 'Odd One Out', file: 'Questions - NV odd one out.csv', idPrefix: 'nv_odd' },
    { name: 'Horizontal Code', file: 'Questions - NV Horizontal code.csv', idPrefix: 'nv_hor_code' },
    { name: 'Figure Analogies', file: 'Questions - NV Figure analogies.csv', idPrefix: 'nv_fig_anal' }
];

const fetchFile = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
            res.on('error', reject);
        });
    });
};

const parseCSV = (csvText, topic) => {
    const lines = csvText.split(/\r?\n/).filter(l => l.trim() !== '');
    // Headers are at lines[0], usually.

    const questions = [];
    for (let i = 1; i < lines.length; i++) {
        // Simple split by comma. Note: If fields contain commas, this breaks. 
        // But the sample data looks clean (no commas in values).
        const cols = lines[i].split(',');

        // Basic Validation
        if (cols.length < 3) continue;

        const id = cols[0].trim();
        const imageFile = cols[1].trim();

        if (!id || !imageFile) continue;
        if (id === 'nv_seq_585' || id === 'hc_83' || id === 'nv_seq_311' || id === 'hc_491' || id === 'nv_mat_383') continue; // User requested delete

        let options = ['A', 'B', 'C', 'D', 'E'];
        let answer = '';

        if (topic.name === 'Horizontal Code') {
            // Format: ID, Image, OptA, OptB, OptC, OptD, OptE, Answer, Logic
            // Indices: 0, 1, 2, 3, 4, 5, 6, 7, 8
            if (cols.length >= 8) {
                options = [
                    cols[2].trim(),
                    cols[3].trim(),
                    cols[4].trim(),
                    cols[5].trim(),
                    cols[6].trim()
                ];
                // The CSV has the *value* as the answer (e.g., "JF"). 
                // We need to convert this to the LETTER (A, B, C...) for the app logic to work.
                const valAnswer = cols[7].trim();
                const ansIndex = options.indexOf(valAnswer);
                if (ansIndex !== -1) {
                    answer = String.fromCharCode(65 + ansIndex); // 0->A, 1->B...
                } else {
                    console.warn(`Answer ${valAnswer} not found in options for ${id}`);
                    answer = valAnswer; // Fallback, though likely broken logic
                }
            } else {
                // Fallback or skip?
                console.warn(`Skipping malformed row in ${topic.name}: ${lines[i]}`);
                continue;
            }
        } else {
            // Standard Format: ID, Image, Answer (at col 2?)
            // Based on previous code: answer = cols[2]
            answer = cols[2].trim();
        }

        questions.push({
            id: id,
            // Question text is generic for NV usually
            question: getQuestionText(topic.name),
            image: IMAGE_BASE_URL + encodeURIComponent(imageFile),
            options: options,
            correctAnswer: answer
        });
    }
    return questions;
};

const getQuestionText = (topicName) => {
    switch (topicName) {
        case 'Matrices': return 'Which option completes the matrix?';
        case 'Sequences': return 'Which option completes the sequence?';
        case 'Odd One Out': return 'Which figure is the odd one out?';
        case 'Horizontal Code': return 'Which code matches the test shape?';
        case 'Figure Analogies': return 'Which option completes the second pair?';
        default: return 'Select the correct option.';
    }
};

const run = async () => {
    const output = {};

    for (const file of FILES) {
        console.log(`Fetching ${file.name}...`);
        try {
            const raw = await fetchFile(BASE_URL + encodeURIComponent(file.file));
            const questions = parseCSV(raw, file);
            output[file.name] = {
                title: file.name,
                questions: questions
            };
            console.log(`Parsed ${questions.length} questions for ${file.name}`);
        } catch (e) {
            console.error(`Error fetching ${file.name}:`, e.message);
        }
    }

    const fileContent = `export const nonverbal = ${JSON.stringify(output, null, 2)};`;
    fs.writeFileSync('data/nonverbal.js', fileContent);
    console.log('Done! Generated data/nonverbal.js');
};

run();
