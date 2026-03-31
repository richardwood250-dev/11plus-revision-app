const fs = require('fs');
const dataStr = fs.readFileSync('data/verbal.js', 'utf8');
const dataObj = dataStr.match(/export const VERBAL_QUIZ = (\{.*\});/);
if (dataObj) {
    const quiz = JSON.parse(dataObj[1]);
    console.log(Object.keys(quiz));
}
