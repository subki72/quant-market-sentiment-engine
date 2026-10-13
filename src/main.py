"""
Backward-compatibility alias pointing to src.app.
Enables running either `uvicorn src.app:app` or `uvicorn src.main:app`.
"""
from src.app import app

__all__ = ["app"]
