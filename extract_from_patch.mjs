import fs from 'fs';

const patch = fs.readFileSync('diff.patch', 'utf16le');
const lines = patch.split('\n');

let deletedLines = [];
let insideDiff = false;
for (const line of lines) {
  if (line.startsWith('--- a/data/nonverbal.js')) {
    insideDiff = true;
    continue;
  }
  if (line.startsWith('+++ b/data/nonverbal.js')) {
    continue;
  }
  
  if (insideDiff) {
    if (line.startsWith('@@')) {
      // continue collecting
      continue;
    }
    // we only want lines starting with '-' to reconstruct what was lost.
    if (line.startsWith('-') && !line.startsWith('--')) {
      deletedLines.push(line.substring(1));
    }
  }
}

// Convert back to string
let deletedText = deletedLines.join('\n');

// the deleted text from the patch starts at "      }," and ends somewhere.
// Let's remove any leading trailing stuff so it parses correctly.
deletedText = deletedText.replace(/\]\s*"correctAnswer"/g, '],\n        "correctAnswer"');

// find first `{` and last `}`
const firstBrace = deletedText.indexOf('{');
const lastBrace = deletedText.lastIndexOf('}');
if (firstBrace !== -1 && lastBrace !== -1) {
  deletedText = deletedText.substring(firstBrace, lastBrace + 1);
}

// wrap in array
deletedText = `[\n${deletedText}\n]`;

try {
  let missingQuestions = eval('(' + deletedText + ')');
  console.log(`Successfully parsed ${missingQuestions.length} questions from diff.`);

  const currentContent = fs.readFileSync('data/nonverbal.js', 'utf8');
  let currJsonStr = currentContent.replace(/^export const nonverbal = /, '').trim();
  if (currJsonStr.endsWith(';')) currJsonStr = currJsonStr.slice(0, -1);
  const currData = eval("(" + currJsonStr + ")");

  const currMatrices = currData.Matrices.questions;
  
  const currIds = new Set(currMatrices.map(q => q.id));
  const trulyMissing = missingQuestions.filter(q => !currIds.has(q.id));
  
  console.log(`Actually restoring ${trulyMissing.length} questions`);

  currData.Matrices.questions = [...currMatrices, ...trulyMissing];

  const newContent = `export const nonverbal = ` + JSON.stringify(currData, null, 2) + `;\n`;
  fs.writeFileSync('data/nonverbal.js', newContent);
  console.log('Restored questions successfully!');
} catch (e) {
  console.error('Failed to parse deleted text:', e.message);
  fs.writeFileSync('deleted_extracted.json', deletedText);
}
