"""
Hugging Face Spaces Entry Point (Gradio SDK + FastAPI Mount).
Runs 100% Free on Hugging Face Spaces without requiring Docker or credit card.
Serves both the interactive Gradio UI and the full FastAPI REST API (/predict, /health, /docs).
"""
import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gradio as gr
import uvicorn
from src.app import app
from src.services.sentiment_service import get_sentiment_service
from src.config import get_settings


def analyze_financial_sentiment(text: str):
    """Gradio handler for direct web visitors."""
    if not text or not text.strip():
        return "Please input financial text or headline."
    
    service = get_sentiment_service()
    if not service.is_ready:
        service.load_model()
        
    result = service.analyze(text)
    return {
        "Signal": result.sentiment,
        "Confidence": f"{result.confidence * 100:.2f}%",
        "Probabilities": {
            "Bullish (Positive)": f"{result.probabilities.get('BULLISH', 0.0) * 100:.2f}%",
            "Bearish (Negative)": f"{result.probabilities.get('BEARISH', 0.0) * 100:.2f}%",
            "Neutral": f"{result.probabilities.get('NEUTRAL', 0.0) * 100:.2f}%",
        },
        "Inference Latency": f"{result.inference_time_ms:.2f} ms",
        "Model Source": service.active_source
    }


# Build Gradio UI for Hugging Face Space visitors
with gr.Blocks(
    title="Quant Market Sentiment Engine",
    theme=gr.themes.Base()
) as demo:
    gr.Markdown(
        """
        # QUANT MARKET SENTIMENT ENGINE // UNIT MOD-01
        ### Production-grade FinBERT Transformer Sentiment Inference Microservice
        
        - **REST API Endpoints**: Available at `/predict`, `/health`, `/health/ready`, `/docs` (Swagger UI).
        - **Frontend Integration**: Connect this Space directly to the Next.js retro-futuristic rack chassis frontend.
        """
    )
    
    with gr.Row():
        with gr.Column(scale=3):
            input_box = gr.Textbox(
                label="Financial News / Headline / Transcript Text",
                placeholder="e.g. Operating profit rose 18% YoY to €450M, beating consensus estimates.",
                lines=4,
            )
            analyze_btn = gr.Button("Analyze Signal", variant="primary")
            
            gr.Examples(
                examples=[
                    ["Operating profit rose 18% YoY to €450M, beating consensus estimates."],
                    ["Company warns of significant margin compression due to surging supply chain costs."],
                    ["The board of directors declared a standard quarterly cash dividend of $0.25 per share."]
                ],
                inputs=input_box
            )
        
        with gr.Column(scale=2):
            output_json = gr.JSON(label="Signal Analysis Output")
            
    analyze_btn.click(
        fn=analyze_financial_sentiment,
        inputs=input_box,
        outputs=output_json
    )


# Mount Gradio Blocks onto FastAPI
# FastAPI endpoints (/predict, /health, /docs) take precedence, while Gradio serves the web UI at "/"
app = gr.mount_gradio_app(app, demo, path="/")


if __name__ == "__main__":
    settings = get_settings()
    port = int(os.environ.get("PORT", 7860))
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port
    )
