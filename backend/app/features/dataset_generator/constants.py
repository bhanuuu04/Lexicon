"""
Enterprise Identity and Credential Constants
Used by the Dataset Generator for Active Directory simulation.
"""

FIRST_NAMES = [
    "Alex", "Jordan", "Taylor", "Morgan", "Sam", "Chris", "Pat", "Riley", "Casey", "Jamie",
    "Avery", "Cameron", "Dakota", "Reese", "Quinn", "Skyler", "Kendall", "Peyton", "Logan", "Hayden",
    "David", "Sarah", "Michael", "Emily", "James", "Emma", "John", "Olivia", "Robert", "Sophia",
    "William", "Ava", "Joseph", "Isabella", "Thomas", "Mia", "Charles", "Charlotte", "Daniel", "Amelia",
    "Matthew", "Harper", "Anthony", "Evelyn", "Donald", "Abigail", "Mark", "Elizabeth", "Steven", "Mila",
    "Andrew", "Ella", "Kenneth", "Joshua", "Sofia", "Kevin", "Camila", "Brian", "Aria", "George",
    "Scarlett", "Edward", "Victoria", "Ronald", "Madison", "Timothy", "Luna", "Jason", "Grace", "Jeffrey",
    "Chloe", "Ryan", "Penelope", "Jacob", "Layla", "Gary", "Nicholas", "Nora", "Eric", "Hazel",
    "Jonathan", "Zoey", "Stephen", "Riley", "Larry", "Stella", "Justin", "Ellie", "Scott", "Paisley",
    "Brandon", "Audrey", "Benjamin", "Claire", "Samuel", "Skylar", "Gregory", "Bella", "Frank", "Aurora",
    "Alexander", "Lucy", "Raymond", "Anna", "Patrick", "Samantha", "Jack", "Caroline", "Dennis", "Genesis",
    "Jerry", "Aaliyah", "Tyler", "Kennedy", "Aaron", "Kinsley", "Jose", "Allison", "Adam", "Maya",
    "Nathan", "Sarah", "Henry", "Madelyn", "Douglas", "Adeline", "Zachary", "Evelyn", "Peter", "Piper"
]

LAST_NAMES = [
    "Morgan", "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez",
    "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson",
    "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis",
    "Robinson", "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill",
    "Flores", "Green", "Adams", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter",
    "Roberts", "Gomez", "Phillips", "Evans", "Turner", "Diaz", "Parker", "Cruz", "Edwards", "Collins",
    "Reyes", "Stewart", "Morris", "Morales", "Murphy", "Cook", "Rogers", "Gutierrez", "Ortiz", "Morgan",
    "Cooper", "Peterson", "Bailey", "Reed", "Kelly", "Howard", "Ramos", "Kim", "Cox", "Ward",
    "Richardson", "Watson", "Brooks", "Chavez", "Wood", "James", "Bennett", "Gray", "Mendoza", "Ruiz",
    "Hughes", "Price", "Alvarez", "Castillo", "Sanders", "Patel", "Myers", "Long", "Ross", "Foster",
    "Jimenez", "Powell", "Jenkins", "Perry", "Russell", "Sullivan", "Bell", "Coleman", "Butler", "Henderson"
]

