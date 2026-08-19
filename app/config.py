from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "BullCompass"
    MODEL_NAME: str = "qwen2.5:3b-instruct"
    OLLAMA_HOST: str = "http://localhost:11434"

    # Market Data Provider Configuration
    MARKET_DATA_PROVIDER: str = "nse"  # "nse", "angelone", "dhan", "live", "yfinance"
    ANGELONE_API_KEY: Optional[str] = None
    ANGELONE_CLIENT_ID: Optional[str] = None
    ANGELONE_PASSWORD: Optional[str] = None
    ANGELONE_PIN: Optional[str] = None
    ANGELONE_TOTP_SECRET: Optional[str] = None

    DHAN_CLIENT_ID: Optional[str] = None
    DHAN_ACCESS_TOKEN: Optional[str] = None
    QUOTE_CACHE_TTL_SECONDS: int = 8

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()