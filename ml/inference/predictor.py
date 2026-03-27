import torch
import sys
import os

# add parent path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ✅ correct import
from train.model import MultiModalFusionNet, ModelConfig

class FakeNewsPredictor:
    def __init__(self, model_path):
        self.device = torch.device("cpu")

        # ✅ create config (IMPORTANT)
        config = ModelConfig()

        # ✅ initialize model
        self.model = MultiModalFusionNet(config)

        # ✅ load weights
        self.model.load_state_dict(
            torch.load(model_path, map_location=self.device)
        )

        self.model.eval()

    def predict(self, title, body, image_url=None):
        # ⚠️ TEMP (we'll fix properly later)
        batch_size = 1

        input_ids = torch.randint(0, 1000, (batch_size, 10))
        attention_mask = torch.ones_like(input_ids)

        pixel_values = None  # no image for now

        with torch.no_grad():
            logits = self.model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                pixel_values=pixel_values
            )

        probs = torch.softmax(logits, dim=-1)
        pred = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred].item()

        label = "FAKE" if pred == 1 else "REAL"

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "explanation": "Model prediction (temp input)"
        }