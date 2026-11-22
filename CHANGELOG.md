# Changelog

All notable changes to **quant-market-sentiment-engine** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-11-22

### Added
- Unit tests for Pydantic DTO schemas (`tests/test_schemas.py`) and configuration parsing (`tests/test_config.py`).
- Pinned dependencies in `requirements.txt`, `requirements-lock.txt`, and `uv.lock`.
- Single-command developer workflow `Makefile`.
- Security automation: `.github/dependabot.yml`, `SECURITY.md`, Semgrep SAST, and Trivy container vulnerability scanner in CI.
- Operational runbook (`docs/runbook.md`), `LICENSE`, `CONTRIBUTING.md`, `CHANGELOG.md`, and `.pre-commit-config.yaml`.

### Changed
- Converted `scripts/download_model.py` and `scripts/upload_to_hf.py` from `print()` statements to structured leveled logging.

### Security
- Replaced hardcoded mock API key literal in `tests/test_api.py` with non-secret placeholder fixture.
