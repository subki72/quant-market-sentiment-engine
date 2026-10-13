# Contributing to Quant Market Sentiment Engine

Thank you for your interest in improving the **Quant Market Sentiment Engine**! We welcome contributions to enhance ML performance, backend throughput, and frontend user experience.

---

## Development Setup

### 1. Clone & Environment
```bash
git clone https://github.com/subki72/quant-market-sentiment-engine.git
cd quant-market-sentiment-engine
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements-dev.txt
```

### 3. Model Weights Setup
You can either place existing weights in `./models/` or pull from Hugging Face Hub:
```bash
python scripts/download_model.py --repo-id assubki/fin-sentiment-distilbert
```

---

## Code Quality Standards

Before submitting a Pull Request, verify that all quality gates pass:

1. **Linting & Code Style**:
   ```bash
   flake8 src tests scripts
   ```
2. **Test Suite & Coverage**:
   ```bash
   pytest -v --cov=src --cov-report=term-missing
   ```
   *All tests must pass and total coverage must remain ≥ 60%.*

---

## Pull Request Guidelines
1. Fork the repo and create a descriptive feature branch (`feature/async-batching` or `fix/model-fallback`).
2. Adhere to PEP 8 styling and maintain type annotations across functions.
3. Write corresponding unit or integration tests for any new features.
4. Ensure your PR passes all GitHub Actions CI checks before requesting review.
