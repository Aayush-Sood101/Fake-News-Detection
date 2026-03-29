"""Explanation generation for predictions."""

import logging

logger = logging.getLogger(__name__)


class PredictionExplainer:
    """Generate human-readable explanations for predictions."""
    
    def __init__(self):
        """Initialize the explainer with templates."""
        self.templates = {
            "FAKE": {
                "high": (
                    "🚨 HIGH CONFIDENCE: This content is likely FAKE news. "
                    "Our model detected strong indicators of misinformation. "
                    "Be extremely cautious about sharing this content."
                ),
                "medium": (
                    "⚠️ MODERATE CONFIDENCE: This content appears suspicious and may be fake. "
                    "Several red flags were detected, but verification is recommended. "
                    "Cross-check with reliable sources before sharing."
                ),
                "low": (
                    "❓ LOW CONFIDENCE: Analysis suggests possible misinformation, "
                    "but the indicators are not strong. Exercise caution and "
                    "verify the information with trusted sources."
                )
            },
            "REAL": {
                "high": (
                    "✅ HIGH CONFIDENCE: This content appears credible and likely authentic. "
                    "Our analysis found strong indicators of legitimate news. "
                    "However, always maintain healthy skepticism."
                ),
                "medium": (
                    "🔍 MODERATE CONFIDENCE: This content seems legitimate based on our analysis. "
                    "While we found positive indicators, it's still good practice "
                    "to verify important information from multiple sources."
                ),
                "low": (
                    "🤔 LOW CONFIDENCE: This may be authentic content, but our model "
                    "is not highly certain. Consider fact-checking with established "
                    "news outlets or fact-checking organizations."
                )
            }
        }
        
        self.modality_details = {
            "text_only": (
                "Analysis based on text content only (no image provided). "
                "Text analysis includes headline patterns, language style, and content structure."
            ),
            "multimodal": (
                "Analysis based on both text and image content. "
                "Combined analysis of article text and accompanying image provides "
                "stronger evidence for this prediction."
            )
        }
        
        logger.info("PredictionExplainer initialized")
    
    def explain(self, label: str, confidence: float, modality: str) -> str:
        """
        Generate explanation for a prediction.
        
        Args:
            label: Prediction label ("REAL" or "FAKE")
            confidence: Confidence score (0.0 to 1.0)
            modality: Modality used ("text_only" or "multimodal")
            
        Returns:
            Human-readable explanation string
        """
        # Determine confidence tier
        tier = self._get_confidence_tier(confidence)
        
        # Get base template
        try:
            base_explanation = self.templates[label][tier]
        except KeyError:
            logger.warning(f"Unknown label/tier: {label}/{tier}")
            base_explanation = "Unable to generate explanation for this prediction."
        
        # Add modality detail
        modality_detail = self.modality_details.get(
            modality,
            "Analysis based on available data."
        )
        
        # Combine
        full_explanation = f"{base_explanation} {modality_detail}"
        
        logger.debug(
            f"Generated explanation: label={label}, "
            f"confidence={confidence:.2f}, tier={tier}, modality={modality}"
        )
        
        return full_explanation
    
    def _get_confidence_tier(self, confidence: float) -> str:
        """
        Determine confidence tier from score.
        
        Args:
            confidence: Confidence score (0.0 to 1.0)
            
        Returns:
            Tier string: "high", "medium", or "low"
        """
        if confidence >= 0.85:
            return "high"
        elif confidence >= 0.65:
            return "medium"
        else:
            return "low"
