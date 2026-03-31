const fs = require('fs');

const path = require('path');

// Read and convert to CommonJS
const rootDir = process.cwd();
const nvrDataPath = path.join(rootDir, 'data', 'nonverbal.js');
const tempFilePath = path.join(rootDir, 'nonverbal_temp.cjs');

let content = fs.readFileSync(nvrDataPath, 'utf8');
content = content.replace(/export const nonverbal = /, 'module.exports = ');
fs.writeFileSync(tempFilePath, content);

const nonverbal = require(tempFilePath);

const breakdown = {};
let totalQuestions = 0;
const allUniqueStems = new Set();

for (const [category, data] of Object.entries(nonverbal)) {
    if (!data.questions) continue;
    
    const categoryStems = new Set();
    let categoryQuestions = 0;
    
    data.questions.forEach(q => {
        categoryQuestions++;
        totalQuestions++;
        
        if (q.image) {
            let filename = q.image.split('/').pop().split('?')[0];
            let stem = filename.split('.')[0].replace(/_\d+$/, '');
            categoryStems.add(stem);
            allUniqueStems.add(stem);
        }
    });
    
    breakdown[category] = {
        totalQuestions: categoryQuestions,
        uniqueStems: categoryStems.size
    };
}

console.log('# NVR Question Breakdown by Image Stem\n');
console.log('| Category | Questions | Unique Stems |');
console.log('| :--- | :---: | :---: |');

for (const [category, stats] of Object.entries(breakdown)) {
    console.log(`| ${category} | ${stats.totalQuestions} | ${stats.uniqueStems} |`);
}

console.log(`| **Total** | **${totalQuestions}** | **${allUniqueStems.size}** |`);

// Cleanup
fs.unlinkSync(tempFilePath);
