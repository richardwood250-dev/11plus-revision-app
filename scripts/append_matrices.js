import fs from 'fs';
import https from 'https';

const csvUrl = 'https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/refs/heads/main/Maths%20questions%205-2%20-%20NV%20matrices%201-3.csv';
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

const run = async () => {
    try {
        console.log('Fetching CSV...');
        const csvData = await fetchFile(csvUrl);

        console.log('Importing data/nonverbal.js...');
        // We can just import it dynamically using absolute path or relative
        const { nonverbal } = await import('../data/nonverbal.js');

        const matrices = nonverbal['Matrices'].questions;

        // Find highest ID
        let maxId = 0;
        for (const q of matrices) {
            if (q.id && q.id.startsWith('nv_mat_')) {
                const num = parseInt(q.id.replace('nv_mat_', ''), 10);
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            }
        }

        console.log(`Current max ID for Matrices: nv_mat_${maxId}`);

        const lines = csvData.split(/\r?\n/).filter(l => l.trim() !== '');
        let appendCount = 0;

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',');
            if (cols.length < 3) continue;

            // Format: Question,Filename,Answer
            const imageFile = cols[1].trim();
            const answer = cols[2].trim();

            if (!imageFile || !answer) continue;

            maxId++;
            // Pad ID
            const newId = `nv_mat_${maxId.toString().padStart(3, '0')}`;

            matrices.push({
                id: newId,
                question: 'Which option completes the matrix?',
                image: IMAGE_BASE_URL + encodeURIComponent(imageFile),
                options: ['A', 'B', 'C', 'D', 'E'],
                correctAnswer: answer
            });
            appendCount++;
        }

        console.log(`Appended ${appendCount} new questions.`);

        const newJsText = `export const nonverbal = ${JSON.stringify(nonverbal, null, 4)};\n`;
        fs.writeFileSync('./data/nonverbal.js', newJsText);
        console.log('Successfully updated data/nonverbal.js');
    } catch (e) {
        console.error('Error:', e);
    }
};

run();
