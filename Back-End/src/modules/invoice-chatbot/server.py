"""
server.py — Invoice Chatbot API
Wires: NLP intent → DB query → natural language response
No external API. Fully offline.

Start:
  uvicorn server:app --host 0.0.0.0 --port 8000 --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from nlp.intent_engine   import IntentEngine
from nlp.response_builder import build_response
import db.query_engine as db

app    = FastAPI(title="Invoice Chatbot API")
engine = IntentEngine()   # loads sentence-transformer once at startup

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)


class ChatRequest(BaseModel):
    message: str


@app.post("/chat")
async def chat(req: ChatRequest):
    parsed = engine.parse(req.message)
    intent = parsed.intent

    # ── Route intent → DB query ───────────────────────────────────────────────
    data = None
    try:
        if intent == "due_tomorrow":
            data = db.due_tomorrow()
        elif intent == "due_this_week":
            data = db.due_this_week()
        elif intent == "overdue":
            data = db.overdue_invoices()
        elif intent == "flagged_anomaly":
            data = db.flagged_anomalies()
        elif intent == "high_risk_clients":
            data = db.high_risk_clients()
        elif intent == "top_unpaid":
            data = db.top_unpaid(parsed.amount or 0)
        elif intent == "stats_overview":
            data = db.stats_overview()
        elif intent == "late_rate":
            data = db.late_rate()
        elif intent == "paid_today":
            data = db.paid_today()
        elif intent == "by_category":
            data = db.by_category()
        elif intent == "by_city":
            data = db.by_city()
        elif intent == "top_clients":
            data = db.top_clients()
        elif intent == "worst_payers":
            data = db.worst_payers()
        elif intent == "client_summary":
            data = db.client_summary(parsed.client or "")
        # help / unknown → no DB call needed

    except Exception as e:
        return {
            "text":  f"⚠️ Database error: {str(e)}",
            "type":  "error",
            "table": None,
            "intent": intent,
            "confidence": parsed.confidence,
        }

    response = build_response(
        intent,
        data,
        entities={"client": parsed.client, "days": parsed.days, "amount": parsed.amount}
    )
    response["intent"]     = intent
    response["confidence"] = parsed.confidence
    return response


@app.get("/health")
def health():
    return {"status": "ok", "model": "MiniLM-L6-v2 + rule engine"}