DEPARTMENTS = {
    "Information Technology": {
        "roles": [
            ("Enterprise Active Directory Admin", True),
            ("Senior DevOps Engineer", True),
            ("Cloud Security Architect", True),
            ("Database Administrator", True),
            ("IT Support Specialist", False),
            ("Network Operations Engineer", True),
            ("Helpdesk Technician", False),
            ("Systems Engineer", False)
        ],
        "weight": 0.12
    },
    "Finance": {
        "roles": [
            ("Chief Financial Officer", True),
            ("Senior Financial Controller", True),
            ("Payroll Administrator", True),
            ("Staff Accountant", False),
            ("Financial Analyst", False),
            ("Accounts Payable Specialist", False),
            ("Billing Coordinator", False)
        ],
        "weight": 0.15
    },
    "Engineering": {
        "roles": [
            ("Principal Software Engineer", True),
            ("Senior Backend Developer", False),
            ("Frontend Developer", False),
            ("QA Automation Engineer", False),
            ("Site Reliability Engineer", True),
            ("Firmware Engineer", False),
            ("Data Scientist", False)
        ],
        "weight": 0.22
    },
    "Operations": {
        "roles": [
            ("VP of Global Operations", True),
            ("Supply Chain Director", True),
            ("Logistics Coordinator", False),
            ("Inventory Manager", False),
            ("Procurement Specialist", False),
            ("Operations Analyst", False)
        ],
        "weight": 0.16
    },
    "Human Resources": {
        "roles": [
            ("HR Director", True),
            ("HR Business Partner", False),
            ("Talent Acquisition Lead", False),
            ("Benefits Administrator", True),
            ("HR Generalist", False),
            ("Recruiter", False)
        ],
        "weight": 0.08
    },
    "Sales": {
        "roles": [
            ("VP of Enterprise Sales", True),
            ("Strategic Account Executive", False),
            ("Sales Development Rep", False),
            ("Regional Sales Manager", False),
            ("Solutions Consultant", False)
        ],
        "weight": 0.12
    },
    "Marketing": {
        "roles": [
            ("Chief Marketing Officer", True),
            ("Product Marketing Manager", False),
            ("Content Strategist", False),
            ("Brand Designer", False),
            ("Digital Marketing Specialist", False)
        ],
        "weight": 0.06
    },
    "Legal": {
        "roles": [
            ("General Counsel", True),
            ("Compliance Director", True),
            ("Senior Corporate Counsel", False),
            ("Paralegal", False),
            ("Privacy Officer", True)
        ],
        "weight": 0.05
    },
    "Executive": {
        "roles": [
            ("Chief Executive Officer", True),
            ("Chief Information Security Officer", True),
            ("Chief Technology Officer", True),
            ("Executive Assistant", True)
        ],
        "weight": 0.04
    }
}

REUSE_ROOT_WORDS = [
    "Company", "Lexicon", "Enterprise", "Welcome", "Summer", "Winter", "Spring", "Autumn",
    "Admin", "Password", "Finance", "Engineering", "Operations", "Access", "Secure", "Login",
    "Office", "Server", "Portal", "Master", "System", "Domain", "Global", "Cyber", "Cloud",
    "Corporate", "Network", "Gateway", "Database", "Manager", "Service", "Central", "Direct",
    "Connect", "Account", "Matrix", "Nexus", "Summit", "Shield", "Sentinel", "Horizon"
]

PASSPHRASE_WORDS = [
    "correct", "horse", "battery", "staple", "blue", "mountain", "river", "falcon", "solar",
    "forest", "whisper", "crimson", "silent", "beacon", "shadow", "summit", "timber", "canyon",
    "harbor", "anchor", "silver", "planet", "galaxy", "rocket", "meadow", "cascade", "glacier",
    "thunder", "crystal", "bridge", "tunnel", "island", "valley", "falcon", "badger", "dragon",
    "phoenix", "griffin", "breeze", "aurora", "comet", "nebula", "radiant", "zenith", "vanguard"
]

KEYBOARD_WALKS = [
    "1qaz2wsx", "1qaz!QAZ", "qwerty1234", "asdfgh123", "zxcvbn123", "!q@w#e$r", "qwer1234!",
    "1234qwer", "12345678aA!", "qazwsxedc", "zaq12wsx", "0987654321", "1234567890!@"
]

DEFAULT_PROVISIONED_PREFIXES = [
    "Welcome", "TempPass", "ChangeMe", "Initial", "Start", "NewUser", "Provision", "ResetMe",
    "Default", "FirstLogin", "Setup", "WelcomeToLexicon", "Onboarding"
]

COMMON_WEAK_PASSWORDS = [
    "Password123!", "Welcome2026!", "Company2026!", "Summer2026!", "Winter2025!", "Spring2026!",
    "Admin@123", "Finance2026!", "P@ssword2026", "Enterprise2026!", "Access2026!", "Lexicon2026!",
    "Password12345", "Welcome123!", "Summer2025!", "Company123!", "Office2026!", "Global2026!",
    "Secure123!", "Server2026!", "DomainAdmin1!", "Qwerty1234!", "ChangeMe2026!", "LetMeIn2026!",
    "Testing123!", "Support2026!", "Corporate123!", "November2025!", "December2025!", "January2026!",
    "Autumn2025!", "Password2026!", "Welcome2025#", "LexiconSecure1!", "CompanySummer2026!"
]

DOMAIN_NAME = "lexicon.corp"
