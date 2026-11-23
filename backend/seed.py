"""
Seeds one admin account and the 10 aptitude questions (3 given in the
assignment + 7 original ones, >=3 per category). Run with:

    python seed.py
"""
from app.database import Base, engine, SessionLocal
from app.models.admin import Admin
from app.models.question import Question, Category, Difficulty
from app.models.settings import TestSettings
from app.models import candidate, attempt  # noqa: F401 — register ALL tables so create_all builds them
from app.auth import hash_password
from app.config import settings

Base.metadata.create_all(bind=engine)
db = SessionLocal()

# --- Admin -------------------------------------------------------------
if not db.query(Admin).filter(Admin.email == settings.admin_seed_email).first():
    db.add(Admin(email=settings.admin_seed_email, password_hash=hash_password(settings.admin_seed_password)))
    print(f"Seeded admin: {settings.admin_seed_email} / {settings.admin_seed_password}")

# --- Settings ------------------------------------------------------------
if not db.query(TestSettings).first():
    db.add(TestSettings(test_duration_minutes=15, pass_percentage=60.0))

# --- Questions -----------------------------------------------------------
QUESTIONS = [
    # 3 given in the assignment
    dict(
        text="A subscription business plans a 20% price increase. What is the largest share of its customers it can lose before monthly revenue falls below today's level?",
        option_a="16.7%", option_b="20%", option_c="15%", option_d="18.3%",
        correct_option="A", category=Category.QUANTITATIVE, difficulty=Difficulty.MEDIUM,
    ),
    dict(
        text="Six client meetings (P, Q, R, S, T, U) are scheduled Monday to Saturday, one per day. S is on Wednesday. R is the day immediately before U, and U is not on Saturday. Q is later in the week than both P and T. T is not on Monday. Which of the following must be true?",
        option_a="P is on Monday", option_b="Q is on Saturday", option_c="R is on Thursday", option_d="T is on Tuesday",
        correct_option="B", category=Category.LOGICAL_REASONING, difficulty=Difficulty.HARD,
    ),
    dict(
        text="Choose the grammatically correct sentence for a project update.",
        option_a="Neither the manager nor the analysts was aware of the change.",
        option_b="Neither the analysts nor the manager were aware of the change.",
        option_c="Neither the manager nor the analysts were aware of the change.",
        option_d="Neither the manager or the analysts were aware of the change.",
        correct_option="C", category=Category.VERBAL, difficulty=Difficulty.MEDIUM,
    ),
    # 7 original questions
    dict(
        text="A project team's budget is cut by 25%, then the reduced budget is increased by 25%. Compared with the original budget, the final budget is:",
        option_a="Unchanged", option_b="6.25% lower", option_c="6.25% higher", option_d="12.5% lower",
        correct_option="B", category=Category.QUANTITATIVE, difficulty=Difficulty.MEDIUM,
    ),
    dict(
        text="A sales team's revenue grew from \u20b940 lakh to \u20b954 lakh over two years, with equal percentage growth each year. What was the approximate annual growth rate?",
        option_a="15%", option_b="16%", option_c="17%", option_d="18%",
        correct_option="C", category=Category.QUANTITATIVE, difficulty=Difficulty.HARD,
    ),
    dict(
        text="A vendor invoice lists three line items whose costs are in the ratio 2:3:5, totalling \u20b980,000 before an 18% tax is applied uniformly. What is the tax amount on the largest line item?",
        option_a="\u20b97,200", option_b="\u20b97,920", option_c="\u20b98,000", option_d="\u20b97,500",
        correct_option="B", category=Category.QUANTITATIVE, difficulty=Difficulty.MEDIUM,
    ),
    dict(
        text="Four departments (HR, Finance, IT, Ops) must each send exactly one representative to a steering committee that meets on a different weekday (Mon-Thu). IT cannot meet on Monday. Finance meets the day right after HR. Ops meets before Finance. If HR does not meet on Monday, which day must IT meet?",
        option_a="Monday", option_b="Tuesday", option_c="Wednesday", option_d="Thursday",
        correct_option="D", category=Category.LOGICAL_REASONING, difficulty=Difficulty.HARD,
    ),
    dict(
        text="In a stack ranking of 5 employees by quarterly performance, Priya ranks above Raj but below Meera. Arjun ranks below Raj. Meera is not ranked first. Who could be ranked first?",
        option_a="Only Meera", option_b="Only Priya", option_c="Meera or Priya", option_d="Only Arjun",
        correct_option="C", category=Category.LOGICAL_REASONING, difficulty=Difficulty.MEDIUM,
    ),
    dict(
        text="\"The manager asked that all reports be submit before Friday.\" Which correction fixes this sentence?",
        option_a="Change 'be submit' to 'be submitted'", option_b="Change 'asked' to 'ask'",
        option_c="Change 'all reports' to 'all the report'", option_d="No correction needed",
        correct_option="A", category=Category.VERBAL, difficulty=Difficulty.EASY,
    ),
    dict(
        text="Choose the option that best completes the sentence: \"The new policy, along with its supporting guidelines, ___ due for review next quarter.\"",
        option_a="are", option_b="is", option_c="were", option_d="have been",
        correct_option="B", category=Category.VERBAL, difficulty=Difficulty.MEDIUM,
    ),
]

if db.query(Question).count() == 0:
    for q in QUESTIONS:
        db.add(Question(**q, is_active=True))
    print(f"Seeded {len(QUESTIONS)} questions.")
else:
    print("Questions already present — skipping question seed.")

db.commit()
db.close()
print("Done.")
