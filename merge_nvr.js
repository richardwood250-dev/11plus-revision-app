const fs = require('fs');
const path = require('path');

async function mergeNVR() {
    const filePath = path.join(__dirname, 'data/nonverbal.js');
    console.log(`Reading from ${filePath}...`);

    let content = fs.readFileSync(filePath, 'utf8');

    // Extract the object part
    // The file format is `export const nonverbal = { ... };`
    // We need to be careful with eval/parsing.
    // Since it's a simple export, we can try to evaluate it in a clean context or regex parse it.
    // Given the size, regex might be safer to just extract the two parts and merge, 
    // but the nested structure makes regex hard.

    // Best approach: Load it as a module if possible, or strip the export and JSON.parse (if it's valid JSON-ish).
    // It's likely JS object literal, possibly with comments or unquoted keys (though keys looked quoted in view).
    // Let's try to strip the prefix and suffix and JSON.parse, hoping it's valid JSON.
    // "export const nonverbal = " length is 24.

    const startMarker = 'export const nonverbal = ';
    const startIndex = content.indexOf(startMarker);

    if (startIndex === -1) {
        console.error('Could not find start marker');
        process.exit(1);
    }

    const jsonStr = content.substring(startIndex + startMarker.length).trim().replace(/;$/, '');

    let nonverbal;
    try {
        nonverbal = JSON.parse(jsonStr);
    } catch (e) {
        console.error('Failed to parse JSON directly. It might contain JS specific syntax (comments, unquoted keys).');
        console.error(e.message);
        // Fallback: use eval (safe-ish here as we trust the content we just wrote)
        nonverbal = eval(`(${jsonStr})`);
    }

    if (!nonverbal['Odd_One_Out'] || !nonverbal['Odd One Out']) {
        console.error('Could not find both Odd One Out sections');
        if (nonverbal['Odd One Out']) console.log('Found "Odd One Out"');
        if (nonverbal['Odd_One_Out']) console.log('Found "Odd_One_Out"');
        process.exit(1);
    }

    const target = nonverbal['Odd One Out'];
    const source = nonverbal['Odd_One_Out'];

    console.log(`Original "Odd One Out" count: ${target.questions.length}`);
    console.log(`Merging "Odd_One_Out" count: ${source.questions.length}`);

    target.questions = target.questions.concat(source.questions);

    console.log(`New "Odd One Out" count: ${target.questions.length}`);

    delete nonverbal['Odd_One_Out'];

    // Validate uniqueness
    const ids = new Set();
    const duplicates = [];
    target.questions.forEach(q => {
        if (ids.has(q.id)) duplicates.push(q.id);
        ids.add(q.id);
    });

    if (duplicates.length > 0) {
        console.warn(`Warning: Found ${duplicates.length} duplicate IDs (e.g., ${duplicates[0]})`);
    } else {
        console.log('No duplicate IDs found.');
    }

    // Write back
    // Use JSON.stringify with indent 2
    const newContent = `${startMarker}${JSON.stringify(nonverbal, null, 2)};`;

    // Backup first
    fs.copyFileSync(filePath, filePath + '.bak');
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Successfully merged and saved.');
}

mergeNVR().catch(err => console.error(err));
