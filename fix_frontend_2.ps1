$file = "frontend/src/api/petitions.api.js"
$content = Get-Content $file -Raw
$content = $content -replace "(?s)return api\.post\(`/petitions/\$\{id\}/images`, formData, \{\s*headers: \{ 'Content-Type': 'multipart/form-data' \},\s*\}\)", "return api.post(`/petitions/`${id}/images`, formData)"
Set-Content $file -Value $content
