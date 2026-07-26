"""
seed.py — Populates the database with initial departments and accounts.

Usage:
    cd backend
    .venv/Scripts/python seed.py     (Windows)
    .venv/bin/python seed.py         (Linux / macOS)

Idempotent: skips any row that already exists (matched by unique name / email).
"""

import sys
import re

from sqlalchemy.orm import Session

from database import SessionLocal
from models.department import Department
from models.user import User
from repositories.department_repo import DepartmentRepository
from repositories.user_repo import UserRepository
from services.auth_service import AuthService

# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------

DEPARTMENTS = [
    "Finance Department",
    "Home, Prohibition and Excise Department",
    "Revenue and Disaster Management Department",
    "Commercial Taxes and Registration Department",
    "Human Resources Management Department",
    "Law Department",
    "Legislative Assembly Department",
    "Public Department",
    "Public (Elections) Department",
    "Health and Family Welfare Department",
    "School Education Department",
    "Higher Education Department",
    "Social Welfare and Women Empowerment Department",
    "Co-operation, Food and Consumer Protection Department",
    "Welfare of Differently Abled Persons Department",
    "BC, MBC & Minorities Welfare Department",
    "Adi Dravidar and Tribal Welfare Department",
    "Social Justice Department",
    "Social Reforms Department",
    "Highways and Minor Ports Department",
    "Public Works Department (PWD)",
    "Water Resources Department",
    "Municipal Administration and Water Supply Department",
    "Housing and Urban Development Department",
    "Energy Department",
    "Transport Department",
    "Environment, Climate Change and Forests Department",
    "Natural Resources Department",
    "Industries, Investment Promotion & Commerce Department",
    "Micro, Small and Medium Enterprises Department (MSME)",
    "Rural Development and Panchayat Raj Department",
    "Information Technology and Digital Services Department",
    "Planning, Development and Special Initiatives Department",
    "Special Programme Implementation Department",
    "Mudalvarin Mugavari Department",
    "Agriculture - Farmers Welfare Department",
    "Animal Husbandry, Dairying, Fisheries and Fishermen Welfare Department",
    "Labour Welfare and Skill Development Department",
    "Handlooms, Handicrafts, Textiles and Khadi Department",
    "Tamil Development and Information Department",
    "Tourism, Culture and Religious Endowments Department",
    "Youth Welfare and Sports Development Department"
]

OFFICER_NAMES = [
    "Ramesh Kumar", "Priya Sharma", "Anil Verma", "Sunita Rao", "Vikram Patel",
    "Arvind Krishnan", "Meera Reddy", "Suresh Iyer", "Kavita Menon", "Dinesh Nair",
    "Rajeshwari Pillai", "Sanjay Gupta", "Neha Desai", "Anand Joshi", "Lakshmi Narayanan",
    "Karthik Rajan", "Divya Prakash", "Ravi Shankar", "Shweta Singh", "Manoj Tiwari",
    "Geeta Kapoor", "Amit Bhatt", "Swati Mukherjee", "Sunil Das", "Anjali Sen",
    "Prakash Babu", "Ritu Raj", "Ashok Menon", "Sushma Reddy", "Vivek Sharma",
    "Nithya Raman", "Rahul Verma", "Sneha Patil", "Naveen Kumar", "Pooja Hegde",
    "Kiran Rao", "Tarun Singh", "Pallavi Joshi", "Rajiv Nair", "Smriti Iyer",
    "Harish Kumar", "Renu Desai"
]

ADMIN = {
    "name": "Admin",
    "email": "admin@insightgov.in",
    "password": "Admin@123456",
}

DEFAULT_OFFICER_PASSWORD = "Officer@123456"

def slugify(text: str) -> str:
    text = text.lower()
    text = re.sub(r'[^a-z0-9]+', '.', text)
    return text.strip('.')

# ---------------------------------------------------------------------------
# Seed logic
# ---------------------------------------------------------------------------

def seed_departments(db: Session) -> dict[str, Department]:
    """Create departments and return a name→Department lookup."""
    repo = DepartmentRepository(db)
    departments: dict[str, Department] = {}

    for name in DEPARTMENTS:
        dept = repo.get_by_name(name)
        if not dept:
            dept = repo.create(Department(name=name))
            print(f"  + Department created: {name}")
        else:
            print(f"  - Department exists:  {name}")
        departments[name] = dept

    return departments

def seed_officers(db: Session, departments: dict[str, Department]) -> None:
    """Create officer accounts linked to their respective departments."""
    repo = UserRepository(db)

    for i, dept_name in enumerate(DEPARTMENTS):
        dept = departments[dept_name]
        officer_name = OFFICER_NAMES[i]
        slug = slugify(officer_name)
        email = f"{slug}@insightgov.in"
        
        if repo.get_by_email(email):
            print(f"  - Officer exists:  {email}")
            continue

        user = User(
            name=officer_name,
            email=email,
            hashed_password=AuthService.hash_password(DEFAULT_OFFICER_PASSWORD),
            role="officer",
            department_id=dept.id,
        )
        repo.create(user)
        print(f"  + Officer created:  {officer_name} ({dept_name}) -> {email}")

def seed_admin(db: Session) -> None:
    """Create the default admin account (no department)."""
    repo = UserRepository(db)

    if repo.get_by_email(ADMIN["email"]):
        print(f"  - Admin exists:  {ADMIN['email']}")
        return

    user = User(
        name=ADMIN["name"],
        email=ADMIN["email"],
        hashed_password=AuthService.hash_password(ADMIN["password"]),
        role="admin",
        department_id=None,
    )
    repo.create(user)
    print(f"  + Admin created:  {ADMIN['email']}")

def main() -> None:
    print("\n--- InsightGov -- Seeding database ---\n")

    db = SessionLocal()
    try:
        print("[1/3] Departments")
        departments = seed_departments(db)

        print("\n[2/3] Officers")
        seed_officers(db, departments)

        print("\n[3/3] Admin")
        seed_admin(db)

        print("\n[OK] Seed complete.\n")
        print("Default credentials:")
        print(f"  Admin:   {ADMIN['email']}  /  {ADMIN['password']}")
        print(f"  Officers: <firstname>.<lastname>@insightgov.in  /  {DEFAULT_OFFICER_PASSWORD}")
        print()
    except Exception as exc:
        db.rollback()
        print(f"\n[FAIL] Seed failed: {exc}\n", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
