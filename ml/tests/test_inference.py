import time
from fastapi.testclient import TestClient

import ml.inference.app as inference_app


class DummyPredictor:
    device = "cpu"

    def predict(self, title, body="", image_url=None, image_bytes=None):
        modality = "multimodal" if image_bytes else "text_only"
        return {
            "label": "REAL",
            "confidence": 0.88,
            "explanation": "Dummy model output for tests",
            "modality": modality,
        }


def build_client():
    inference_app.predictor = DummyPredictor()
    return TestClient(inference_app.app)


class TestHealthEndpoint:
    def test_health_check(self):
        client = build_client()
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "ok"
        assert response.json()["model_loaded"] is True


class TestPredictEndpoint:
    def test_predict_text_only(self):
        client = build_client()
        response = client.post("/predict", data={"title": "Test headline for prediction", "body": "Test body"})
        assert response.status_code == 200
        data = response.json()
        assert data["label"] in ["REAL", "FAKE"]
        assert 0 <= data["confidence"] <= 1
        assert data["modality"] == "text_only"
        assert "explanation" in data

    def test_predict_empty_title_fails(self):
        client = build_client()
        # Use whitespace so request passes "required" validation and reaches app-level title check.
        response = client.post("/predict", data={"title": "   ", "body": "Some body"})
        assert response.status_code == 400

    def test_predict_missing_title_fails(self):
        client = build_client()
        response = client.post("/predict", data={"body": "Only body, no title"})
        assert response.status_code == 422


class TestPerformance:
    def test_prediction_latency(self):
        client = build_client()
        start = time.time()
        response = client.post("/predict", data={"title": "Performance test headline", "body": "Performance test body"})
        elapsed = time.time() - start
        assert response.status_code == 200
        assert elapsed < 5.0
