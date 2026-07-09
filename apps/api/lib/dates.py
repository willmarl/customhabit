from datetime import date, datetime, timedelta


def parse_hhmm(value: str) -> tuple[int, int]:
    hour, minute = map(int, value.split(":"))
    return hour, minute


def minutes_since_midnight(moment: datetime) -> int:
    return moment.hour * 60 + moment.minute


def resolve_habit_date(
    now: datetime | None = None,
    day_start: str = "04:00",
) -> date:
    """Anki-style habit day: before day_start counts as the previous calendar date."""
    moment = now or datetime.now()
    start_hour, start_minute = parse_hhmm(day_start)
    start_mins = start_hour * 60 + start_minute
    if minutes_since_midnight(moment) < start_mins:
        return (moment - timedelta(days=1)).date()
    return moment.date()
