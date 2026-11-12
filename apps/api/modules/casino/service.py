from datetime import date, datetime, timedelta

from fastapi import HTTPException
from sqlmodel import Session, select

from modules.habits.schemas import Habit
from modules.settings.schemas import AppSettings
from modules.settings.service import SettingsService

from .logic import (
    DISCOUNT_SEGMENTS,
    MAIN_SLICES,
    bonus_work_minutes,
    payout_tier,
    roll_bonus_segment,
    roll_color,
    roll_main_slice,
)
from .schemas import (
    CasinoEvent,
    CasinoPlay,
    CasinoSettingsRead,
    CasinoSettingsUpdate,
    CasinoState,
    CasinoToken,
    PlayRead,
    TokenRead,
)

PHASE_RANK = {"bonus": 0, "drawn": 1, "awaiting_draw": 2}
NAME_LIMIT = 80


class CasinoService:
    def __init__(self, session: Session):
        self.session = session

    def queue_completion_play(self, habit: Habit, earned_on: date) -> None:
        if not habit.reward_enabled or habit.linked_sub_group_id is not None:
            return
        if habit.id is None:
            return
        existing = self.session.exec(
            select(CasinoPlay).where(
                CasinoPlay.habit_id == habit.id,
                CasinoPlay.earned_on == earned_on,
                CasinoPlay.origin == "completion",
            )
        ).first()
        if existing:
            return
        self.session.add(
            CasinoPlay(
                habit_id=habit.id,
                earned_on=earned_on,
                phase="awaiting_draw",
                origin="completion",
            )
        )

    def cancel_undrawn_play(self, habit_id: int, earned_on: date) -> None:
        play = self.session.exec(
            select(CasinoPlay).where(
                CasinoPlay.habit_id == habit_id,
                CasinoPlay.earned_on == earned_on,
                CasinoPlay.origin == "completion",
                CasinoPlay.phase == "awaiting_draw",
            )
        ).first()
        if play:
            self.session.delete(play)

    def get_state(self, event: CasinoEvent | None = None) -> CasinoState:
        self._close_stale_plays()
        return self._state(event)

    def draw(self, play_id: int) -> CasinoState:
        self._close_stale_plays()
        play = self._require(play_id)
        if play.phase != "awaiting_draw":
            raise HTTPException(status_code=400, detail="That play is not waiting for a draw.")
        habit = self._habit(play.habit_id)
        color = roll_color(habit.duration_minutes if habit else 10)
        token = CasinoToken(
            color=color,
            habit_id=play.habit_id,
            earned_on=play.earned_on,
            source="completion" if play.origin == "completion" else "bonus",
        )
        self.session.add(token)
        self.session.flush()
        play.token_id = token.id
        play.phase = "drawn"
        self.session.add(play)
        self.session.commit()
        event = CasinoEvent(
            kind="draw",
            play_id=play_id,
            token_id=token.id,
            color=color,
            phase="drawn",
        )
        return self._state(event)

    def cash_in(self, play_id: int, token_ids: list[int]) -> CasinoState:
        self._close_stale_plays()
        play = self._require(play_id)
        if play.phase != "drawn":
            raise HTTPException(status_code=400, detail="Cash in before the spin.")
        if play.cashed_in:
            raise HTTPException(status_code=400, detail="This spin already cashed in.")
        if len(token_ids) != len(set(token_ids)):
            raise HTTPException(status_code=400, detail="Each token can only be spent once.")

        tokens = self._jar_tokens(token_ids)
        tier = self._tier_for(tokens)
        now = datetime.now()
        for token in tokens:
            token.spent_at = now
            token.spent_play_id = play.id
            self.session.add(token)
        play.unlocked_tier = tier
        play.cashed_in = True
        self.session.add(play)
        self.session.commit()
        event = CasinoEvent(
            kind="cash_in",
            play_id=play_id,
            unlocked_tier=tier,
            phase="drawn",
        )
        return self._state(event)

    def spin(self, play_id: int) -> CasinoState:
        self._close_stale_plays()
        play = self._require(play_id)
        if play.phase != "drawn":
            raise HTTPException(status_code=400, detail="Draw a token before spinning.")
        settings = self._settings()
        index = roll_main_slice()
        result = MAIN_SLICES[index]
        paid, near = payout_tier(result, play.unlocked_tier)
        play.slice_index = index
        play.wheel_result = result
        play.near_miss = near
        if result == "JACKPOT":
            play.reward_text = _jackpot_label(settings)
            play.phase = "bonus" if play.bonus_spins_left > 0 else "done"
        elif result == "BONUS":
            play.reward_text = _tier_label(play.unlocked_tier, settings)
            play.bonus_spins_left += 1
            play.phase = "bonus"
        else:
            play.reward_text = _tier_label(paid, settings)
            play.phase = "bonus" if play.bonus_spins_left > 0 else "done"
        self.session.add(play)
        self.session.commit()
        event = CasinoEvent(
            kind="spin",
            play_id=play_id,
            slice_index=index,
            wheel_result=result,
            reward_text=play.reward_text,
            near_miss=near,
            unlocked_tier=play.unlocked_tier,
            phase=play.phase,
        )
        return self._state(event)

    def bonus_spin(self, play_id: int) -> CasinoState:
        self._close_stale_plays()
        play = self._require(play_id)
        if play.phase != "bonus":
            raise HTTPException(status_code=400, detail="The bonus wheel is not up.")
        if play.bonus_deadline is not None and play.bonus_segment in DISCOUNT_SEGMENTS:
            raise HTTPException(
                status_code=400,
                detail="Finish the bonus task before spinning again.",
            )
        if play.bonus_spins_left <= 0:
            raise HTTPException(status_code=400, detail="No bonus spins left.")

        play.bonus_spins_left -= 1
        segment = roll_bonus_segment()
        play.bonus_segment = segment
        token_id = None
        color = None
        minutes = None
        habit = self._habit(play.habit_id)
        duration = habit.duration_minutes if habit else 10

        if segment in DISCOUNT_SEGMENTS:
            minutes = bonus_work_minutes(int(segment), duration)
            play.bonus_minutes = minutes
            play.bonus_deadline = datetime.now() + timedelta(minutes=10)
        elif segment == "FREE":
            color = roll_color(duration)
            token = self._add_token(play, color, "bonus")
            token_id = token.id
            play.bonus_minutes = None
            play.bonus_deadline = None
            if play.bonus_spins_left <= 0:
                play.phase = "done"
        elif segment == "EXTRA":
            play.bonus_spins_left += 2
            play.bonus_minutes = None
            play.bonus_deadline = None

        self.session.add(play)
        self.session.commit()
        event = CasinoEvent(
            kind="bonus_spin",
            play_id=play_id,
            token_id=token_id,
            color=color,
            bonus_segment=segment,
            bonus_minutes=minutes,
            phase=play.phase,
            reward_text=play.reward_text,
        )
        return self._state(event)

    def complete_bonus(self, play_id: int) -> CasinoState:
        pending = self.session.get(CasinoPlay, play_id)
        if (
            pending
            and pending.phase == "bonus"
            and pending.bonus_deadline is not None
            and datetime.now() > pending.bonus_deadline
        ):
            pending.phase = "done"
            pending.bonus_spins_left = 0
            pending.forfeited = True
            pending.bonus_deadline = None
            self.session.add(pending)
            self.session.commit()
            raise HTTPException(
                status_code=400,
                detail="Bonus window closed. No token. Your original reward stays.",
            )
        self._close_stale_plays()
        play = self._require(play_id)
        if play.phase != "bonus" or play.bonus_segment not in DISCOUNT_SEGMENTS:
            raise HTTPException(status_code=400, detail="There is no bonus task to finish.")
        if play.bonus_deadline is None:
            raise HTTPException(status_code=400, detail="There is no bonus task to finish.")

        habit = self._habit(play.habit_id)
        duration = habit.duration_minutes if habit else 10
        color = roll_color(duration)
        token = self._add_token(play, color, "bonus")
        follow = CasinoPlay(
            habit_id=play.habit_id,
            earned_on=play.earned_on,
            phase="drawn",
            origin="bonus",
            parent_play_id=play.id,
            token_id=token.id,
            bonus_spins_left=play.bonus_spins_left,
        )
        play.phase = "done"
        play.bonus_spins_left = 0
        play.bonus_deadline = None
        self.session.add(play)
        self.session.add(follow)
        self.session.commit()
        self.session.refresh(follow)
        event = CasinoEvent(
            kind="bonus_complete",
            play_id=follow.id or play_id,
            token_id=token.id,
            color=color,
            phase="drawn",
            reward_text=play.reward_text,
        )
        return self._state(event)

    def update_settings(self, data: CasinoSettingsUpdate) -> CasinoState:
        settings = SettingsService(self.session)._ensure()
        payload = data.model_dump(exclude_unset=True)
        for key in (
            "tier1_reward",
            "tier2_reward",
            "tier3_reward",
            "jackpot_reward",
            "prize_mini_name",
            "prize_mid_name",
            "prize_moon_name",
        ):
            if key in payload and payload[key] is not None:
                text = str(payload[key]).strip()
                if len(text) > NAME_LIMIT:
                    raise HTTPException(
                        status_code=400,
                        detail=f"{key} must be {NAME_LIMIT} characters or fewer.",
                    )
                setattr(settings, f"casino_{key}", text)

        counts = {
            "prize_mini_tokens": settings.casino_prize_mini_tokens,
            "prize_mid_tokens": settings.casino_prize_mid_tokens,
            "prize_moon_tokens": settings.casino_prize_moon_tokens,
        }
        for key in counts:
            if key in payload and payload[key] is not None:
                value = payload[key]
                if value < 1:
                    raise HTTPException(
                        status_code=400, detail="Prize lines need at least 1 token."
                    )
                counts[key] = value
        if not (
            counts["prize_mini_tokens"]
            < counts["prize_mid_tokens"]
            < counts["prize_moon_tokens"]
        ):
            raise HTTPException(
                status_code=400,
                detail="Prize lines must increase: mini, then mid, then moonshot.",
            )
        settings.casino_prize_mini_tokens = counts["prize_mini_tokens"]
        settings.casino_prize_mid_tokens = counts["prize_mid_tokens"]
        settings.casino_prize_moon_tokens = counts["prize_moon_tokens"]
        self.session.add(settings)
        self.session.commit()
        return self._state(None)

    def _add_token(self, play: CasinoPlay, color: str, source: str) -> CasinoToken:
        token = CasinoToken(
            color=color,
            habit_id=play.habit_id,
            earned_on=play.earned_on,
            source=source,
        )
        self.session.add(token)
        self.session.flush()
        return token

    def _tier_for(self, tokens: list[CasinoToken]) -> int:
        if len(tokens) == 1 and tokens[0].color == "gold":
            return 3
        if len(tokens) in (2, 3):
            colors = {token.color for token in tokens}
            if len(colors) == 1 and "gold" not in colors:
                return 3 if len(tokens) == 3 else 2
        raise HTTPException(
            status_code=400,
            detail="Cash in 2 matching tokens, 3 matching tokens, or 1 gold.",
        )

    def _jar_tokens(self, token_ids: list[int]) -> list[CasinoToken]:
        if not token_ids:
            raise HTTPException(
                status_code=400,
                detail="Cash in 2 matching tokens, 3 matching tokens, or 1 gold.",
            )
        rows = list(
            self.session.exec(
                select(CasinoToken).where(CasinoToken.id.in_(token_ids))
            ).all()
        )
        by_id = {row.id: row for row in rows}
        if len(by_id) != len(token_ids) or any(
            by_id[token_id].spent_at is not None for token_id in token_ids
        ):
            raise HTTPException(status_code=400, detail="Those tokens are not in the jar.")
        return [by_id[token_id] for token_id in token_ids]

    def _require(self, play_id: int) -> CasinoPlay:
        play = self.session.get(CasinoPlay, play_id)
        if not play or play.phase == "done":
            raise HTTPException(status_code=404, detail="Play not found.")
        return play

    def _habit(self, habit_id: int) -> Habit | None:
        return self.session.get(Habit, habit_id)

    def _settings(self) -> AppSettings:
        return SettingsService(self.session)._ensure()

    def _close_stale_plays(self) -> None:
        now = datetime.now()
        changed = False
        open_plays = list(
            self.session.exec(
                select(CasinoPlay).where(CasinoPlay.phase != "done")
            ).all()
        )
        habit_ids = {
            habit.id
            for habit in self.session.exec(select(Habit)).all()
            if habit.id is not None
        }
        for play in open_plays:
            if play.habit_id not in habit_ids:
                play.phase = "done"
                play.forfeited = True
                play.bonus_deadline = None
                self.session.add(play)
                changed = True
                continue
            if (
                play.phase == "bonus"
                and play.bonus_deadline is not None
                and play.bonus_deadline < now
                and play.bonus_segment in DISCOUNT_SEGMENTS
            ):
                play.phase = "done"
                play.forfeited = True
                play.bonus_spins_left = 0
                play.bonus_deadline = None
                self.session.add(play)
                changed = True
        if changed:
            self.session.commit()

    def _state(self, event: CasinoEvent | None) -> CasinoState:
        settings = self._settings()
        habits = {
            habit.id: habit
            for habit in self.session.exec(select(Habit)).all()
            if habit.id is not None
        }
        tokens = list(
            self.session.exec(
                select(CasinoToken)
                .where(CasinoToken.spent_at.is_(None))
                .order_by(CasinoToken.id)
            ).all()
        )
        token_colors = {
            token.id: token.color for token in tokens if token.id is not None
        }

        plays = list(
            self.session.exec(
                select(CasinoPlay).where(CasinoPlay.phase != "done")
            ).all()
        )
        plays.sort(key=lambda play: (PHASE_RANK.get(play.phase, 9), play.id or 0))

        return CasinoState(
            tokens=[_token_read(token, habits) for token in tokens if token.id is not None],
            plays=[
                _play_read(play, habits, token_colors)
                for play in plays
                if play.id is not None
            ],
            settings=_settings_read(settings),
            pending_count=len(plays),
            server_now=datetime.now(),
            event=event,
        )


