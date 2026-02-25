# 📈 Financial Market Sentiment Analysis Engine

![Python](https://img.shields.io/badge/Python-3.10-blue)
![PyTorch](https://img.shields.io/badge/PyTorch-GPU-orange)
![HuggingFace](https://img.shields.io/badge/Transformers-DistilBERT-yellow)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![Streamlit](https://img.shields.io/badge/Streamlit-Frontend-red)

## Overview
This project implements an end-to-end **Quantitative AI System** designed to analyze financial news and social media sentiment. Leveraging a fine-tuned **DistilBERT** transformer model, the system classifies market signals into **Bullish**, **Bearish**, or **Neutral** with high precision.

The architecture includes a training pipeline (PyTorch), a high-performance REST API (FastAPI) for inference, and an interactive dashboard (Streamlit) for real-time analysis.

## Key Features
- **Fine-Tuned Transformer:** Customized `distilbert-base-uncased` model trained on the `zeroshot/twitter-financial-news-sentiment` dataset.
- **GPU-Accelerated Training:** Optimized training loop using CUDA (NVIDIA GPU).
- **Production-Ready API:** Asynchronous inference engine built with **FastAPI**.
- **Interactive Dashboard:** User-friendly web interface using **Streamlit** for real-time market signal detection.
- **Quantitative Metrics:** Achieved **86.89% Accuracy** and **82.84% Macro-F1 Score** on unseen test data.

## Project Structure
```text
FINANCIAL-SENTIMENT-NLP/
│
├── models/                  # Saved model artifacts (Excluded from Git due to size)
├── notebooks/               # Jupyter Notebooks for EDA & Training
│   └── financial_sentiment_analysis.ipynb
├── src/                     # Source code for Production
│   ├── main.py              # FastAPI Backend
│   └── dashboard.py         # Streamlit Frontend
├── .gitignore               # Git configuration
├── README.md                # Project documentation
└── requirements.txt         # Python dependencies

```

## Installation & Setup

### 1. Prerequisites

Ensure you have Python 3.8+ and Anaconda installed.

### 2. Environment Setup

```bash
# Create and activate a new Conda environment
conda create -n nlp_transformer python=3.10
conda activate nlp_transformer

# Install PyTorch with CUDA support (for GPU acceleration)
pip install torch torchvision torchaudio --index-url [https://download.pytorch.org/whl/cu121](https://download.pytorch.org/whl/cu121)

# Install project dependencies
pip install transformers datasets scikit-learn pandas matplotlib seaborn fastapi uvicorn streamlit

```

## Usage

### A. Training the Model

Open the Jupyter Notebook in `notebooks/financial_sentiment_analysis.ipynb` to execute the training pipeline, perform EDA, and save the fine-tuned model to the `models/` directory.

### B. Running the System (One-Click Launcher)

For Windows users, simply double-click the `Run_Trading_Bot.bat` file to launch both the API and Dashboard simultaneously.

### C. Manual Execution

**Step 1: Start the Backend API**

```bash
uvicorn src.main:app --reload

```

*API will run at: http://127.0.0.1:8000/docs*

**Step 2: Start the Frontend Dashboard**
Open a new terminal and run:

```bash
streamlit run src/dashboard.py

```

*Dashboard will run at: http://localhost:8501*

## Model Performance

The model was evaluated on a validation set of 2,388 financial tweets.

| Metric | Score |
| --- | --- |
| **Accuracy** | **86.89%** |
| **F1-Score (Macro)** | **82.84%** |
| **Loss** | 0.35 |

## Future Improvements

* Integration with live market data feeds (Bloomberg/Reuters API).
* Implementation of an Automated Trading Execution engine based on sentiment signals.
* Dockerizing the application for cloud deployment.

## Author

**Muhammad Syafii Assubki**
*Law Background | Aspiring Quantitative Developer*

```

