$data = Get-Content "data\verbal.js" -Raw
$pattern = '\{"id":"M3L_396".*?\}'
if ($data -match $pattern) {
    Write-Host "Found in verbal.js:"
    Write-Host $matches[0]
}
else {
    Write-Host "Not found M3L_396 in verbal.js"
}

$patternNew = '\{"id":"M3L_NEW_396".*?\}'
if ($data -match $patternNew) {
    Write-Host "Found in verbal.js (M3L_NEW_396):"
    Write-Host $matches[0]
}

$csv = Get-Content "data\verbal_csvs\Questions - M3L.csv"
$csvLines = $csv | Select-String -Pattern "396"
Write-Host "Found in CSV lines with 396:"
$csvLines | ForEach-Object { Write-Host $_.Line }
