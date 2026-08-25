import re
with open('config.py', 'r', encoding='utf-8') as f:
    content = f.read()
if 'redis_url' not in content:
    content = re.sub(
        r'upload_dir:\s*str\s*=\s*\"uploads\"',
        'upload_dir: str = \"uploads\"\n    redis_url: str = \"redis://localhost:6379/0\"',
        content
    )
    with open('config.py', 'w', encoding='utf-8') as f:
        f.write(content)
