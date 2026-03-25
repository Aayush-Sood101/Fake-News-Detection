"""
MultiModalFusionNet: Cross-attention fusion of text and image features
for fake news detection.
"""

import torch
import torch.nn as nn
from transformers import RobertaModel, ViTModel
from dataclasses import dataclass
from typing import Optional


@dataclass
class ModelConfig:
    """Configuration for MultiModalFusionNet."""
    text_encoder: str = "roberta-base"
    image_encoder: str = "google/vit-base-patch16-224"
    projection_dim: int = 512
    num_attention_heads: int = 8
    num_classes: int = 2
    freeze_text_layers: int = 8
    classifier_dropout: float = 0.2
    encoder_dropout: float = 0.1


class MultiModalFusionNet(nn.Module):
    """
    Multimodal fusion network for fake news detection.
    
    Architecture:
    1. RoBERTa encodes text → [CLS] token → projection
    2. ViT encodes image → [CLS] token → projection
    3. Cross-attention: text attends to image
    4. Concatenate text + fused features
    5. MLP classifier → Real/Fake
    """
    
    def __init__(self, config: ModelConfig):
        super().__init__()
        self.config = config
        
        # === Text Encoder (RoBERTa) ===
        self.text_encoder = RobertaModel.from_pretrained(config.text_encoder)
        
        # Freeze early layers (first N layers)
        self._freeze_text_encoder_layers(config.freeze_text_layers)
        
        # === Image Encoder (ViT) ===
        self.image_encoder = ViTModel.from_pretrained(config.image_encoder)
        
        # === Projection Heads ===
        hidden_size = 768  # Both RoBERTa-base and ViT-base use 768
        
        self.text_projection = nn.Sequential(
            nn.Linear(hidden_size, config.projection_dim),
            nn.GELU(),
            nn.Dropout(config.encoder_dropout)
        )
        
        self.image_projection = nn.Sequential(
            nn.Linear(hidden_size, config.projection_dim),
            nn.GELU(),
            nn.Dropout(config.encoder_dropout)
        )
        
        # === Cross-Attention Fusion ===
        self.cross_attention = nn.MultiheadAttention(
            embed_dim=config.projection_dim,
            num_heads=config.num_attention_heads,
            dropout=config.encoder_dropout,
            batch_first=True
        )
        self.fusion_norm = nn.LayerNorm(config.projection_dim)
        
        # === No-Image Token (learnable embedding) ===
        self.no_image_token = nn.Parameter(
            torch.zeros(1, 1, config.projection_dim)
        )
        nn.init.normal_(self.no_image_token, std=0.02)
        
        # === Classifier MLP ===
        classifier_input_dim = config.projection_dim * 2  # text + fused
        
        self.classifier = nn.Sequential(
            nn.Linear(classifier_input_dim, config.projection_dim),
            nn.GELU(),
            nn.Dropout(config.classifier_dropout),
            nn.Linear(config.projection_dim, 128),
            nn.GELU(),
            nn.Dropout(config.classifier_dropout),
            nn.Linear(128, config.num_classes)
        )
    
    def _freeze_text_encoder_layers(self, num_layers: int):
        """Freeze the first N layers of the text encoder."""
        # Freeze embeddings
        for param in self.text_encoder.embeddings.parameters():
            param.requires_grad = False
        
        # Freeze first N transformer layers
        for i, layer in enumerate(self.text_encoder.encoder.layer):
            if i < num_layers:
                for param in layer.parameters():
                    param.requires_grad = False
    
    def forward(
        self,
        input_ids: torch.Tensor,
        attention_mask: torch.Tensor,
        pixel_values: Optional[torch.Tensor] = None
    ) -> torch.Tensor:
        """
        Forward pass.
        
        Args:
            input_ids: [batch_size, seq_len] - tokenized text
            attention_mask: [batch_size, seq_len] - attention mask for text
            pixel_values: [batch_size, 3, 224, 224] - images (optional)
            
        Returns:
            logits: [batch_size, num_classes]
        """
        batch_size = input_ids.size(0)
        
        # === Text Encoding ===
        text_outputs = self.text_encoder(
            input_ids=input_ids,
            attention_mask=attention_mask
        )
        # Use [CLS] token representation
        text_cls = text_outputs.last_hidden_state[:, 0, :]  # [B, 768]
        text_proj = self.text_projection(text_cls)  # [B, 512]
        text_proj = text_proj.unsqueeze(1)  # [B, 1, 512]
        
        # === Image Encoding ===
        if pixel_values is not None:
            image_outputs = self.image_encoder(pixel_values=pixel_values)
            image_cls = image_outputs.last_hidden_state[:, 0, :]  # [B, 768]
            image_proj = self.image_projection(image_cls)  # [B, 512]
            image_proj = image_proj.unsqueeze(1)  # [B, 1, 512]
        else:
            # Use learned no-image token
            image_proj = self.no_image_token.expand(batch_size, -1, -1)
        
        # === Cross-Attention Fusion ===
        # Query: text, Key/Value: image
        fused, _ = self.cross_attention(
            query=text_proj,
            key=image_proj,
            value=image_proj
        )
        # Residual connection + LayerNorm
        fused = self.fusion_norm(fused + text_proj)  # [B, 1, 512]
        fused = fused.squeeze(1)  # [B, 512]
        
        # === Classification ===
        # Concatenate text representation with fused representation
        combined = torch.cat([text_proj.squeeze(1), fused], dim=-1)  # [B, 1024]
        logits = self.classifier(combined)  # [B, num_classes]
        
        return logits
    
    def get_trainable_params(self) -> int:
        """Count trainable parameters."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)
    
    def get_total_params(self) -> int:
        """Count total parameters."""
        return sum(p.numel() for p in self.parameters())
