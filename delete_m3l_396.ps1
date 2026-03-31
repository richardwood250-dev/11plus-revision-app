$ErrorActionPreference = "Stop"

Write-Host "Removing from verbal.js..."
$jsPath = "data\verbal.js"
$jsData = Get-Content $jsPath -Raw

# Remove {"id":"M3L_396", ... } and the trailing comma if it exists
# Or remove the preceding comma. Let's just remove the JSON object 
# '\{"id":"M3L_396".*?\}\,?'
# Wait, if it's the last element, it might not have a comma, but a preceding comma.
$pattern = '(?s),?\{"id":"M3L_396".*?\}'
$newJsData = [regex]::Replace($jsData, $pattern, '')
$newJsData | Set-Content $jsPath -Encoding UTF8
Write-Host "Removed from verbal.js"

Write-Host "Removing from CSV..."
$csvPath = "data\verbal_csvs\Questions - M3L.csv"
$csvLines = Get-Content $csvPath
$newCsvLines = $csvLines | Where-Object { $_ -notmatch 'Ride a KE' }
$newCsvLines | Set-Content $csvPath -Encoding UTF8
Write-Host "Removed from CSV."
