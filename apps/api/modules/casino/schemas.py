from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class CasinoToken(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    color: str
    habit_id: int = Field(index=True)
    earned_on: date = Field(index=True)
    source: str
    created_at: datetime = Field(default_factory=datetime.now)
    spent_at: Optional[datetime] = None
    spent_play_id: Optional[int] = None


class CasinoPlay(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    habit_id: int = Field(index=True)
    earned_on: date = Field(index=True)
    phase: str = "awaiting_draw"
    origin: str = "completion"
    parent_play_id: Optional[int] = None
    unlocked_tier: int = 1
    cashed_in: bool = False
    token_id: Optional[int] = None
    slice_index: Optional[int] = None
    wheel_result: Optional[str] = None
    reward_text: Optional[str] = None
    near_miss: bool = False
    bonus_segment: Optional[str] = None
    bonus_deadline: Optional[datetime] = None
    bonus_minutes: Optional[int] = None
    bonus_spins_left: int = 0
    forfeited: bool = False
    created_at: datetime = Field(default_factory=datetime.now)


class TokenRead(SQLModel):
    id: int
    color: str
    habit_id: int
    habit_name: str
    earned_on: date
    source: str
    created_at: datetime


class PlayRead(SQLModel):
    id: int
    habit_id: int
    habit_name: str
    duration_minutes: int
    earned_on: date
    phase: str
    origin: str
    unlocked_tier: int
    cashed_in: bool
    wheel_result: Optional[str] = None
    slice_index: Optional[int] = None
    reward_text: Optional[str] = None
    near_miss: bool = False
    bonus_segment: Optional[str] = None
    bonus_deadline: Optional[datetime] = None
    bonus_minutes: Optional[int] = None
    bonus_spins_left: int = 0
    token_id: Optional[int] = None
    token_color: Optional[str] = None
    forfeited: bool = False


class CasinoSettingsRead(SQLModel):
    tier1_reward: str
    tier2_reward: str
    tier3_reward: str
    jackpot_reward: str
    prize_mini_name: str
    prize_mini_tokens: int
    prize_mid_name: str
    prize_mid_tokens: int
    prize_moon_name: str
    prize_moon_tokens: int


class CasinoSettingsUpdate(SQLModel):
    tier1_reward: Optional[str] = None
    tier2_reward: Optional[str] = None
    tier3_reward: Optional[str] = None
    jackpot_reward: Optional[str] = None
    prize_mini_name: Optional[str] = None
    prize_mini_tokens: Optional[int] = None
    prize_mid_name: Optional[str] = None
    prize_mid_tokens: Optional[int] = None
    prize_moon_name: Optional[str] = None
    prize_moon_tokens: Optional[int] = None


class CasinoEvent(SQLModel):
    kind: str
    play_id: int
    token_id: Optional[int] = None
    color: Optional[str] = None
    slice_index: Optional[int] = None
    wheel_result: Optional[str] = None
    reward_text: Optional[str] = None
    near_miss: bool = False
    unlocked_tier: Optional[int] = None
    bonus_segment: Optional[str] = None
    bonus_minutes: Optional[int] = None
    phase: Optional[str] = None


class CasinoState(SQLModel):
    tokens: list[TokenRead]
    plays: list[PlayRead]
    settings: CasinoSettingsRead
    pending_count: int
    server_now: datetime
    event: Optional[CasinoEvent] = None


class PlayAction(SQLModel):
    play_id: int


class CashInRequest(SQLModel):
    play_id: int
    token_ids: list[int]
