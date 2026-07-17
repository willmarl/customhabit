from datetime import date


def normalize_round_robin_items(items: list[str] | None) -> list[str]:
    """Trim names, drop blanks, reject duplicates (case-insensitive)."""
    if not items:
        return []
    seen: set[str] = set()
    normalized: list[str] = []
    for raw in items:
        name = raw.strip()
        if not name:
            continue
        key = name.casefold()
        if key in seen:
            continue
        seen.add(key)
        normalized.append(name)
    return normalized


def resolve_round_robin_item(
    items: list[str] | None,
    started_on: date | None,
    target_date: date,
) -> str | None:
    """Pick the member for `target_date`, or None if inactive / before anchor."""
    if not items or started_on is None:
        return None
    if target_date < started_on:
        return None
    offset = (target_date - started_on).days % len(items)
    return items[offset]
