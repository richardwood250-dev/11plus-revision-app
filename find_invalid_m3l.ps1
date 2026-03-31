$ErrorActionPreference = "Stop"

$csvPath = "data\verbal_csvs\Questions - M3L.csv"
$lines = Get-Content $csvPath
$header = $lines[0]

$invalidIds = @()

for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    # CSV parser logic (simple split by comma, assuming no commas in text for M3L questions)
    # Actually, the questions in M3L are simple sentences. 
    # To be safe, let's use a regex or check if we have the right number of columns.
    $cols = $line -split ","
    
    # IDs are usually at $cols[0]
    $id = $cols[0]
    if (-not $id.StartsWith("M3L_")) { continue }
    
    $optA = $cols[2].Trim()
    $optB = $cols[3].Trim()
    $optC = $cols[4].Trim()
    $optD = $cols[5].Trim()
    $optE = $cols[6].Trim()
    
    $correctCol = $cols[7].Trim()
    
    $actualAnswerText = ""
    
    if ($correctCol -eq "A") { $actualAnswerText = $optA }
    elseif ($correctCol -eq "B") { $actualAnswerText = $optB }
    elseif ($correctCol -eq "C") { $actualAnswerText = $optC }
    elseif ($correctCol -eq "D") { $actualAnswerText = $optD }
    elseif ($correctCol -eq "E") { $actualAnswerText = $optE }
    else {
        # If it's the actual text, not the option letter
        $actualAnswerText = $correctCol
    }
    
    if ($actualAnswerText.Length -ne 3) {
        Write-Host "Found invalid length ($($actualAnswerText.Length)): $id -> Answer: '$actualAnswerText'"
        $invalidIds += $id
    }
}

Write-Host "Total invalid questions found: $($invalidIds.Count)"
$invalidIds | Out-File -FilePath "invalid_m3l_ids.txt" -Encoding UTF8
