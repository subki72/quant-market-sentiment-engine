"""
Sentiment analysis inference service with thread-pool async execution.
"""
import asyncio
import os
import time
from typing import Any, Dict, Optional
import torch
from transformers import AutoModelForSequenceClassification, AutoTokenizer

from src.config import Settings, get_settings
from src.logger import get_logger

logger = get_logger(__name__)


def normalize_signal(label: str) -> str:
    """Normalizes various model label conventions to standard trading signals."""
    normalized = label.strip().upper()
    mapping = {
        "POSITIVE": "BULLISH",
        "NEGATIVE": "BEARISH",
        "NEUTRAL": "NEUTRAL",
        "BULLISH": "BULLISH",
        "BEARISH": "BEARISH",
        "LABEL_0": "BEARISH",
        "LABEL_1": "BULLISH",
        "LABEL_2": "NEUTRAL",
    }
    return mapping.get(normalized, normalized)


class SentimentService:
    """Encapsulates Hugging Face model loading and inference logic."""

    def __init__(self, settings: Optional[Settings] = None):
        self.settings = settings or get_settings()
        self.tokenizer: Optional[Any] = None
        self.model: Optional[Any] = None
        self.is_ready: bool = False
        self.active_source: str = "none"
        self.load_error: Optional[str] = None

    def load_model(self) -> None:
        """Loads tokenizer and model weights from local path or Hugging Face Hub."""
        logger.info("Initializing SentimentService model weights...")

        # Candidate sources in order of preference
        candidates = []
        if os.path.exists(self.settings.model_path) and os.listdir(self.settings.model_path):
            candidates.append(("local_path", self.settings.model_path))
        if self.settings.hf_model_repo:
            candidates.append(("hf_hub", self.settings.hf_model_repo))
        if self.settings.hf_fallback_model:
            candidates.append(("hf_fallback", self.settings.hf_fallback_model))

        for source_type, source_path in candidates:
            try:
                logger.info(f"Attempting to load model from {source_type}: '{source_path}'")
                tokenizer = AutoTokenizer.from_pretrained(source_path)
                model = AutoModelForSequenceClassification.from_pretrained(source_path)
                model.eval()

                self.tokenizer = tokenizer
                self.model = model
                self.active_source = f"{source_type}:{source_path}"
                self.is_ready = True
                self.load_error = None
                logger.info(f"Model successfully loaded and initialized from '{self.active_source}'")
                return
            except Exception as exc:
                logger.warning(f"Could not load from '{source_path}': {exc}")

        # If all candidates fail
        self.is_ready = False
        self.active_source = "none"
        self.load_error = "All candidate model sources failed to load."
        logger.error(self.load_error)

    def _predict_sync(self, text: str) -> Dict[str, Any]:
        """Synchronous CPU inference execution."""
        if not self.is_ready or self.tokenizer is None or self.model is None:
            raise RuntimeError("Model is not initialized or ready for inference.")

        start_time = time.perf_counter()

        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=self.settings.max_seq_length
        )

        with torch.no_grad():
            outputs = self.model(**inputs)

        probs = outputs.logits.softmax(dim=-1).squeeze(0)
        pred_class_idx = torch.argmax(probs, dim=-1).item()

        # Extract label mapping
        raw_label = self.model.config.id2label.get(pred_class_idx, f"CLASS_{pred_class_idx}")
        signal = normalize_signal(str(raw_label))

        probabilities: Dict[str, float] = {}
        for idx, prob in enumerate(probs):
            lbl_name = self.model.config.id2label.get(idx, f"CLASS_{idx}")
            norm_lbl = normalize_signal(str(lbl_name))
            probabilities[norm_lbl] = round(prob.item() * 100, 2)

        # Guarantee standard class keys
        for expected in ("BULLISH", "BEARISH", "NEUTRAL"):
            if expected not in probabilities:
                probabilities[expected] = 0.0

        # Residual normalization: eliminate any ±0.01% floating precision rounding discrepancies
        current_sum = round(sum(probabilities.values()), 2)
        diff = round(100.0 - current_sum, 2)
        if diff != 0.0 and signal in probabilities:
            probabilities[signal] = round(probabilities[signal] + diff, 2)

        confidence = probabilities.get(signal, round(probs[pred_class_idx].item() * 100, 2))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        return {
            "text": text,
            "signal": signal,
            "confidence": confidence,
            "probabilities": probabilities,
            "latency_ms": latency_ms
        }

    async def predict(self, text: str) -> Dict[str, Any]:
        """Asynchronous non-blocking inference running on a worker thread."""
        return await asyncio.to_thread(self._predict_sync, text)


# Global service singleton
_service_instance: Optional[SentimentService] = None


def get_sentiment_service() -> SentimentService:
    """Returns the singleton instance of SentimentService."""
    global _service_instance
    if _service_instance is None:
        _service_instance = SentimentService()
    return _service_instance
