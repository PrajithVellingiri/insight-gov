import sys

with open('services/petition_service.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '# 2. Call AI service' in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(lines)):
        if 'return petition' in lines[i]:
            end_idx = i
            break

if start_idx == -1 or end_idx == -1:
    print('Could not find boundaries')
    sys.exit(1)

extracted_lines = lines[start_idx:end_idx]

replacement = [
    "        # Enqueue the background task for AI analysis\n",
    "        try:\n",
    "            from worker import process_petition_ai_analysis\n",
    "            process_petition_ai_analysis.delay(str(petition.id), citizen_name)\n",
    "            logger.info(\"Enqueued AI analysis task for petition %s\", petition.id)\n",
    "        except Exception as e:\n",
    "            logger.error(\"Failed to enqueue AI analysis task for petition %s: %s\", petition.id, e)\n",
    "\n",
    "        return petition\n"
]

new_task_def = [
    "\n",
    "    async def process_ai_analysis_task(self, petition_id: UUID, citizen_name: str):\n",
    "        petition = self._petition_repo.get_by_id(petition_id)\n",
    "        if not petition:\n",
    "            logger.error(\"Petition %s not found for AI analysis task.\", petition_id)\n",
    "            return\n",
    "\n",
    "        uploaded_image_paths = []\n",
    "        if petition.images:\n",
    "            from pathlib import Path\n",
    "            for img in petition.images:\n",
    "                if img.image_type == 'petition':\n",
    "                    file_path = Path(settings.upload_dir) / img.stored_path\n",
    "                    if file_path.exists():\n",
    "                        uploaded_image_paths.append((file_path, img.mime_type))\n",
    "\n"
]

# Note: The extracted lines contain things like 	ranslated_title = await provider.translate(petition.title, "en")
# They were indented at 8 spaces (inside create_petition), and we want them at 8 spaces (inside process_ai_analysis_task)
# So the indentation is already correct!

new_lines = lines[:start_idx] + replacement + lines[end_idx+1:] + new_task_def + extracted_lines

with open('services/petition_service.py', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Refactoring done.')
