from fastapi import FastAPI, File, UploadFile, Form
from pydantic import BaseModel
from inference.predictor import FakeNewsPredictor
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

model_path = os.path.join(BASE_DIR, "..", "checkpoints", "best_model.pt")

predictor = FakeNewsPredictor(model_path)


# ✅ Response schema
class PredictResponse(BaseModel):
    label: str
    confidence: float
    explanation: str


@app.get("/health")
def health():
    return {"status": "ok"}


# ✅ SINGLE correct endpoint
@app.post("/predict", response_model=PredictResponse)
async def predict(
    title: str = Form(...),
    body: str = Form(""),
    image: UploadFile = File(None)
):
    image_bytes = None

    if image:
        image_bytes = await image.read()

    result = predictor.predict(
        title=title,
        body=body,
        image_bytes=image_bytes   
    )

    return result