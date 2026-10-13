---
language:
- en
license: mit
library_name: transformers
tags:
- financial-sentiment
- trading
- nlp
- distilbert
- finance
datasets:
- zeroshot/twitter-financial-news-sentiment
metrics:
- accuracy
- f1
model-index:
- name: fin-sentiment-distilbert
  results:
  - task:
      type: text-classification
      name: Text Classification
    dataset:
      name: Twitter Financial News Sentiment
      type: zeroshot/twitter-financial-news-sentiment
    metrics:
    - name: Accuracy
      type: accuracy
      value: 0.8689
    - name: Macro F1
      type: f1
      value: 0.8284
---

# Model Card: Financial Market Sentiment DistilBERT

## Model Summary
**Quant Market Sentiment DistilBERT** is a lightweight, fine-tuned transformer model based on `distilbert-base-uncased`. It is specialized in extracting quantitative market sentiment signals (**BULLISH**, **BEARISH**, **NEUTRAL**) from financial news headlines, earnings conference call transcripts, and trading discourse.

- **Developer**: Assubki (Quant Market Sentiment Engine)
- **Model Type**: Transformer-based Sequence Classification
- **Base Architecture**: `distilbert-base-uncased` (6 layers, 768 hidden dimensions, 12 attention heads, ~66M parameters)
- **Framework**: PyTorch, Hugging Face Transformers
- **Target Repository**: `assubki/fin-sentiment-distilbert`

---

## Intended Use

### Primary Applications
- **Quantitative Signal Filtering**: Real-time filtering of market news feeds into directional trading signals.
- **Sentiment Alpha Generation**: Ingestion into algorithmic trading backtests to correlate sentiment shifts with asset price action.
- **Executive Summaries**: Fast automated market summaries for quant analysts and financial researchers.

### Out-of-Scope Use
- Not designed to provide automated direct execution advice without human-in-the-loop risk management.
- Not suited for generic informal social media conversations unrelated to financial markets.

---

## Training Data & Methodology

### Dataset
The model was fine-tuned on the `zeroshot/twitter-financial-news-sentiment` benchmark dataset, consisting of financial news headlines and market tweets labeled into three distinct sentiment categories:
1. **BEARISH (Label 0)**: Negative market signals (earnings misses, lawsuits, downgrades, macroeconomic downturns).
2. **BULLISH (Label 1)**: Positive market signals (revenue beats, clinical trial approvals, institutional buy ratings, expansion).
3. **NEUTRAL (Label 2)**: Factual disclosures, scheduling updates, or market events with no distinct directional bias.

### Hyperparameters
- **Epochs**: 3
- **Batch Size**: 32
- **Learning Rate**: 2e-5 with AdamW optimizer
- **Weight Decay**: 0.01
- **Max Sequence Length**: 64 tokens
- **Loss Function**: Cross-Entropy Loss

---

## Performance & Evaluation

The model was evaluated on a dedicated held-out test split using Macro-F1 to penalize misclassification on minority market signals:

| Metric | Score | Industry Benchmark Standard |
|---|---|---|
| **Overall Accuracy** | **86.89%** | > 80.0% |
| **Macro F1 Score** | **82.84%** | > 75.0% |
| **P95 Latency (CPU)** | **~15 - 25 ms** | < 50.0 ms |

---

## Limitations & Biases
- **Black Swan Events**: Extreme systemic anomalies or unprecedented market shocks may produce lower-confidence predictions.
- **Context Window**: Inputs longer than 64 tokens are truncated; long reports should be chunked into sentences before classification.
- **Sarcasm & Slang**: Specialized sub-reddit or retail crypto jargon may differ slightly from institutional news patterns.

---

## Ethical Considerations & Disclaimer
This model is intended solely for academic research, portfolio presentation, and quantitative experimental purposes. It does not constitute certified investment advice under SEC, FINRA, or OJK regulations. Users must exercise independent due diligence before making capital allocation decisions.
