$ErrorActionPreference = "Stop"
Write-Host "Downloading word list..."
$wordListStr = (Invoke-WebRequest -Uri "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt" -UseBasicParsing).Content

$wordSet = New-Object 'System.Collections.Generic.HashSet[String]' ([StringComparer]::OrdinalIgnoreCase)
foreach ($word in ($wordListStr -split "`n")) {
    $clean = $word.Trim()
    if ($clean.Length -gt 0) {
        $null = $wordSet.Add($clean)
    }
}

$csvPath = "data\verbal_csvs\Questions - Missing letter.csv"
$lines = Get-Content $csvPath
$newLines = @()
$newLines += $lines[0] # Header

$alphabet = [char[]]"ABCDEFGHIJKLMNOPQRSTUVWXYZ"

for ($i = 1; $i -lt $lines.Count; $i++) {
    $line = $lines[$i].Trim()
    if ($line -eq "" -or $line.StartsWith(",")) { 
        $newLines += $line
        continue 
    }
    
    $cols = $line -split ","
    $qText = $cols[0]
    
    $parts = $qText -split " \[ \? \] "
    if ($parts.Length -ne 2) { 
        $newLines += $line
        continue 
    }
    
    $part1 = $parts[0].Trim()
    $part2 = $parts[1].Trim()
    
    $correctAnswer = $cols[6].Trim()
    
    $optionsIndices = 1..5
    $currentOptions = @($cols[1], $cols[2], $cols[3], $cols[4], $cols[5])
    
    $changed = $false
    
    foreach ($idx in 0..4) {
        $opt = $currentOptions[$idx].Trim()
        if ([string]::IsNullOrWhiteSpace($opt)) { continue }
        
        $word1 = $part1 + $opt
        $word2 = $opt + $part2
        
        $isValid = $wordSet.Contains($word1) -and $wordSet.Contains($word2)
        
        # If it's a valid option but NOT the correct answer letter, replace it!
        # Note: sometimes an option and the correct answer might be the same letter, 
        # but if we should only have ONE option that works.
        if ($isValid -and $opt -ne $correctAnswer) {
            # Find a replacement letter
            $foundReplacement = $false
            foreach ($candidate in $alphabet) {
                # Ensure candidate is not already an option
                if ($currentOptions -contains $candidate) { continue }
                if ($candidate -eq $correctAnswer) { continue }
                
                $candWord1 = $part1 + $candidate
                $candWord2 = $candidate + $part2
                
                $candValid = $wordSet.Contains($candWord1) -and $wordSet.Contains($candWord2)
                if (-not $candValid) {
                    $currentOptions[$idx] = $candidate
                    $changed = $true
                    $foundReplacement = $true
                    break
                }
            }
        }
    }
    
    # Reconstruct line
    $cols[1] = $currentOptions[0]
    $cols[2] = $currentOptions[1]
    $cols[3] = $currentOptions[2]
    $cols[4] = $currentOptions[3]
    $cols[5] = $currentOptions[4]
    
    $newLine = $cols -join ","
    $newLines += $newLine
}

$newLines | Set-Content -Path $csvPath -Encoding UTF8
Write-Host "Replaced problematic overlapping options successfully."
