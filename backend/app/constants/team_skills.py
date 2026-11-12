
TEAM_SKILL_CATALOGUE = (
    # Frontend
    "HTML",
    "CSS",
    "JavaScript",
    "TypeScript",
    "React",
    "Next.js",
    "Angular",
    "Vue.js",

    # Backend
    "Python",
    "FastAPI",
    "Django",
    "Node.js",
    "Express.js",
    "Java",
    "Spring Boot",
    "C#",
    ".NET",
    "PHP",

    # Database
    "PostgreSQL",
    "MySQL",
    "MongoDB",
    "Redis",
    "Firebase",

    # AI and Data
    "Machine Learning",
    "Deep Learning",
    "Natural Language Processing",
    "Computer Vision",
    "Data Science",
    "Data Analysis",

    # Mobile
    "Flutter",
    "React Native",
    "Kotlin",
    "Swift",

    # Cloud and DevOps
    "Docker",
    "Kubernetes",
    "AWS",
    "Azure",
    "CI/CD",
    "Linux",

    # Design and Security
    "UI/UX Design",
    "Figma",
    "Cybersecurity",

    # General Development
    "Git",
    "GitHub",
    "REST API Development",
    "Software Testing",
)

TEAM_SKILL_LOOKUP = {
    skill.casefold(): skill
    for skill in TEAM_SKILL_CATALOGUE
}


def normalize_skill(skill: str) -> str:
    """Normalize a skill for case-insensitive comparison."""
    return " ".join(skill.strip().split()).casefold()


def get_canonical_skill(skill: str) -> str | None:
    """Return the catalogue spelling, or None if unsupported."""
    return TEAM_SKILL_LOOKUP.get(normalize_skill(skill))
