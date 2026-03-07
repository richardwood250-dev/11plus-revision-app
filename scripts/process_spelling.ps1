$ErrorActionPreference = "Stop"

$csvPath = "spelling_raw.csv"
$jsPath = "..\data\spelling.js"

$rows = Import-Csv -Path $csvPath

$finalQuestions = @()
$currentSetQuestions = @()
$SET_SIZE = 12
$setIndex = 1

foreach ($row in $rows) {
    if (-not $row.QuestionID) { continue }

    $qId = $row.QuestionID
    $parts = @($row.PartA, $row.PartB, $row.PartC, $row.PartD)
    $correctRaw = $row.CorrectAnswer.Trim().ToUpper()
    $explanation = $row.Explanation

    $autoAnswer = $correctRaw

    # Auto-correct the answer if Explanation points to a specific misspelled word
    if ($explanation -match "Error: '([^']+)'" -or $explanation -match "Error: `"([^`"]+)`"") {
        $wrongWord = $matches[1]
        
        # Regex to find the word as a whole word, ignoring case
        $pattern = "\b" + [regex]::Escape($wrongWord) + "(?:'s)?\b"
        
        # Sometimes words have punctuation attached, or the regex \b doesn't perfectly match
        # Let's do a more robust check: does the part contain the word (case-insensitive) 
        # as a distinct token? Just doing a raw contains might match substrings, but let's try regex first.
        
        $expectedAnswer = ""
        if ($parts[0] -match $pattern) { $expectedAnswer = "A" }
        elseif ($parts[1] -match $pattern) { $expectedAnswer = "B" }
        elseif ($parts[2] -match $pattern) { $expectedAnswer = "C" }
        elseif ($parts[3] -match $pattern) { $expectedAnswer = "D" }
        
        # Fallback if regex \b fails due to punctuation
        if ($expectedAnswer -eq "") {
            $wordLower = $wrongWord.ToLower()
            if ($parts[0].ToLower().Contains($wordLower)) { $expectedAnswer = "A" }
            elseif ($parts[1].ToLower().Contains($wordLower)) { $expectedAnswer = "B" }
            elseif ($parts[2].ToLower().Contains($wordLower)) { $expectedAnswer = "C" }
            elseif ($parts[3].ToLower().Contains($wordLower)) { $expectedAnswer = "D" }
        }

        if ($expectedAnswer -ne "") {
            $autoAnswer = $expectedAnswer
        }
    }

    $correctAnswer = if ($autoAnswer -eq 'N') { 'E' } else { $autoAnswer }
    $fullSentence = $parts -join ' '
    $options = @($parts[0], $parts[1], $parts[2], $parts[3], "No Error")

    $currentSetQuestions += @{
        id            = $qId
        sentence      = $fullSentence
        options       = $options
        correctAnswer = $correctAnswer
        explanation   = $explanation
    }

    if ($currentSetQuestions.Count -eq $SET_SIZE -or $row -eq $rows[-1]) {
        # Create passage
        $passageArr = @()
        for ($i = 0; $i -lt $currentSetQuestions.Count; $i++) {
            $num = $i + 1
            $passageArr += "($num) $($currentSetQuestions[$i].sentence)"
        }
        $passageText = $passageArr -join "`n`n"

        # Add to final
        for ($i = 0; $i -lt $currentSetQuestions.Count; $i++) {
            $q = $currentSetQuestions[$i]
            $num = $i + 1
            $finalQuestions += @{
                id            = $q.id
                passage       = $passageText
                question      = "Question ${num}: Find the error"
                options       = $q.options
                correctAnswer = $q.correctAnswer
                explanation   = $q.explanation
            }
        }

        $currentSetQuestions = @()
        $setIndex++
    }
}

$json = $finalQuestions | ConvertTo-Json -Depth 10

# Write to JS file
$jsContent = "export const SPELLING_QUIZ = $json;"
Set-Content -Path $jsPath -Value $jsContent -Encoding UTF8

Write-Host "Generated $($finalQuestions.Count) questions in $($setIndex - 1) sets."
