$file = "frontend/src/api/petitions.api.js"
$content = Get-Content $file -Raw
$content = $content -replace "(?s)export const submitPetition = \(data\) =>\s*api\.post\('/petitions', data, \{\s*headers: \{ 'Content-Type': 'multipart/form-data' \},\s*\}\)\.then\(\(r\) => r\.data\);", "export const submitPetition = (data) =>`r`n  api.post('/petitions', data).then((r) => r.data);"
Set-Content $file -Value $content
