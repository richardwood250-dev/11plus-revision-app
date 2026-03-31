const fs = require('fs');

async function main() {
  console.log('Reading data files...');
  const verbalContent = fs.readFileSync('data/verbal.js', 'utf8');
  const nvContent = fs.readFileSync('data/nonverbal.js', 'utf8');

  // Parse VERBAL
  let verbalJsonStr = verbalContent.replace('export const VERBAL_QUIZ = ', '');
  let vSemiIdx = verbalJsonStr.lastIndexOf(';');
  if (vSemiIdx > -1) {
    verbalJsonStr = verbalJsonStr.substring(0, vSemiIdx);
  }
  let verbalData = JSON.parse(verbalJsonStr);

  // Parse NONVERBAL
  let nvJsonStr = nvContent.replace('export const nonverbal = ', '');
  let nvSemiIdx = nvJsonStr.lastIndexOf(';');
  if (nvSemiIdx > -1) {
    nvJsonStr = nvJsonStr.substring(0, nvSemiIdx);
  }
  let nvData = JSON.parse(nvJsonStr);

  console.log('Removing flagged verbal questions...');
  verbalData.M3L.questions = verbalData.M3L.questions.filter(q => q.id !== 'M3L_360');
  verbalData.Move_a_letter.questions = verbalData.Move_a_letter.questions.filter(q => q.id !== 'Move_a_letter_271' && q.id !== 'Move_a_letter_106');

  console.log('Reading CSV...');
  const csvRes = await fetch('https://raw.githubusercontent.com/richardwood250-dev/11plus-verbal/refs/heads/main/Questions%20-%20Odd%202%20out.csv');
  const csvText = await csvRes.text();
  const lines = csvText.split('\n').filter(l => l.trim().length > 0);
  
  const parseRow = (str) => {
    let result = [], current = '', inQ = false;
    for(let char of str) {
      if (char === '"') inQ = !inQ;
      else if (char === ',' && !inQ) { result.push(current.trim().replace(/^"|"$/g, '')); current = ''; }
      else current += char;
    }
    result.push(current.trim().replace(/^"|"$/g, ''));
    return result;
  };

  const newOdd2OutQuestions = [];
  // Skip header, assuming header is line 0
  let startIndex = lines[0].includes('question') ? 1 : 0;
  for (let i = startIndex; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (cols.length < 8) continue;
    
    // id, question, OptionA, OptionB, OptionC, OptionD, OptionE, Correct Answer, Explanation
    const id = cols[0];
    const qText = cols[1];
    const optionA = cols[2];
    const optionB = cols[3];
    const optionC = cols[4];
    const optionD = cols[5];
    const optionE = cols[6];
    const correctAnswer = cols[7];
    
    newOdd2OutQuestions.push({
      id: "Odd_2_out_" + id,
      question: qText,
      key: null,
      options: [optionA, optionB, optionC, optionD, optionE],
      correctAnswer: correctAnswer
    });
  }

  console.log('Replacing Odd 2 Out questions. Count:', newOdd2OutQuestions.length);
  if (verbalData.Odd_2_out) {
    verbalData.Odd_2_out.questions = newOdd2OutQuestions;
  } else {
    console.log('Odd 2 out missing?');
  }

  console.log('Removing NV_Q_195...');
  for (let topic in nvData) {
    if (nvData[topic] && Array.isArray(nvData[topic].questions)) {
      nvData[topic].questions = nvData[topic].questions.filter(q => q.id !== 'NV_Q_195');
    } else if (nvData[topic] && Array.isArray(nvData[topic])) {
      nvData[topic] = nvData[topic].filter(q => q.id !== 'NV_Q_195');
    }
  }

  // Save Files
  console.log('Writing modified data back to disk...');
  fs.writeFileSync('data/verbal.js', 'export const VERBAL_QUIZ = ' + JSON.stringify(verbalData, null, 0) + ';\n', 'utf8');
  fs.writeFileSync('data/nonverbal.js', 'export const nonverbal = ' + JSON.stringify(nvData, null, 2) + ';\n', 'utf8');

  console.log('Data successfully updated.');
}

main().catch(console.error);
