"""
Utility script to upload fine-tuned model artifacts to Hugging Face Hub.
"""
import argparse
import os
import sys
from huggingface_hub import HfApi, login


def upload_model(repo_id: str, folder_path: str, token: str = None) -> None:
    """Uploads model weights and tokenizer from folder_path to Hugging Face Hub."""
    if not os.path.exists(folder_path):
        print(f"Error: Model directory '{folder_path}' does not exist.")
        print("Please train the model via notebook or place weights inside the directory.")
        sys.exit(1)

    hf_token = token or os.getenv("HF_TOKEN")
    if hf_token:
        login(token=hf_token)
    else:
        print("No HF_TOKEN specified. Attempting to use existing Hugging Face credentials...")

    api = HfApi()
    print(f"Uploading files from '{folder_path}' to repository '{repo_id}'...")

    try:
        api.create_repo(repo_id=repo_id, repo_type="model", exist_ok=True)
        api.upload_folder(
            folder_path=folder_path,
            repo_id=repo_id,
            repo_type="model",
            commit_message="Add fine-tuned DistilBERT financial sentiment model weights"
        )
        print(f"Success! Model uploaded to https://huggingface.co/{repo_id}")
    except Exception as exc:
        print(f"Failed to upload model: {exc}")
        sys.exit(1)


def main() -> None:
    parser = argparse.ArgumentParser(description="Upload model weights to Hugging Face Hub.")
    parser.add_argument(
        "--repo-id",
        type=str,
        default=os.getenv("HF_MODEL_REPO", "assubki/fin-sentiment-distilbert"),
        help="Target Hugging Face Model repository ID (e.g. assubki/fin-sentiment-distilbert)"
    )
    parser.add_argument(
        "--folder",
        type=str,
        default="./models",
        help="Path to local directory containing model weights and config"
    )
    parser.add_argument(
        "--token",
        type=str,
        default=None,
        help="Hugging Face personal access token (with write access)"
    )

    args = parser.parse_args()
    upload_model(repo_id=args.repo_id, folder_path=args.folder, token=args.token)


if __name__ == "__main__":
    main()
