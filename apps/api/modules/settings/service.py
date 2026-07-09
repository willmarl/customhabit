from fastapi import HTTPException
from sqlmodel import Session

from .schemas import AppSettings, AppSettingsRead, AppSettingsUpdate, is_valid_time_hhmm


class SettingsService:
    def __init__(self, session: Session):
        self.session = session

    def _ensure(self) -> AppSettings:
        settings = self.session.get(AppSettings, 1)
        if not settings:
            settings = AppSettings(id=1)
            self.session.add(settings)
            self.session.commit()
            self.session.refresh(settings)
        return settings

    def _to_read(self, settings: AppSettings) -> AppSettingsRead:
        return AppSettingsRead.model_validate(settings)

    def get(self) -> AppSettingsRead:
        return self._to_read(self._ensure())

    def update(self, data: AppSettingsUpdate) -> AppSettingsRead:
        settings = self._ensure()
        payload = data.model_dump(exclude_unset=True)

        if "lookback_days" in payload and payload["lookback_days"] < 1:
            raise HTTPException(status_code=400, detail="lookback_days must be at least 1")
        if "break_minutes" in payload and payload["break_minutes"] < 0:
            raise HTTPException(status_code=400, detail="break_minutes cannot be negative")
        if "default_habit_minutes" in payload and payload["default_habit_minutes"] < 1:
            raise HTTPException(status_code=400, detail="default_habit_minutes must be at least 1")
        if "playlist_minutes" in payload and payload["playlist_minutes"] < 1:
            raise HTTPException(status_code=400, detail="playlist_minutes must be at least 1")
        if "loop_exempt_below_minutes" in payload and payload["loop_exempt_below_minutes"] < 0:
            raise HTTPException(
                status_code=400, detail="loop_exempt_below_minutes cannot be negative"
            )
        for key in ("wake_time", "bed_time", "day_start_time"):
            if key in payload and not is_valid_time_hhmm(payload[key]):
                raise HTTPException(status_code=400, detail=f"{key} must be HH:MM (24h)")

        for key, value in payload.items():
            setattr(settings, key, value)
        self.session.add(settings)
        self.session.commit()
        self.session.refresh(settings)
        return self._to_read(settings)
