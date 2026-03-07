$scripPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$csvPath = Join-Path $scripPath "..\data\verbal_csvs\Questions - M3L.csv"

# The CSV might not have headers, but if we look at it, it has columns: ID, Question, OptA, OptB...
# Wait, Import-Csv expects headers. We can supply them if missing, but let's just do text manipulation since we just want to replace the second column.

$lines = Get-Content $csvPath
$outLines = @()
$changed = 0

$prefixes = @(
    "Complete the word:",
    "Find the missing letters:",
    "Solve this puzzle:",
    "Fill in the blank:"
)

foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    # Split by comma (assuming standard format with no internal commas in Question column, like M3L_NEW_632,Last K.,MET,WEE,...)
    # Actually we can just do a regex replace on the second column
    
    $parts = $line -split ',', 3
    if ($parts.Length -ge 3) {
        $id = $parts[0]
        $question = $parts[1]
        $rest = $parts[2]
        
        # Check if question is short (approx word count)
        $words = $question.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
        $wordCount = $words.Length
        
        $isAlreadyExpanded = ($question -match "^Complete the") -or ($question -match "^Find the") -or ($question -match "^Solve this") -or ($question -match "^Fill in") -or ($question -eq "Question")
        
        if (-not $isAlreadyExpanded -and $wordCount -ge 1 -and $wordCount -le 3) {
            # Pick a random prefix
            $idx = Get-Random -Maximum $prefixes.Length
            $prefix = $prefixes[$idx]
            
            $newQuestion = "$prefix $question"
            $newLine = "$id,$newQuestion,$rest"
            $outLines += $newLine
            $changed++
        } else {
            $outLines += $line
        }
    } else {
        $outLines += $line
    }
}

$outLines | Set-Content $csvPath -Encoding UTF8

Write-Host "Updated $changed questions in Questions - M3L.csv"
