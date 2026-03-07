$ErrorActionPreference = "Stop"
$scripPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Read CSV
$csvPath = Join-Path $scripPath "..\data\verbal_csvs\Questions - M3L.csv"
$lines = Get-Content $csvPath

$questions = @()
for ($i = 0; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -eq "" -or $line.StartsWith(",")) { continue }
    
    $cols = $line -split ","
    $id = $cols[0].Trim()
    $qText = $cols[1].Trim()
    
    $options = @()
    if ($cols[2].Trim() -ne "") { $options += "`"$($cols[2].Trim())`"" }
    if ($cols[3].Trim() -ne "") { $options += "`"$($cols[3].Trim())`"" }
    if ($cols[4].Trim() -ne "") { $options += "`"$($cols[4].Trim())`"" }
    if ($cols[5].Trim() -ne "") { $options += "`"$($cols[5].Trim())`"" }
    if ($cols[6].Trim() -ne "") { $options += "`"$($cols[6].Trim())`"" }
    
    $correctVal = $cols[7].Trim()
    
    # Process_verbal_all logic for correct answer
    $finalCorrectLetter = "A"
    if ($correctVal.Length -eq 1 -and "ABCDE" -match $correctVal) {
        $finalCorrectLetter = $correctVal 
    }
    else {
        # Fallback to map from text to Option index? M3L correct answers are letters A,B,C,D,E or exact text?
        # Typically M3L has A, B, C, D, E.
        $finalCorrectLetter = $correctVal 
    }
    
    $questions += "{`"id`":`"$id`",`"question`":`"$qText`",`"key`":null,`"options`":[$($options -join ',')],`"correctAnswer`":`"$finalCorrectLetter`"}"
}

$questionsJson = "[" + ($questions -join ",") + "]"

$jsPath = Join-Path $scripPath "..\data\verbal.js"
$jsContent = Get-Content $jsPath -Raw

# Replace the "M3L":{...} chunk
$pattern = '(?s)"M3L":\{"title":"M3L","questions":\[(.*?)\]\}'
$replacement = "`"M3L`":{`"title`":`"M3L`",`"questions`":$questionsJson}"

$newJsContent = [regex]::Replace($jsContent, $pattern, $replacement)

$newJsContent | Set-Content $jsPath -Encoding UTF8
Write-Host "Injected new data into verbal.js successfully."
