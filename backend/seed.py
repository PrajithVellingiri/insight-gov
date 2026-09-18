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
    {"name": "Finance Department", "description": "Manages public funds, state budgeting, tax policies, and fiscal planning."},
    {"name": "Home, Prohibition and Excise Department", "description": "Oversees law enforcement, the state police force, prisons, and alcohol regulation."},
    {"name": "Revenue and Disaster Management Department", "description": "Administers land revenue collection, property records, and emergency disaster response."},
    {"name": "Commercial Taxes and Registration Department", "description": "Enforces GST/VAT collections and manages property deeds registration."},
    {"name": "Human Resources Management Department", "description": "Regulates civil service recruitment, training, and state bureaucratic guidelines."},
    {"name": "Law Department", "description": "Provides advisory services and drafts statutory legislation for state ministries."},
    {"name": "Legislative Assembly Department", "description": "Manages administrative operations of the Tamil Nadu unicameral house."},
    {"name": "Public Department", "description": "Handles high-level state protocol, foreign visits, and VVIP security coordination."},
    {"name": "Public (Elections) Department", "description": "Coordinates assembly, parliamentary, and local body elections across the state."},
    {"name": "Health and Family Welfare Department", "description": "Operates government hospitals, health sub-centers, and primary health initiatives."},
    {"name": "School Education Department", "description": "Governs elementary and secondary schools, textbooks, and state school curricula."},
    {"name": "Higher Education Department", "description": "Regulates public universities, engineering institutions, and arts colleges."},
    {"name": "Social Welfare and Women Empowerment Department", "description": "Executes nutrition, shelter, and financial safety nets for women and children."},
    {"name": "Co-operation, Food and Consumer Protection Department", "description": "Manages ration distribution systems, fair price shops, and consumer courts."},
    {"name": "Welfare of Differently Abled Persons Department", "description": "Issues rehabilitation resources, monthly stipends, and accessible infrastructure."},
    {"name": "BC, MBC & Minorities Welfare Department", "description": "Focuses on scholarships and hostels for backward classes and linguistic minorities."},
    {"name": "Adi Dravidar and Tribal Welfare Department", "description": "Implements socio-economic support programs tailored for listed tribal communities."},
    {"name": "Social Justice Department", "description": "Monitors constitutional anti-discrimination laws and equal opportunity quotas."},
    {"name": "Social Reforms Department", "description": "Promotes public progressive thought, anti-superstition campaigns, and civic harmony."},
    {"name": "Highways and Minor Ports Department", "description": "Maintains district roadways, bridges, expressways, and small seaside ports."},
    {"name": "Public Works Department (PWD)", "description": "Constructs and keeps up government institutional buildings and state architecture."},
    {"name": "Water Resources Department", "description": "Maintains reservoirs, dams, and irrigation networks for farming operations."},
    {"name": "Municipal Administration and Water Supply Department", "description": "Supervises urban town corporations, sewage maintenance, and civic water lines."},
    {"name": "Housing and Urban Development Department", "description": "Directs the Slum Clearance Board and local town planning authorities."},
    {"name": "Energy Department", "description": "Regulates electrical power generation, solar projects, and grids."},
    {"name": "Transport Department", "description": "Coordinates public transport buses, RTO registries, and driver licenses."},
    {"name": "Environment, Climate Change and Forests Department", "description": "Protects wildlife preserves, regulates pollution levels, and runs tree plantations."},
    {"name": "Natural Resources Department", "description": "Grants mining leases and safeguards geology, sand beds, and mineral minerals."},
    {"name": "Industries, Investment Promotion & Commerce Department", "description": "Facilitates single-window business clearances and secures industrial investments."},
    {"name": "Micro, Small and Medium Enterprises Department (MSME)", "description": "Supports cottage startups, small factories, and local food processing facilities."},
    {"name": "Rural Development and Panchayat Raj Department", "description": "Implements village jobs, rural roadways, and village council funding tracks."},
    {"name": "Information Technology and Digital Services Department", "description": "Drives e-governance solutions, public software portals, and local tech hubs."},
    {"name": "Planning, Development and Special Initiatives Department", "description": "Evaluates policy effectiveness and monitors major macro development data."},
    {"name": "Special Programme Implementation Department", "description": "Monitors flagship political manifesto schemes to ensure timely delivery."},
    {"name": "Mudalvarin Mugavari Department", "description": "Acts as a centralized portal routing public grievances directly to the Chief Minister."},
    {"name": "Agriculture - Farmers Welfare Department", "description": "Coordinates seed distribution, crop insurance setups, and modern farming methods."},
    {"name": "Animal Husbandry, Dairying, Fisheries and Fishermen Welfare Department", "description": "Manages livestock healthcare, Aavin milk supplies, and coastal safety."},
    {"name": "Labour Welfare and Skill Development Department", "description": "Coordinates industrial trade certificates (ITIs) and worker welfare updates."},
    {"name": "Handlooms, Handicrafts, Textiles and Khadi Department", "description": "Provides relief subsidies and operational support to weaver cooperatives."},
    {"name": "Tamil Development and Information Department", "description": "Promotes the regional language, coordinates press releases, and manages state archives."},
    {"name": "Tourism, Culture and Religious Endowments Department", "description": "Oversees landmark heritage temples (via HR&CE), local festivals, and tourist spots."},
    {"name": "Youth Welfare and Sports Development Department", "description": "Constructs stadium spaces, coordinates youth camps, and sponsors regional athletes."},
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

    for dept_data in DEPARTMENTS:
        name = dept_data["name"]
        description = dept_data["description"]
        dept = repo.get_by_name(name)
        if not dept:
            dept = repo.create(Department(name=name, description=description, department_code=slugify(name)[:10].upper()))
            print(f"  + Department created: {name}")
        else:
            if not dept.description:
                dept.description = description
                db.commit()
            print(f"  - Department exists:  {name}")
        departments[name] = dept

    return departments

def seed_officers(db: Session, departments: dict[str, Department]) -> None:
    """Create officer accounts linked to their respective departments."""
    repo = UserRepository(db)

    for i, dept_data in enumerate(DEPARTMENTS):
        dept_name = dept_data["name"]
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
        import traceback
        print(f"\n[FAIL] Seed failed: {exc}\n", file=sys.stderr)
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
