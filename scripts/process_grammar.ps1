$ErrorActionPreference = "Stop"

$csvPath = "grammar_raw.csv"
$jsPath = "..\data\grammar.js"

$rows = Import-Csv -Path $csvPath

# Group by base PassageID
$passages = @{}

$speechVerbs = @('said', 'shouted', 'asked', 'whispered', 'cried', 'replied', 'warned', 'thought', 'yelled', 'screamed', 'agreed', 'promised', 'mumbled', 'groaned')

foreach ($row in $rows) {
    if (-not $row.PassageID) { continue }

    $rawId = $row.PassageID
    # Strip suffixes like _Fix, _Fix2, _Rev, _v2
    $basePId = $rawId -replace '_(Fix|Rev|v2|Corr).*$', ''
    
    $lineNum = [int]$row.LineNum

    $parts = @($row.PartA, $row.PartB, $row.PartC, $row.PartD)

    # Heuristic A: Restore missing opening speech marks
    $closingQuoteIndex = -1
    for ($i = 0; $i -lt $parts.Length; $i++) {
        $p = $parts[$i].Trim()
        if ($p.EndsWith("'") -and -not $p.EndsWith("n't")) {
            $closingQuoteIndex = $i
            break
        }
    }

    if ($closingQuoteIndex -ne -1) {
        if (-not $parts[0].Trim().StartsWith("'")) {
            $parts[0] = "'" + $parts[0]
        }
    }

    $correctRaw = $row.CorrectAnswer.Trim().ToUpper()
    $correctAnswer = if ($correctRaw -eq 'N') { 'E' } else { $correctRaw }

    # Options
    $options = @($parts[0], $parts[1], $parts[2], $parts[3], "No Error")

    if (-not $passages.ContainsKey($basePId)) {
        $passages[$basePId] = @{
            id        = $basePId
            lines     = @{}
            questions = @{} # Use hashtable for deduplication by lineNum
        }
    }

    $lineText = $parts -join ' '
    # Last write wins for lines
    $passages[$basePId].lines[[string]$lineNum] = "($lineNum) $lineText"

    # Last write wins for questions
    $passages[$basePId].questions[[string]$lineNum] = @{
        id            = "${basePId}_${lineNum}"
        lineNum       = $lineNum
        question      = "Line ${lineNum}: Find the error"
        options       = $options
        correctAnswer = $correctAnswer
        explanation   = $row.Explanation
    }
}

$finalQuestions = @()

# Build final output
foreach ($p in $passages.Values) {
    # Sort lines
    $lineNums = $p.lines.Keys | Sort-Object { [int]$_ }
    $fullTextArr = @()
    foreach ($n in $lineNums) {
        $fullTextArr += $p.lines[$n]
    }
    $fullText = $fullTextArr -join "`n`n"

    # Sort questions
    $questionNums = $p.questions.Keys | Sort-Object { [int]$_ }
    foreach ($qn in $questionNums) {
        $q = $p.questions[$qn]
        $finalQuestions += @{
            id            = $q.id
            passage       = $fullText
            question      = $q.question
            options       = $q.options
            correctAnswer = $q.correctAnswer
            explanation   = $q.explanation
        }
    }
}

$json = $finalQuestions | ConvertTo-Json -Depth 10

# Write to JS file
$jsContent = "export const GRAMMAR_QUIZ = $json;"
Set-Content -Path $jsPath -Value $jsContent -Encoding UTF8

Write-Host "Generated $($finalQuestions.Count) questions from $($passages.Count) passages."
