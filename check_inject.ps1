$data = Get-Content "data\verbal.js" -Raw
$idx = $data.IndexOf("Missing_letter_1")
if ($idx -gt -1) {
    Write-Host $data.Substring($idx, 150)
}
