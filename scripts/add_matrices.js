const fs = require('fs');
const path = require('path');

const csvUrl = "https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/refs/heads/main/NV%20matrices%203-11%20-%20Sheet1.csv";
const jsFilePath = path.join(__dirname, '..', 'data', 'nonverbal.js');

async function run() {
    console.log("Fetching CSV...");
    const res = await fetch(csvUrl);
    const text = await res.text();
    
    const lines = text.split('\n').filter(l => l.trim() !== '');
    lines.shift(); // remove header
    
    const newQuestions = lines.map(line => {
        const parts = line.split(',');
        return {
            id: parts[0].trim().replace(/\s+/g, '_'), // NV_mat_0001
            question: "Which option completes the matrix?",
            image: `https://raw.githubusercontent.com/richardwood250-dev/11plus-nonverbal/main/${parts[1].trim()}`,
            options: ["A", "B", "C", "D", "E"],
            correctAnswer: parts[2].trim()
        };
    });
    console.log("Parsed " + newQuestions.length + " new questions.");

    // Read current JS file
    let content = fs.readFileSync(jsFilePath, 'utf-8');
    
    // Convert to CommonJS to load it
    const tempPath = path.join(__dirname, '..', 'data', 'temp_nv.js');
    fs.writeFileSync(tempPath, content.replace('export const nonverbal =', 'module.exports ='), 'utf-8');
    
    // Load as object
    const nvObj = require(tempPath);
    
    if(!nvObj["Matrices"]) {
        nvObj["Matrices"] = { title: "Matrices", questions: [] };
    }
    
    // Find the max ID to avoid duplicates (if we want, or just append)
    // The user said "Please add these to the current question bank for matrices"
    const existingIds = new Set(nvObj["Matrices"].questions.map(q => q.id));
    
    let added = 0;
    for (const q of newQuestions) {
        if (!existingIds.has(q.id)) {
            nvObj["Matrices"].questions.push(q);
            added++;
        }
    }
    
    console.log("Added " + added + " questions to Matrices.");

    // Stringify and write back formatting exactly as needed
    const newContent = "export const nonverbal = " + JSON.stringify(nvObj, null, 2) + ";\n";
    fs.writeFileSync(jsFilePath, newContent, 'utf-8');
    
    // Cleanup
    fs.unlinkSync(tempPath);
    console.log("Done.");
}

run().catch(console.error);
