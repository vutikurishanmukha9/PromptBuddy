"""Core configuration module for PromptBuddy."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_version: str = "5.0.0"
    app_title: str = "PromptBuddy Enterprise"
    log_level: str = "INFO"
    
    # OpenRouter API
    openrouter_api_key: str = ""
    openrouter_base_url: str = "https://openrouter.ai/api/v1"
    openrouter_site_url: str = "https://promptbuddy.app"
    openrouter_app_title: str = "PromptBuddy"
    openrouter_default_model: str = ""
    openrouter_timeout_seconds: float = 60.0
    
    # Operational constraints
    max_prompt_length: int = 8000
    allowed_origins: list[str] = ["*"]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
