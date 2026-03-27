from fastapi import FastAPI
from pydantic import BaseModel
from inference.predictor import FakeNewsPredictor

import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "..", "checkpoints", "best_model.pt")

predictor = FakeNewsPredictor(model_path)



# ✅ load model ONCE


class PredictRequest(BaseModel):
    title: str
    body: str = ""
    image_url: str | None = None

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/predict")
def predict(req: PredictRequest):
    result = predictor.predict(
        title=req.title,
        body=req.body,
        image_url=req.image_url
    )
    return result


class PredictResponse(BaseModel):
    label: str
    confidence: float
    explanation: str

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    result = predictor.predict(
        title=req.title,
        body=req.body,
        image_url=req.image_url
    )
    return result