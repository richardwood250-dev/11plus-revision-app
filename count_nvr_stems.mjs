import fs from 'fs';

const content = fs.readFileSync('./data/nonverbal.js', 'utf8');
const jsonMatch = content.match(/export const nonverbal = (\{[\s\S]*?\});?\s*$/);
if (!jsonMatch) {
  console.log("Could not find json in file");
  process.exit(1);
}

// remove trailing commas or simple js that might break json parse. Actually, eval is easier since it's a JS object
let nonverbal;
try {
  eval("nonverbal = " + jsonMatch[1]);
} catch (e) {
  console.log("Error evaluating:", e);
  process.exit(1);
}

for (const topic in nonverbal) {
  const questions = nonverbal[topic].questions;
  const stems = new Set();
  const stemCount = {};
  for (const q of questions) {
    if (q.image) {
      // url looks like https://.../main/Matrix_Asym_1.png or Similar
      const filename = q.image.split('/').pop(); // Matrix_Asym_1.png
      // Stem is usually everything before the last underscore and number, or just split by '_' and remove the last part if it's a number
      // But some filenames might be like "Matrix_1", others "shape_matching_22"
      // Let's use a regex to extract stem. Removing '_\d+.png' or '_\d+[a-z]?.png'
      const match = filename.match(/^(.*?)_?\d+[a-zA-Z]?\.(png|jpg|jpeg|gif)$/i);
      let stem;
      if (match) {
        stem = match[1];
      } else {
        stem = filename; // fallback
      }
      stems.add(stem);
      stemCount[stem] = (stemCount[stem] || 0) + 1;
    }
  }
  console.log(`Topic: ${topic}`);
  console.log(`  Total Questions: ${questions.length}`);
  console.log(`  Unique Stems: ${stems.size}`);
  for (const [s, count] of Object.entries(stemCount)) {
    console.log(`    ${s}: ${count} questions`);
  }
}