def _habit_name(habits: dict[int, Habit], habit_id: int) -> str:
    habit = habits.get(habit_id)
    return habit.name if habit else "Removed habit"


def _token_read(token: CasinoToken, habits: dict[int, Habit]) -> TokenRead:
    return TokenRead(
        id=token.id or 0,
        color=token.color,
        habit_id=token.habit_id,
        habit_name=_habit_name(habits, token.habit_id),
        earned_on=token.earned_on,
        source=token.source,
        created_at=token.created_at,
    )


def _play_read(
    play: CasinoPlay,
    habits: dict[int, Habit],
    token_colors: dict[int, str],
) -> PlayRead:
    habit = habits.get(play.habit_id)
    return PlayRead(
        id=play.id or 0,
        habit_id=play.habit_id,
        habit_name=_habit_name(habits, play.habit_id),
        duration_minutes=habit.duration_minutes if habit else 10,
        earned_on=play.earned_on,
        phase=play.phase,
        origin=play.origin,
        unlocked_tier=play.unlocked_tier,
        cashed_in=play.cashed_in,
        wheel_result=play.wheel_result,
        slice_index=play.slice_index,
        reward_text=play.reward_text,
        near_miss=play.near_miss,
        bonus_segment=play.bonus_segment,
        bonus_deadline=play.bonus_deadline,
        bonus_minutes=play.bonus_minutes,
        bonus_spins_left=play.bonus_spins_left,
        token_id=play.token_id,
        token_color=token_colors.get(play.token_id) if play.token_id else None,
        forfeited=play.forfeited,
    )


def _settings_read(settings: AppSettings) -> CasinoSettingsRead:
    return CasinoSettingsRead(
        tier1_reward=settings.casino_tier1_reward,
        tier2_reward=settings.casino_tier2_reward,
        tier3_reward=settings.casino_tier3_reward,
        jackpot_reward=settings.casino_jackpot_reward,
        prize_mini_name=settings.casino_prize_mini_name,
        prize_mini_tokens=settings.casino_prize_mini_tokens,
        prize_mid_name=settings.casino_prize_mid_name,
        prize_mid_tokens=settings.casino_prize_mid_tokens,
        prize_moon_name=settings.casino_prize_moon_name,
        prize_moon_tokens=settings.casino_prize_moon_tokens,
    )


def _tier_label(tier: int, settings: AppSettings) -> str:
    raw = {
        1: settings.casino_tier1_reward,
        2: settings.casino_tier2_reward,
        3: settings.casino_tier3_reward,
    }.get(tier, "")
    text = (raw or "").strip()
    return text or f"Tier {tier}"


def _jackpot_label(settings: AppSettings) -> str:
    text = (settings.casino_jackpot_reward or "").strip()
    return text or "Jackpot"
