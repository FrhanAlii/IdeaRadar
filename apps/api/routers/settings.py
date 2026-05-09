from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class ScoringWeights(BaseModel):
    demand: int = 30
    mobile_fit: int = 25
    monetization: int = 20
    buildability: int = 15
    competition: int = 10


@router.get("/weights")
def get_weights():
    return ScoringWeights().model_dump()


@router.post("/weights")
def update_weights(weights: ScoringWeights):
    return weights.model_dump()
