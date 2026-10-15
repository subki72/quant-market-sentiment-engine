"""
Hugging Face Spaces Entry Point (Gradio 6 SDK with FastAPI Route Integration).
Runs 100% Free on Hugging Face Spaces without requiring Docker or credit card.
Serves both the interactive Gradio UI and the full FastAPI REST API (/predict, /health, /health/ready).
"""
import os
import sys

# Ensure root directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import gradio as gr
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import router as api_router
from src.config import get_settings
from src.logger import setup_logging
from src.services.sentiment_service import get_sentiment_service

# Initialize logging and load model weights
setup_logging()
settings = get_settings()
service = get_sentiment_service()
service.load_model()


def analyze_financial_sentiment(text: str):
    """Gradio handler for direct web visitors."""
    if not text or not text.strip():
        return "Please input financial text or headline."
    
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
with gr.Blocks(title="Quant Market Sentiment Engine") as demo:
    gr.Markdown(
        """
        # QUANT MARKET SENTIMENT ENGINE // UNIT MOD-01
        ### Production-grade FinBERT Transformer Sentiment Inference Microservice
        
        - **REST API Endpoints**: Available at `/predict`, `/health`, `/health/ready`.
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


# Configure CORS on demo.app so Next.js frontend on Vercel can query it
demo.app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach FastAPI API routes directly to demo.app
demo.app.include_router(api_router)

# Expose app for ASGI runners
app = demo.app

if __name__ == "__main__":
    demo.launch()
