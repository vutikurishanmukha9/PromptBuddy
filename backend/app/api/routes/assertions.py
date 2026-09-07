"""Assertion matrix routes."""

from fastapi import APIRouter
from app.schemas.assertions import (
    AssertionRequest,
    AssertionResponse,
    RulesCatalogResponse,
)
from app.engines.assertion_engine import (
    evaluate_all_assertions,
    RULE_DESCRIPTORS,
)

router = APIRouter(prefix="/assertions", tags=["Evaluation & Assertions"])


@router.post("/evaluate", response_model=AssertionResponse)
async def evaluate_assertions_endpoint(req: AssertionRequest) -> AssertionResponse:
    res = evaluate_all_assertions(req.text, req.rules)
    return AssertionResponse(**res)


@router.get("/rules", response_model=RulesCatalogResponse)
async def list_rules_catalog() -> RulesCatalogResponse:
    return RulesCatalogResponse(
        rules=RULE_DESCRIPTORS,
        total=len(RULE_DESCRIPTORS),
    )
