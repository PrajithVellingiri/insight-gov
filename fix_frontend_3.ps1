$file = "frontend/src/api/petitions.api.js"
$content = Get-Content $file -Raw
$content = $content.Replace("return api.post(``/petitions/${id}/images``, formData, {`r`n    headers: { 'Content-Type': 'multipart/form-data' },`r`n  }).then((r) => r.data);", "return api.post(``/petitions/${id}/images``, formData).then((r) => r.data);")
$content = $content.Replace("return api.post(``/petitions/${id}/images``, formData, {`n    headers: { 'Content-Type': 'multipart/form-data' },`n  }).then((r) => r.data);", "return api.post(``/petitions/${id}/images``, formData).then((r) => r.data);")
Set-Content $file -Value $content
