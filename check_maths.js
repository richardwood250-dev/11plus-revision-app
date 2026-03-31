const fs = require('fs');
try {
    const raw = fs.readFileSync('data/maths.js', 'utf8');
    // It failed with utf8 in view_file, but what if we just extract lines starting with "prefix": " and "difficultyIndex":?
    const lines = raw.split('\n');
    let difficulties = { easy: new Set(), medium: new Set(), hard: new Set() };
    let currentDiff = null;
    let easyCount = 0, mediumCount = 0, hardCount = 0;

    for (let line of lines) {
        if (line.includes('"difficultyIndex"')) {
            const match = line.match(/\d+/);
            if (match) {
                const diff = parseInt(match[0]);
                if (diff <= 25) currentDiff = 'easy';
                else if (diff <= 38) currentDiff = 'medium';
                else currentDiff = 'hard';
            }
        }
        if (line.includes('"prefix"')) {
            const match = line.match(/"prefix":\s*"([^"]+)"/);
            if (match && currentDiff) {
                difficulties[currentDiff].add(match[1]);
                if (currentDiff === 'easy') easyCount++;
                else if (currentDiff === 'medium') mediumCount++;
                else hardCount++;
            }
        }
    }
    console.log("Unique Easy prefixes:", difficulties.easy.size, "Total variations:", easyCount);
    console.log("Unique Medium prefixes:", difficulties.medium.size, "Total variations:", mediumCount);
    console.log("Unique Hard prefixes:", difficulties.hard.size, "Total variations:", hardCount);
    console.log("Total unique:", difficulties.easy.size + difficulties.medium.size + difficulties.hard.size);
} catch (e) {
    console.error("Error reading as utf8, reading as utf16le...");
    const raw = fs.readFileSync('data/maths.js', 'utf16le');
    // same logic
    const lines = raw.split('\n');
    let difficulties = { easy: new Set(), medium: new Set(), hard: new Set() };
    let currentDiff = null;
    let easyCount = 0, mediumCount = 0, hardCount = 0;

    for (let line of lines) {
        if (line.includes('"difficultyIndex"')) {
            const match = line.match(/\d+/);
            if (match) {
                const diff = parseInt(match[0]);
                if (diff <= 25) currentDiff = 'easy';
                else if (diff <= 38) currentDiff = 'medium';
                else currentDiff = 'hard';
            }
        }
        if (line.includes('"prefix"')) {
            const match = line.match(/"prefix":\s*"([^"]+)"/);
            if (match && currentDiff) {
                difficulties[currentDiff].add(match[1]);
                if (currentDiff === 'easy') easyCount++;
                else if (currentDiff === 'medium') mediumCount++;
                else hardCount++;
            }
        }
    }
    console.log("UTF16LE - Unique Easy prefixes:", difficulties.easy.size, "Total variations:", easyCount);
    console.log("UTF16LE - Unique Medium prefixes:", difficulties.medium.size, "Total variations:", mediumCount);
    console.log("UTF16LE - Unique Hard prefixes:", difficulties.hard.size, "Total variations:", hardCount);
}
