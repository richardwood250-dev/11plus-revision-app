$ErrorActionPreference = "Stop"
Write-Host "Downloading word list..."
# Use a smaller basic wordlist if possible, but 4MB is fine.
$wordListStr = (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt" -UseBasicParsing).Content

Write-Host "Building Hash Set..."
$wordSet = New-Object 'System.Collections.Generic.HashSet[String]' ([StringComparer]::OrdinalIgnoreCase)
foreach ($word in ($wordListStr -split "`n")) {
    $clean = $word.Trim()
    if ($clean.Length -gt 0) {
        $null = $wordSet.Add($clean)
    }
}

Write-Host "Processing CSV..."
$csvPath = "data\verbal_csvs\Questions - Missing letter.csv"
$lines = Get-Content $csvPath

for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -eq "" -or $line.StartsWith(",")) { continue }
    
    $cols = $line -split ","
    $qText = $cols[0]
    
    # Example: "GRAP [ ? ] ACH"
    $parts = $qText -split " \[ \? \] "
    if ($parts.Length -ne 2) { continue }
    
    $part1 = $parts[0].Trim()
    $part2 = $parts[1].Trim()
    
    $options = @($cols[1], $cols[2], $cols[3], $cols[4], $cols[5])
    $correctAnswerIdxStr = $cols[6] # 'A', 'B', 'C', 'D', 'E' or the letter itself?
    # Wait, the column 6 in the CSV has the option letter (A, B, C, D, E) or the actual answer?
    # Actually, in the CSV lines: `GRAP [ ? ] ACH,S,E,L,P,M,E,Level 1,0,1,0,0,0`
    # Column 6 is `E`. But Option B is `E`. So Column 6 is just `E`. Is it Option E or value `E`?
    # Let's just find ALL options that are valid.
    
    $validOptions = @()
    
    foreach ($opt in $options) {
        if ([string]::IsNullOrWhiteSpace($opt)) { continue }
        $word1 = $part1 + $opt
        $word2 = $opt + $part2
        
        if ($wordSet.Contains($word1) -and $wordSet.Contains($word2)) {
            $validOptions += $opt
        }
    }
    
    if ($validOptions.Count -gt 1) {
        Write-Host "MULTIPLE Correct Answers at line $($i + 1): $qText"
        Write-Host "Options array: $($options -join ', ')"
        Write-Host "Valid Options found: $($validOptions -join ', ')"
        Write-Host "Declared Correct Answer: $correctAnswerIdxStr"
        Write-Host "--------------------------------"
    }
}
Write-Host "Done Processing!"
