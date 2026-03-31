const fs = require('fs');

try {
    const raw = fs.readFileSync('data/maths.js', 'utf8');
    let questions = [];
    let currentId = null, currentPrefix = null, currentDiff = null;

    let lines = raw.split('\n');
    for (let line of lines) {
        if (line.includes('"id":')) {
            const match = line.match(/"id":\s*"([^"]+)"/);
            if (match) currentId = match[1];
        }
        if (line.includes('"difficultyIndex":')) {
            const match = line.match(/\d+/);
            if (match) currentDiff = parseInt(match[0]);
        }
        if (line.includes('"prefix":')) {
            const match = line.match(/"prefix":\s*"([^"]+)"/);
            if (match) currentPrefix = match[1];
        }
        if (line.includes('},')) {
            if (currentId !== null) {
                questions.push({
                    id: currentId,
                    prefix: currentPrefix,
                    difficultyIndex: currentDiff
                });
            }
            currentId = currentPrefix = currentDiff = null;
        }
    }

    let config = { difficulty: 'easy', length: 30 };

    let filtered = questions.filter(q => q.difficultyIndex <= 25);
    console.log("Filtered easy questions count:", filtered.length);

    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    const selected = [];
    const usedKeys = new Set();

    for (const q of shuffled) {
        if (selected.length >= config.length) break;

        const key = q.prefix || (q.id ? q.id.substring(0, 6) : Math.random().toString());
        if (!usedKeys.has(key)) {
            selected.push(q);
            usedKeys.add(key);
        }
    }

    // Removed fallback loop

    console.log("Final selected count:", selected.length);
    let prefixCounts = {};
    for (let q of selected) {
        prefixCounts[q.prefix] = (prefixCounts[q.prefix] || 0) + 1;
    }

    let dupes = Object.entries(prefixCounts).filter(([k, v]) => v > 1);
    console.log("Duplicate prefixes:", dupes.length > 0 ? dupes : "None");

} catch (e) {
    console.error(e);
}
