import torch
import sys
import os
from transformers import AutoTokenizer
from PIL import Image
from torchvision import transforms
from io import BytesIO

# add parent path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from train.model import MultiModalFusionNet, ModelConfig


class FakeNewsPredictor:
    def __init__(self, model_path):
        self.device = torch.device("cpu")

        # ✅ tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained("roberta-base")

        # ✅ config + model
        config = ModelConfig()
        self.model = MultiModalFusionNet(config)

        # ✅ load weights
        self.model.load_state_dict(
            torch.load(model_path, map_location=self.device)
        )

        self.model.to(self.device)
        self.model.eval()

        self.image_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])

    def predict(self, title, body, image_bytes=None):
        text = title + " " + body

        
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            padding=True,
            max_length=512
        )

        input_ids = inputs["input_ids"].to(self.device)
        attention_mask = inputs["attention_mask"].to(self.device)

        
        pixel_values = None

        if image_bytes:
            try:
                # download image
                image = Image.open(BytesIO(image_bytes)).convert("RGB")
                image = self.image_transform(image).unsqueeze(0).to(self.device)
                pixel_values = image

            except Exception as e:
                print("Image processing error:", e)
                pixel_values = None

        with torch.no_grad():
            if pixel_values is not None:
                logits = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    pixel_values=pixel_values
                )
            else:
                logits = self.model(
                    input_ids=input_ids,
                    attention_mask=attention_mask,
                    pixel_values=None
                )

        probs = torch.softmax(logits, dim=-1)
        pred = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred].item()

        label = "REAL" if pred == 1 else "FAKE"

        return {
            "label": label,
            "confidence": round(confidence, 4),
            "explanation": "Multimodal prediction (text + image)" if pixel_values is not None else "Text-only prediction"
        }