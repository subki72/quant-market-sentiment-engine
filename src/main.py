from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

app = FastAPI(
    title="Financial Market Sentiment API",
    description="RESTful API for detecting market signals from financial news.",
    version="1.0.0"
)

MODEL_PATH = "./models"
MAX_SEQ_LENGTH = 64

try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_PATH)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_PATH)
    model.eval()
except Exception as e:
    print(f"Failed to load model: {e}")

class NewsRequest(BaseModel):
    text: str

class SentimentResponse(BaseModel):
    text: str
    signal: str
    confidence: float


@app.get("/")
def read_root():
    return {"message": "Financial Sentiment API is running."}

@app.post("/predict", response_model=SentimentResponse)
def predict_sentiment(request: NewsRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty.")
        
    try:
        inputs = tokenizer(
            request.text, 
            return_tensors="pt", 
            truncation=True, 
            max_length=MAX_SEQ_LENGTH
        )
        
        with torch.no_grad():
            outputs = model(**inputs)
            
        probs = outputs.logits.softmax(dim=-1)
        pred_class = torch.argmax(probs, dim=-1).item()
        confidence = probs[0][pred_class].item()
        signal_label = model.config.id2label[pred_class]
        
        return SentimentResponse(
            text=request.text,
            signal=signal_label,
            confidence=round(confidence * 100, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))