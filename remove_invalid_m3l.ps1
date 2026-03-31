$ErrorActionPreference = "Stop"

$ids = Get-Content "invalid_m3l_ids.txt"
if (-not $ids) {
    Write-Host "No IDs found."
    exit
}

Write-Host "Removing from CSV..."
$csvPath = "data\verbal_csvs\Questions - M3L.csv"
$csvLines = Get-Content $csvPath
$newCsvLines = @()

foreach ($line in $csvLines) {
    $lineTrimmed = $line.Trim()
    if ([string]::IsNullOrWhiteSpace($lineTrimmed)) { continue }
    
    $cols = $lineTrimmed -split ","
    $id = $cols[0]
    
    if ($ids -contains $id) {
        # Skip this line
        continue
    }
    
    $newCsvLines += $lineTrimmed
}

$newCsvLines | Set-Content $csvPath -Encoding UTF8
Write-Host "Removed from CSV."

Write-Host "Removing from verbal.js..."
$jsPath = "data\verbal.js"
$jsData = Get-Content $jsPath -Raw

# For verbal.js, the questions are JSON objects in an array.
# The IDs are in the "id":"<ID>" field. We can remove them using regex.
# Format is loosely {"id":"M3L_NEW_760" ... }
# To handle preceding or succeeding commas, we can just replace the whole object and one of its surrounding commas.

foreach ($id in $ids) {
    # Regex to match the JSON object and an optional leading or trailing comma
    $pattern = '(?s),?\{"id":"' + [regex]::Escape($id) + '".*?\}'
    $jsData = [regex]::Replace($jsData, $pattern, '')
}

# Fix any lingering issues, e.g. [, at the start of array or ,] at the end
$jsData = $jsData -replace '\[\s*,', '[' -replace ',\s*\]', ']'

$jsData | Set-Content $jsPath -Encoding UTF8
Write-Host "Removed from verbal.js"
