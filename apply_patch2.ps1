$content = Get-Content -Raw "C:\xampp\htdocs\bhakti-sagar\assets\js\app.js"
$search = "applyMuteUI();" + "`n`n    setInterval(renderClock, 1000);"
$replace = "applyMuteUI();" + "`n    syncFullscreenUI();" + "`n    document.addEventListener('fullscreenchange', syncFullscreenUI);" + "`n    document.addEventListener('webkitfullscreenchange', syncFullscreenUI);" + "`n    document.addEventListener('mozfullscreenchange', syncFullscreenUI);" + "`n    document.addEventListener('MSFullscreenChange', syncFullscreenUI);" + "`n`n    setInterval(renderClock, 1000);"
$newContent = $content.Replace($search, $replace)
Set-Content -Path "C:\xampp\htdocs\bhakti-sagar\assets\js\app.js" -Value $newContent -NoNewline
"Done"