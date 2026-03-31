import fs from 'fs';
import { execSync } from 'child_process';

const oldContent = execSync('git show e18df73c44ceff3a7f37614a3293dccf7f43ac4b^:data/nonverbal.js', { maxBuffer: 10 * 1024 * 1024 }).toString();
const currentContent = fs.readFileSync('data/nonverbal.js', 'utf8');

let oldJsonStr = oldContent.replace(/^export const nonverbal = /, '').trim();
if (oldJsonStr.endsWith(';')) oldJsonStr = oldJsonStr.slice(0, -1);
const oldData = eval("(" + oldJsonStr + ")");

let currJsonStr = currentContent.replace(/^export const nonverbal = /, '').trim();
if (currJsonStr.endsWith(';')) currJsonStr = currJsonStr.slice(0, -1);
const currData = eval("(" + currJsonStr + ")");

const oldMatrices = oldData.Matrices.questions;
const currMatrices = currData.Matrices.questions;

const currIds = new Set(currMatrices.map(q => q.id));
const missing = oldMatrices.filter(q => !currIds.has(q.id));

console.log(`Found ${missing.length} missing questions`);

if (missing.length > 0) {
  currData.Matrices.questions = [...currMatrices, ...missing];
  const newContent = `export const nonverbal = ` + JSON.stringify(currData, null, 2) + `;\n`;
  fs.writeFileSync('data/nonverbal.js', newContent);
  console.log('Restored questions successfully');
}
