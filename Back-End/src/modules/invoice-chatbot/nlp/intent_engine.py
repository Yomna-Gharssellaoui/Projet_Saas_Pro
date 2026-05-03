"""
nlp/intent_engine.py
Hybrid NLP: fast keyword rules for common queries,
sentence-transformers for complex / ambiguous ones.
Runs 100% offline — no API.
"""

import re
from dataclasses import dataclass, field
from typing import Optional
from sentence_transformers import SentenceTransformer, util

# ── Intent definitions ────────────────────────────────────────────────────────
INTENTS = {
    "due_tomorrow":        "Who should pay tomorrow? Which invoices are due tomorrow?",
    "overdue":             "Show overdue invoices. Which invoices are late or past due?",
    "flagged_anomaly":     "Which invoices are flagged? Show anomalies or suspicious invoices.",
    "high_risk_clients":   "Which clients are high risk? Who has bad credit score?",
    "top_unpaid":          "What are the biggest unpaid invoices? Largest outstanding amounts?",
    "payment_prediction":  "Will this client pay on time? Predict payment for invoice.",
    "client_summary":      "Show summary for client. How many invoices does client have?",
    "stats_overview":      "Give me a dashboard overview. Total invoices, revenue, late rate.",
    "late_rate":           "What is the late payment rate? How many invoices are late?",
    "due_this_week":       "Which invoices are due this week? Payments coming this week?",
    "paid_today":          "Which invoices were paid today? Payments received today?",
    "by_category":         "Show invoices by product category. Which category has most delays?",
    "by_city":             "Show invoices by city or region. Which city pays latest?",
    "top_clients":         "Who are the best clients? Top clients by revenue or on-time payment?",
    "worst_payers":        "Who are the worst payers? Clients with most late payments?",
    "help":                "What can you do? Help. Show available commands.",
}

# Fast keyword rules — checked BEFORE the transformer
KEYWORD_RULES = [
    (r"\btomorrow\b|\bdemain\b",                         "due_tomorrow"),
    (r"\boverdue\b|\bpast.?due\b|\bexpired\b|\béchu",    "overdue"),
    (r"\bflagged?\b|\banomaly\b|\banomalie\b|\bsuspect", "flagged_anomaly"),
    (r"\bhigh.?risk\b|\brisque\b|\bbad.?credit\b",       "high_risk_clients"),
    (r"\bbiggest\b|\blargest\b|\btop.?\d*.?unpaid\b|\bowe\b|\bdue\b|\bdebt\b|\bdoit\b", "top_unpaid"),
    (r"\bpredict\b|\bwill.*pay\b|\brisk score\b",        "payment_prediction"),
    (r"\boverview\b|\bdashboard\b|\bsummary\b|\btotal\b","stats_overview"),
    (r"\blate.?rate\b|\bpercent.*late\b",                "late_rate"),
    (r"\bthis week\b|\bcette semaine\b|\b7 days\b",      "due_this_week"),
    (r"\bpaid today\b|\breçu aujourd",                   "paid_today"),
    (r"\bcategor\b|\bproduit\b|\bproduct\b",             "by_category"),
    (r"\bcity\b|\bville\b|\bregion\b|\brégion\b",        "by_city"),
    (r"\bbest client\b|\btop client\b|\bmeilleur",       "top_clients"),
    (r"\bworst\b|\bpire\b|\bmauvais payeur\b",           "worst_payers"),
    (r"\bhelp\b|\baide\b|\bcommand\b|\bwhat can\b",      "help"),
]


@dataclass
class ParsedIntent:
    intent:     str
    confidence: float
    client:     Optional[str] = None
    days:       Optional[int] = None
    amount:     Optional[float] = None
    category:   Optional[str] = None
    city:       Optional[str] = None
    raw:        str = ""


class IntentEngine:
    def __init__(self):
        print("[NLP] Loading sentence-transformer (all-MiniLM-L6-v2)…")
        self.model     = SentenceTransformer("all-MiniLM-L6-v2")
        self.intent_keys   = list(INTENTS.keys())
        self.intent_embeds = self.model.encode(
            list(INTENTS.values()), convert_to_tensor=True
        )
        print("[NLP] Ready.")

    # ── Entity extraction ─────────────────────────────────────────────────────
    def _extract_entities(self, text: str) -> dict:
        entities = {}
        # Client name: "for client X" / "du client X"
        m = re.search(r"(?:client|customer|for)\s+([A-Za-z0-9_\- ]{2,30})", text, re.I)
        if m:
            entities["client"] = m.group(1).strip()
        # Number of days: "next 3 days" / "dans 5 jours"
        m = re.search(r"(?:next|dans|in)\s+(\d+)\s+(?:days?|jours?)", text, re.I)
        if m:
            entities["days"] = int(m.group(1))
        # Amount threshold: "over 10000" / "plus de 5000"
        m = re.search(r"(?:over|above|plus de|>\s*)(\d[\d,\.]*)", text, re.I)
        if m:
            entities["amount"] = float(m.group(1).replace(",", ""))
        return entities

    # ── Main parse ────────────────────────────────────────────────────────────
    def parse(self, text: str) -> ParsedIntent:
        text_clean = text.strip().lower()

        # 1. Fast keyword rules
        for pattern, intent in KEYWORD_RULES:
            if re.search(pattern, text_clean, re.I):
                entities = self._extract_entities(text)
                return ParsedIntent(
                    intent=intent, confidence=0.95,
                    raw=text, **entities
                )

        # 2. Sentence transformer similarity
        q_embed = self.model.encode(text, convert_to_tensor=True)
        scores  = util.cos_sim(q_embed, self.intent_embeds)[0]
        best_i  = int(scores.argmax())
        best_s  = float(scores[best_i])

        if best_s < 0.35:
            return ParsedIntent(intent="unknown", confidence=best_s, raw=text)

        entities = self._extract_entities(text)
        return ParsedIntent(
            intent=self.intent_keys[best_i],
            confidence=round(best_s, 3),
            raw=text,
            **entities
        )
