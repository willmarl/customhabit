"""Pure rules for the casino: gold odds, wheels, and bonus effort."""

import secrets

COLORS = ("rose", "orange", "yellow", "green", "blue", "violet")

# 50 equal slices: 20/15/10/4/1 = 40/30/20/8/2 percent.
# Rarer labels sit between T1s so a miss can slide past them.
_PATTERN = ["T1", "T2", "T1", "T3", "T1", "T2", "BONUS", "T1", "T2", "T3"]
MAIN_SLICES: list[str] = _PATTERN * 5
MAIN_SLICES[46] = "JACKPOT"

BONUS_SEGMENTS = ("75", "50", "EXTRA", "25", "FREE")
BONUS_WEIGHTS = (40, 25, 18, 12, 5)
DISCOUNT_SEGMENTS = frozenset({"75", "50", "25"})


def gold_chance(duration_minutes: int) -> float:
    """One token always. Duration only moves the gold probability."""
    raw = 0.04 * duration_minutes / 10
    return max(0.02, min(0.20, raw))


def roll_color(duration_minutes: int) -> str:
    if secrets.randbelow(10_000) / 10_000 < gold_chance(duration_minutes):
        return "gold"
    return COLORS[secrets.randbelow(len(COLORS))]


def roll_main_slice() -> int:
    return secrets.randbelow(len(MAIN_SLICES))


def roll_bonus_segment() -> str:
    total = sum(BONUS_WEIGHTS)
    pick = secrets.randbelow(total)
    acc = 0
    for name, weight in zip(BONUS_SEGMENTS, BONUS_WEIGHTS):
        acc += weight
        if pick < acc:
            return name
    return BONUS_SEGMENTS[-1]


def bonus_work_minutes(percent: int, duration_minutes: int) -> int:
    """Extra work that still fits in the 10-minute window.

    Long habits use a 10-minute slice so 50% of 45 minutes is 5 minutes,
    not 22. Short habits use their real length.
    """
    base = min(max(duration_minutes, 1), 10)
    rounded = int(percent * base / 100 + 0.5)
    return max(1, rounded)


def payout_tier(wheel_result: str, unlocked: int) -> tuple[int, bool]:
    """Return (paid tier, near_miss). Tier 0 means jackpot, paid separately."""
    if wheel_result == "JACKPOT":
        return 0, False
    if wheel_result == "BONUS":
        return unlocked, False
    landed = {"T1": 1, "T2": 2, "T3": 3}[wheel_result]
    paid = min(landed, max(1, unlocked))
    return paid, landed > unlocked
