const fs = require('fs');
const https = require('https');
const path = require('path');
const { parse } = require('csv-parse/sync');

const CSV_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/refs/heads/main/NV%20-%20OOO%20-%2014_2%20-%20questions_data.csv';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/main/';

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

async function importOddOneOut() {
    try {
        console.log('Fetching CSV from:', CSV_URL);
        const csvRaw = await fetchFile(CSV_URL);

        console.log('Parsing CSV data...');
        const records = parse(csvRaw, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        console.log(`Found ${records.length} records in CSV.`);

        const newQuestions = [];
        for (const record of records) {
            const id = record['ref'] || record['Ref'];
            const imageFile = record['image'] || record['Image'];
            const correctAnswer = record['correct answer'] || record['Correct Answer'] || record['Answer'] || record['answer'];
            const explanation = record['explanation'] || record['Explanation'];

            if (!id || !imageFile) {
                console.warn('Skipping record with missing id or image:', record);
                continue;
            }

            newQuestions.push({
                id: id,
                question: 'Which figure is the odd one out?',
                image: IMAGE_BASE_URL + encodeURIComponent(imageFile),
                options: ['A', 'B', 'C', 'D', 'E'],
                correctAnswer: correctAnswer,
                explanation: explanation
            });
        }

        console.log(`Constructed ${newQuestions.length} new question objects.`);

        const filePath = path.join(__dirname, '../data/nonverbal.js');
        console.log(`Reading from ${filePath}...`);

        let content = fs.readFileSync(filePath, 'utf8');

        const startMarker = 'export const nonverbal = ';
        const startIndex = content.indexOf(startMarker);

        if (startIndex === -1) {
            console.error('Could not find start marker in nonverbal.js');
            process.exit(1);
        }

        const jsonStr = content.substring(startIndex + startMarker.length).trim().replace(/;$/, '');

        let nonverbal;
        try {
            nonverbal = JSON.parse(jsonStr);
        } catch (e) {
            console.log('Falling back to eval for parsing...');
            nonverbal = eval(`(${jsonStr})`);
        }

        // Find existing Odd One Out category
        const oooKey = Object.keys(nonverbal).find(k => k.toLowerCase() === 'odd one out' || k.toLowerCase() === 'odd_one_out');

        if (!oooKey || !nonverbal[oooKey]) {
            console.error('Could not find Odd One Out category in nonverbal data.');
            process.exit(1);
        }

        const targetCategory = nonverbal[oooKey];
        const existingCount = targetCategory.questions.length;
        console.log(`Original "Odd One Out" count: ${existingCount}`);

        // Check for duplicates before appending
        let addedCount = 0;
        const existingIds = new Set(targetCategory.questions.map(q => q.id));

        for (const q of newQuestions) {
            if (!existingIds.has(q.id)) {
                targetCategory.questions.push(q);
                existingIds.add(q.id);
                addedCount++;
            } else {
                // Determine if we should replace or just skip. Let's skip duplicates to be safe, or we can replace them.
                // It's safer to check if explanation was updated and replace if so, but for now we skip.
                console.log(`ID ${q.id} already exists, skipping... (or you can modify script to replace)`);
            }
        }

        console.log(`Added ${addedCount} new questions.`);
        console.log(`New "Odd One Out" count: ${targetCategory.questions.length}`);

        // Write back
        const newContent = `${startMarker}${JSON.stringify(nonverbal, null, 2)};`;
        fs.writeFileSync(filePath, newContent, 'utf8');

        console.log('Successfully updated data/nonverbal.js!');

    } catch (err) {
        console.error('Error importing:', err);
    }
}

importOddOneOut();
