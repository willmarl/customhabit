from sqlmodel import Session

from .schemas import AppSettings, AppSettingsRead, AppSettingsUpdate


class SettingsService:
    def __init__(self, session: Session):
        self.session = session

    def get(self) -> AppSettingsRead:
        settings = self.session.get(AppSettings, 1)
        if not settings:
            settings = AppSettings(id=1, lookback_days=7)
            self.session.add(settings)
            self.session.commit()
            self.session.refresh(settings)
        return AppSettingsRead(lookback_days=settings.lookback_days)

    def update(self, data: AppSettingsUpdate) -> AppSettingsRead:
        settings = self.session.get(AppSettings, 1)
        if not settings:
            settings = AppSettings(id=1, lookback_days=7)
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(settings, key, value)
        self.session.add(settings)
        self.session.commit()
        self.session.refresh(settings)
        return AppSettingsRead(lookback_days=settings.lookback_days)
