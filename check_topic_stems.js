const data = require('./nonverbal_temp.cjs');

for (const [quizName, quizData] of Object.entries(data)) {
    let stems = new Set();
    for (const q of quizData.questions) {
        if (q.image) {
            let filename = q.image.split('/').pop().split('?')[0];
            let trueStem = filename.split('.')[0].replace(/_\d+$/, '');
            stems.add(trueStem);
        }
    }
    console.log(`Topic: ${quizName} -> ${stems.size} stems (${Array.from(stems).join(', ')})`);
}
