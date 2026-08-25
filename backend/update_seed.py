import re
import os

md_content = open(r'd:\College\Projects\InsightGov\ai\prompts\analysis.md', encoding='utf-8').read()
matches = re.findall(r'^- (.*?): (.*)', md_content, re.MULTILINE)

seed_path = r'd:\College\Projects\InsightGov\backend\seed.py'
seed_content = open(seed_path, encoding='utf-8').read()

new_deps = 'DEPARTMENTS = [\n'
for name, desc in matches:
    if name in ('low', 'medium', 'high', 'critical'): continue
    new_deps += f'    {{"name": "{name}", "description": "{desc}"}},\n'
new_deps += ']'

old_deps_pattern = re.compile(r'^DEPARTMENTS = \[.*?^\]', re.MULTILINE | re.DOTALL)
seed_content = old_deps_pattern.sub(new_deps, seed_content)

seed_loop_pattern = re.compile(r'for dept_name in DEPARTMENTS:.*?dept = Department\(name=dept_name, department_code=dept_code\)', re.MULTILINE | re.DOTALL)
new_seed_loop = '''for dept_data in DEPARTMENTS:
        dept_name = dept_data["name"]
        dept_desc = dept_data["description"]
        dept_code = slugify(dept_name)[:10].upper()
        if not dept_repo.get_by_name(dept_name):
            dept = Department(name=dept_name, description=dept_desc, department_code=dept_code)'''
seed_content = seed_loop_pattern.sub(new_seed_loop, seed_content)

open(seed_path, 'w', encoding='utf-8').write(seed_content)
