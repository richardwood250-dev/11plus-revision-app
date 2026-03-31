const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');
const verbalCsvDir = path.join(dataDir, 'verbal_csvs');

function countInFile(filePath, regex) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return (content.match(regex) || []).length;
    }
    return 0;
}

function countLines(filePath) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        return content.trim().split(/\r?\n/).length - 1; // excluding header
    }
    return 0;
}

const stats = {};

// Count M3L specifically
stats['M3L in verbal.js'] = countInFile(path.join(dataDir, 'verbal.js'), /"id":\s*"M3L_/g);
stats['M3L in CSV'] = countLines(path.join(verbalCsvDir, 'Questions - M3L.csv'));

// Count total in JS files
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js'));
let totalJs = 0;
for (const file of files) {
    const c = countInFile(path.join(dataDir, file), /"id":\s*"/g);
    stats[`Total in ${file}`] = c;
    totalJs += c;
}
stats['Total across all JS files'] = totalJs;

console.dir(stats);
