import os

files = {
    "admin/AdminDashboard.jsx": "Admin Dashboard",
    "admin/DepartmentManagement.jsx": "Departments",
    "admin/OfficerManagement.jsx": "Officers",
    "citizen/CitizenDashboard.jsx": "Citizen Dashboard",
    "citizen/PetitionStatus.jsx": "Petition Status",
    "citizen/SubmitPetition.jsx": "Submit Petition",
    "officer/OfficerDashboard.jsx": "Officer Dashboard",
    "officer/PetitionReview.jsx": "Petition Review",
    "officer/SemanticSearch.jsx": "Semantic Search",
    "public/LandingPage.jsx": "InsightGov",
    "public/LoginPage.jsx": "Login",
    "public/RegisterPage.jsx": "Register",
}

for path, title in files.items():
    full_path = f"d:/College/Projects/InsightGov/frontend/src/pages/{path}"
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "usePageTitle" in content:
        continue

    # Add import
    import_statement = "import usePageTitle from '@/hooks/usePageTitle';\n"
    if "import" in content:
        # Find last import
        lines = content.split('\n')
        last_import = max([i for i, l in enumerate(lines) if l.startswith('import ')])
        lines.insert(last_import + 1, import_statement.strip())
        content = '\n'.join(lines)
    else:
        content = import_statement + content

    # Add hook inside component
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if line.startswith('export default function'):
            lines.insert(i + 1, f"  usePageTitle('{title}');")
            break
            
    with open(full_path, "w", encoding="utf-8") as f:
        f.write('\n'.join(lines))
    print(f"Added title '{title}' to {path}")

