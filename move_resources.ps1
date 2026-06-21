#Requires -Version 5.1
$root = "d:\桌面\miniprogram-5\miniprogram-5"

function Move-Resource($from, $to) {
    if (Test-Path $from) {
        $dir = Split-Path $to -Parent
        if (!(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
        Move-Item -Path $from -Destination $to -Force
        Write-Host "[OK] moved: $from -> $to"
    } else {
        Write-Host "[MISS] not found: $from"
    }
}

# 1. create subpackage dirs
New-Item -ItemType Directory -Force -Path "$root\pages\game\images" | Out-Null
New-Item -ItemType Directory -Force -Path "$root\pages\game\audio" | Out-Null

# 2. move resources
Move-Resource "$root\images\bg_office.jpg"      "$root\pages\game\images\bg_office.jpg"
Move-Resource "$root\images\lin_qian.webp"      "$root\pages\game\images\lin_qian.webp"
Move-Resource "$root\images\liu_chaowen.webp"   "$root\pages\game\images\liu_chaowen.webp"
Move-Resource "$root\images\zhao_zeyan.webp"    "$root\pages\game\images\zhao_zeyan.webp"
Move-Resource "$root\audio\bgm_ending.mp3"      "$root\pages\game\audio\bgm_ending.mp3"
Move-Resource "$root\audio\bgm_office.mp3"    "$root\pages\game\audio\bgm_office.mp3"
Move-Resource "$root\audio\bgm_tense.mp3"     "$root\pages\game\audio\bgm_tense.mp3"

# 3. remove empty dirs
if (Test-Path "$root\images") {
    if ((Get-ChildItem "$root\images" -Recurse -Force | Measure-Object).Count -eq 0) {
        Remove-Item "$root\images" -Force
        Write-Host "[OK] removed empty dir: $root\images"
    } else {
        Write-Host "[WARN] images dir not empty, skipped"
    }
}
if (Test-Path "$root\audio") {
    if ((Get-ChildItem "$root\audio" -Recurse -Force | Measure-Object).Count -eq 0) {
        Remove-Item "$root\audio" -Force
        Write-Host "[OK] removed empty dir: $root\audio"
    } else {
        Write-Host "[WARN] audio dir not empty, skipped"
    }
}

# 4. clean temp file
if (Test-Path "$root\pages\game\temp_check.txt") {
    Remove-Item "$root\pages\game\temp_check.txt" -Force
    Write-Host "[OK] removed: $root\pages\game\temp_check.txt"
}

# 5. syntax check
Write-Host "`n=== syntax check ==="
$checkFiles = @(
    "$root\app.js",
    "$root\pages\game\game.js",
    "$root\data\chapter0.js",
    "$root\data\chapter1.js",
    "$root\data\chapter2.js",
    "$root\data\chapter3.js"
)
foreach ($f in $checkFiles) {
    Write-Host "check: $f"
    node -c "`"$f`""
    if ($LASTEXITCODE -ne 0) { Write-Host "[FAIL] syntax error: $f" }
    else { Write-Host "[PASS] $f" }
}

# 6. calculate sizes
function Get-DirSize($path) {
    if (Test-Path $path) {
        return (Get-ChildItem $path -Recurse -File -Force | Measure-Object -Property Length -Sum).Sum
    }
    return 0
}

function Format-Size($bytes) {
    if ($bytes -ge 1MB) { return "{0:N2} MB" -f ($bytes / 1MB) }
    if ($bytes -ge 1KB) { return "{0:N2} KB" -f ($bytes / 1KB) }
    return "$bytes bytes"
}

$total     = Get-DirSize $root
$subpackage = Get-DirSize "$root\pages\game"
$audioSize = Get-DirSize "$root\audio"
$imagesSize = Get-DirSize "$root\images"
$main      = $total - $subpackage - $audioSize - $imagesSize

Write-Host "`n=== size summary ==="
Write-Host "total: $(Format-Size $total) ($total bytes)"
Write-Host "main package (without pages/game/, audio/, images/): $(Format-Size $main) ($main bytes)"
Write-Host "subpackage (pages/game/): $(Format-Size $subpackage) ($subpackage bytes)"
