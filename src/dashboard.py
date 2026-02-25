import streamlit as st
import requests

st.set_page_config(page_title="AI Trading Bot", layout="centered")

st.title("Market Sentiment Analysis")
st.markdown("**Powered by Fine-tuned DistilBERT & FastAPI**")
st.write("Enter financial news, headlines, or tweets below to get real-time market sentiment analysis.")

API_URL = "http://127.0.0.1:8000/predict"

user_input = st.text_area("Market News / Text Input:", height=100, placeholder="e.g., Tesla reports record-breaking Q4 revenue...")

if st.button("Analyze Market Signal", type="primary"):
    if user_input.strip():
        with st.spinner("Analyzing NLP features..."):
            try:
                response = requests.post(API_URL, json={"text": user_input})
                
                if response.status_code == 200:
                    result = response.json()
                    signal = result["signal"]
                    confidence = result["confidence"]

                    st.markdown("---")
                    st.subheader("Analysis Result")
                    
                    if "BULLISH" in signal:
                        st.success(f"**Trading Signal:** {signal}")
                    elif "BEARISH" in signal:
                        st.error(f"**Trading Signal:** {signal}")
                    else:
                        st.warning(f"**Trading Signal:** {signal}")
                        
                    st.progress(confidence / 100.0)
                    st.write(f"**AI Confidence Score:** {confidence}%")
                    
                else:
                    st.error(f"Backend Error: Received status code {response.status_code}")
                    
            except requests.exceptions.ConnectionError:
                st.error("Connection Error: Please ensure your FastAPI server is running.")
    else:
        st.warning("Please enter some text before analyzing.")