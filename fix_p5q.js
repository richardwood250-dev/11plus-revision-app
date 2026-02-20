const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'data', 'maths.js');
let jsContent = fs.readFileSync(jsPath, 'utf8');

// Replace relative P5Q images with absolute URLs
// Example: "image": "P5Q3_1.png" -> "image": "https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/P5Q3_1.png"
const regex = /"image":\s*"([^"]+)"/g;
let fixCount = 0;

jsContent = jsContent.replace(regex, (match, imagePath) => {
    if (imagePath.startsWith('P5Q') && !imagePath.startsWith('http')) {
        fixCount++;
        return `"image": "https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/${imagePath}"`;
    }
    return match;
});

if (fixCount > 0) {
    fs.writeFileSync(jsPath, jsContent, 'utf8');
    console.log(`Fixed ${fixCount} relative image paths in maths.js`);
} else {
    console.log('No P5Q relative image paths found in maths.js');
}

// Check CSV as well just in case they are there, though we didn't see them earlier
const csvPath = path.join(__dirname, 'data', 'maths.csv');
if (fs.existsSync(csvPath)) {
    let csvContent = fs.readFileSync(csvPath, 'utf8');
    let csvCount = 0;

    // In CSV, it's just P5Q3_1.png in some column
    // The previous column is question text which might end in ? or a letter or whatever. 
    // And next column is option 1.
    // We can do a simple string replace for P5Q
    csvContent = csvContent.replace(/,P5Q(\d+_[0-9]+)\.png,/g, (match, id) => {
        csvCount++;
        return `,https://raw.githubusercontent.com/richardwood250-dev/11plus-maths/main/P5Q${id}.png,`;
    });

    if (csvCount > 0) {
        fs.writeFileSync(csvPath, csvContent, 'utf8');
        console.log(`Fixed ${csvCount} relative image paths in maths.csv`);
    } else {
        console.log('No P5Q relative image paths found in maths.csv');
    }
}
