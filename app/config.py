from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "BullCompass"
    MODEL_NAME: str = "qwen2.5:3b-instruct"
    OLLAMA_HOST: str = "http://localhost:11434"

    model_config = SettingsConfigDict(env_file=".env")


settings = Settings()