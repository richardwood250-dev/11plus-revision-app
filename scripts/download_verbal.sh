#!/bin/bash

BASE_URL="https://raw.githubusercontent.com/richardwood250-dev/11plus-verbal/refs/heads/main"

# List of files based on screenshot
declare -a files=(
    "Questions - Compound words.csv"
    "Questions - Corresponding letters.csv"
    "Questions - Hidden word (1).csv"
    "Questions - Homonyms.csv"
    "Questions - Letter codes.csv"
    "Questions - Letter sequences.csv"
    "Questions - Letters for numbers.csv"
    "Questions - Logical deduction.csv"
    "Questions - M3L.csv"
    "Questions - Missing letter.csv"
    "Questions - Move a letter (1).csv"
    "Questions - Number connections.csv"
    "Questions - Odd 2 out.csv"
    "Questions - Sequences.csv"
    "Questions - Syn-Ant.csv"
    "Questions - Verbal analogies.csv"
    "Questions - Word codes.csv"
)

mkdir -p data/verbal_csvs

for file in "${files[@]}"; do
    # Encode spaces for URL
    encoded_name=$(echo "$file" | sed 's/ /%20/g')
    echo "Downloading $file..."
    curl -s -o "data/verbal_csvs/$file" "$BASE_URL/$encoded_name"
done

ls -lh data/verbal_csvs
