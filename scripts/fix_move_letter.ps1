$VerbosePreference = "Continue"

$verbalPath = ".\data\verbal.js"
$csvPath = ".\data\verbal_csvs\Questions - Move a letter (1).csv"

Write-Verbose "Reading JS file..."
$jsContent = Get-Content -Path $verbalPath -Raw

Write-Verbose "Stripping JS wrapper to get JSON..."
# Safely remove the "export const VERBAL_QUIZ = " part
$startIndex = $jsContent.IndexOf("{")
$endIndex = $jsContent.LastIndexOf("}")
$jsonString = $jsContent.Substring($startIndex, $endIndex - $startIndex + 1)

Write-Verbose "Parsing JSON..."
$jsonObject = ConvertFrom-Json $jsonString -ErrorAction Stop

Write-Verbose "Reading CSV file..."
$csvData = Import-Csv $csvPath

if ($null -eq $jsonObject.Move_a_letter) {
    Write-Error "Move_a_letter not found in JSON"
    exit 1
}

$questions = $jsonObject.Move_a_letter.questions

for ($i = 0; $i -lt $questions.Count; $i++) {
    $q = $questions[$i]
    $csvRow = $csvData[$i]
    if ($q.question -eq $csvRow.Word1 -and $null -ne $csvRow.Word2 -and $csvRow.Word2 -ne "") {
        # Modify the question text as "Word1 - Word2"
        $q.question = "$($csvRow.Word1) & $($csvRow.Word2)"
    }
}

Write-Verbose "Converting back to JSON..."
$newJsonString = ConvertTo-Json -InputObject $jsonObject -Depth 10 -Compress

Write-Verbose "Writing back to JS file..."
$newJsContent = "export const VERBAL_QUIZ = $newJsonString;"
Set-Content -Path $verbalPath -Value $newJsContent -Encoding UTF8

Write-Verbose "Done!"
