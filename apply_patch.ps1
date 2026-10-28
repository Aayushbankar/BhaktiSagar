$patch = Get-Content -Raw "C:\xampp\htdocs\bhakti-sagar\assets\js\app.js.patch2"
$content = Get-Content -Raw "C:\xampp\htdocs\bhakti-sagar\assets\js\app.js"
$search = "el.topbar = document.querySelector('.topbar');" + "`n    el.navBits = document.querySelectorAll('[data-nav]');"
$newContent = $content.Replace($search, $patch)
Set-Content -Path "C:\xampp\htdocs\bhakti-sagar\assets\js\app.js" -Value $newContent -NoNewline
"Done"