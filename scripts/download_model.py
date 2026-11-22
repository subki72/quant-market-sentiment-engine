"""
Utility script to download and cache sentiment model weights locally.
"""
import argparse
import logging
import os
import sys
from transformers import AutoModelForSequenceClassification, AutoTokenizer

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")
logger = logging.getLogger(__name__)


def download_model(repo_id: str, target_dir: str, fallback_repo: str = "ProsusAI/finbert") -> None:
    """Downloads model and tokenizer from Hugging Face Hub and saves locally."""
    os.makedirs(target_dir, exist_ok=True)
    logger.info("Attempting to download model from primary repository: %s", repo_id)

    selected_repo = repo_id
    try:
        tokenizer = AutoTokenizer.from_pretrained(repo_id)
        model = AutoModelForSequenceClassification.from_pretrained(repo_id)
    except Exception as exc:
        logger.warning("Primary repository '%s' not found or inaccessible: %s", repo_id, exc)
        logger.info("Falling back to compatible public financial model: '%s'", fallback_repo)
        selected_repo = fallback_repo
        try:
            tokenizer = AutoTokenizer.from_pretrained(fallback_repo)
            model = AutoModelForSequenceClassification.from_pretrained(fallback_repo)
        except Exception as fallback_exc:
            logger.error("Failed to load fallback model: %s", fallback_exc)
            sys.exit(1)

    logger.info("Saving downloaded model artifacts from '%s' into '%s'...", selected_repo, target_dir)
    tokenizer.save_pretrained(target_dir)
    model.save_pretrained(target_dir)
    logger.info("Successfully cached model into '%s'.", target_dir)


def main() -> None:
    parser = argparse.ArgumentParser(description="Download model weights from Hugging Face Hub.")
    parser.add_argument(
        "--repo-id",
        type=str,
        default=os.getenv("HF_MODEL_REPO", "assubki/fin-sentiment-distilbert"),
        help="Primary Hugging Face repository ID",
    )
    parser.add_argument(
        "--target-dir",
        type=str,
        default="./models",
        help="Target local directory to store model",
    )
    parser.add_argument(
        "--fallback",
        type=str,
        default="ProsusAI/finbert",
        help="Fallback Hugging Face repository if primary is not found",
    )

    args = parser.parse_args()
    download_model(repo_id=args.repo_id, target_dir=args.target_dir, fallback_repo=args.fallback)


if __name__ == "__main__":
    main()
