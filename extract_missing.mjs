import fs from 'fs';

let oldContent;
try {
  oldContent = fs.readFileSync('old_nonverbal.js', 'utf8');
  if (oldContent.includes('\0')) {
    oldContent = fs.readFileSync('old_nonverbal.js', 'utf16le');
  }
} catch (e) {
  oldContent = fs.readFileSync('old_nonverbal.js', 'utf16le');
}

// Fix missing commas before parsing
oldContent = oldContent.replace(/\]\s*"correctAnswer"/g, '],\n        "correctAnswer"');

// Strip BOM and "export const nonverbal = "
let oldJsonStr = oldContent.replace(/^[\s\S]*?export const nonverbal = /, '').trim();
if (oldJsonStr.endsWith(';')) oldJsonStr = oldJsonStr.slice(0, -1);

let oldData;
try {
  oldData = eval("(" + oldJsonStr + ")");
} catch (e) {
  console.error("Syntax fix didn't work:", e.message);
  process.exit(1);
}

const currentContent = fs.readFileSync('data/nonverbal.js', 'utf8');
let currJsonStr = currentContent.replace(/^[\s\S]*?export const nonverbal = /, '').trim();
if (currJsonStr.endsWith(';')) currJsonStr = currJsonStr.slice(0, -1);
const currData = eval("(" + currJsonStr + ")");

const oldMatrices = oldData.Matrices.questions;
const currMatrices = currData.Matrices.questions;

// Find questions in oldMatrices not in currMatrices
const currIds = new Set(currMatrices.map(q => q.id));
const missing = oldMatrices.filter(q => !currIds.has(q.id));

console.log(`Found ${missing.length} missing questions in old commit`);

if (missing.length > 0) {
  currData.Matrices.questions = [...currMatrices, ...missing];
  const newContent = `export const nonverbal = ` + JSON.stringify(currData, null, 2) + `;\n`;
  fs.writeFileSync('data/nonverbal.js', newContent);
  console.log(`Restored ${missing.length} missing questions successfully!`);
}
