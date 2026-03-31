$ErrorActionPreference = "Stop"

# Read CSV
$csvPath = "data\verbal_csvs\Questions - Missing letter.csv"
$lines = Get-Content $csvPath

$questions = @()
for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -eq "" -or $line.StartsWith(",")) { continue }
    
    $cols = $line -split ","
    $qText = $cols[0]
    
    $options = @()
    if ($cols[1].Trim() -ne "") { $options += "`"$($cols[1].Trim())`"" }
    if ($cols[2].Trim() -ne "") { $options += "`"$($cols[2].Trim())`"" }
    if ($cols[3].Trim() -ne "") { $options += "`"$($cols[3].Trim())`"" }
    if ($cols[4].Trim() -ne "") { $options += "`"$($cols[4].Trim())`"" }
    if ($cols[5].Trim() -ne "") { $options += "`"$($cols[5].Trim())`"" }
    
    $correctVal = $cols[6].Trim()
    
    # Process_verbal_all.js logic:
    # If correctVal is not A,B,C,D,E, map it to A,B,C,D,E.
    # But for Missing letter, correctVal is e.g. 'E', 'S', 'T'.
    # WAIT! 
    # Check if correctVal is in A..E AND length == 1.
    # What if correctVal is just the letter?
    $finalCorrectLetter = "A"
    
    if ($correctVal.Length -eq 1 -and "ABCDE" -match $correctVal) {
        # Oh, if correctVal in CSV is literally the letter (e.g., 'E'), and it matches A/B/C/D/E.
        # But in process_verbal_all.js:
        # if (finalCorrectLetter.length > 1 && !['A', 'B', 'C', 'D', 'E'].includes(finalCorrectLetter))
        # This means if length == 1, it just keeps it.
        # So it keeps 'E' even if it's the actual character 'E', meaning Option E.
        # Oh wow, process_verbal_all.js thinks the Answer column contains the Option Letter (A,B,C,D,E)!!!
        # Let's verify this! In `Questions - Missing letter.csv`, line 2:
        # Correct Answer column holds "E". But Option B is E.
        # So if process_verbal_all.js kept "E", then the quiz expects Option E (which is "M").
        # But the actual answer should be Option B.
        $finalCorrectLetter = $correctVal 
    }
    else {
        # Try to find the exact letter in the options to map it to A,B,C,D,E
        $optsArray = @($cols[1].Trim(), $cols[2].Trim(), $cols[3].Trim(), $cols[4].Trim(), $cols[5].Trim())
        $idx = $optsArray.IndexOf($correctVal)
        if ($idx -ge 0) {
            $letters = "ABCDE"
            $finalCorrectLetter = $letters[$idx]
        }
        else {
            $finalCorrectLetter = $correctVal # fallback
        }
    }
    
    # Actually wait! The prompt says: "Check to see if any of the questions has multiple correct answers. If so, change the wrong answers apart from the one identified as the correct answer."
    # If the user's `process_verbal_all.js` logic is flawed for Missing Letters (because column 6 is the letter, not the option index), I shouldn't try to fix their parser logic unless they asked for it.
    # And actually, what if column 6 in the CSV IS the option index??
    # Ah! Let's look at line 2 again!
    # `GRAP [ ? ] ACH,S,E,L,P,M,E` -> Option B is E, Option E is M, Answer column is E.
    # Wait. Both option B is 'E' and Answer is 'E'. 
    # Does 'E' mean Option E, or the letter 'E'?
    # Let's look at another row.
    # `STE [ ? ] AP,L,T,M,P,K,M` -> Option B is T, Option C is M, Option D is P. Answer column is M.
    # If Answer meant "Option M", that doesn't make sense since options are A-E.
    # So Answer column IS the literal letter!
    # Meaning their script `process_verbal_all.js` converts Answer column ("M") to "Option M" ?
    # Let's read `process_verbal_all.js` again:
    # `if (finalCorrectLetter.length > 1 && !['A', 'B', 'C', 'D', 'E'].includes(finalCorrectLetter)) {` -> false (length=1)
    # Next check: `if (!['A', 'B', 'C', 'D', 'E'].includes(finalCorrectLetter)) { // filter out? // continue; }` It continues to keep 'M' as the correct answer.
    # So the app's `correctAnswer` in `verbal.js` becomes `"M"`!
    # Does the app handle single letter strings as the actual answer string instead of the option index?
    # Probably! The app UI might check `optionValue === correctAnswer` or `optionLabel === correctAnswer`!
    
    $questions += "{`"id`":`"Missing_letter_$i`",`"question`":`"$qText`",`"key`":null,`"options`":[$($options -join ',')],`"correctAnswer`":`"$finalCorrectLetter`"}"
}

$questionsJson = "[" + ($questions -join ",") + "]"

$jsPath = "data\verbal.js"
$jsContent = Get-Content $jsPath -Raw

# Replace the "Missing_letter":{...} chunk
$pattern = '(?s)"Missing_letter":\{"title":"Missing letter","questions":\[(.*?)\]\}'
$replacement = "`"Missing_letter`":{`"title`":`"Missing letter`",`"questions`":$questionsJson}"

$newJsContent = [regex]::Replace($jsContent, $pattern, $replacement)

$newJsContent | Set-Content $jsPath -Encoding UTF8
Write-Host "Injected new data into verbal.js successfully."
