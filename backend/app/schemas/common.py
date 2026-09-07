"""Common response models and metadata schemas."""

from typing import Any
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    ok: bool = True
    app: str = "PromptBuddy"
    version: str
    framework_count: int
    max_prompt_length: int


class FrameworkCategory(BaseModel):
    key: str
    label: str


class FrameworkOption(BaseModel):
    value: str
    label: str
    category: str
    desc: str


class IntentsResponse(BaseModel):
    intents: list[FrameworkOption]
    categories: list[FrameworkCategory]
    total: int


class ModelOption(BaseModel):
    id: str
    name: str
    recommended: bool = False
    context_length: int = 128000


class ModelsResponse(BaseModel):
    models: list[ModelOption]
    default_model: str
