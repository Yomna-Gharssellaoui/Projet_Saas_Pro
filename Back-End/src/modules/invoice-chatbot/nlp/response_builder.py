"""
nlp/response_builder.py
Converts structured DB results into natural language chat responses.
No LLM — pure Python string formatting, fully offline.
"""

from datetime import date
from typing import Any


def _fmt_amount(v) -> str:
    try:
        return f"{float(v):,.2f} DZD"
    except Exception:
        return str(v)


def _risk_label(score) -> str:
    try:
        s = float(score)
        if s >= 0.75: return "🔴 Very High"
        if s >= 0.5:  return "🟠 High"
        if s >= 0.3:  return "🟡 Medium"
        return "🟢 Low"
    except Exception:
        return "—"


def build_response(intent: str, data: Any, entities: dict = {}) -> dict:
    """
    Returns:
      { "text": str, "table": list[dict] | None, "type": str }
    """

    # ── Due tomorrow ──────────────────────────────────────────────────────────
    if intent == "due_tomorrow":
        tomorrow = (date.today().__add__(__import__('datetime').timedelta(days=1))).strftime("%d %b %Y")
        if not data:
            return _reply(f"✅ No invoices are due tomorrow ({tomorrow}). All clear!", "info")
        total = sum(float(r.get("montant_ttc", 0) or 0) for r in data)
        text  = (
            f"📅 **{len(data)} invoice(s)** are due tomorrow ({tomorrow}).\n"
            f"Total amount to collect: **{_fmt_amount(total)}**\n\n"
            f"Here are the clients to follow up with:"
        )
        table = [
            {
                "Invoice":   r.get("id"),
                "Client":    r.get("client_nom"),
                "Amount":    _fmt_amount(r.get("montant_ttc")),
                "Due Date":  str(r.get("date_echeance", ""))[:10],
                "Risk":      _risk_label(r.get("risk_score")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Due this week ─────────────────────────────────────────────────────────
    if intent == "due_this_week":
        if not data:
            return _reply("✅ No invoices due in the next 7 days.", "info")
        total = sum(float(r.get("montant_ttc", 0) or 0) for r in data)
        text  = (
            f"📆 **{len(data)} invoice(s)** due in the next 7 days.\n"
            f"Total: **{_fmt_amount(total)}**"
        )
        table = [
            {
                "Invoice":  r.get("id"),
                "Client":   r.get("client_nom"),
                "Amount":   _fmt_amount(r.get("montant_ttc")),
                "Due":      str(r.get("date_echeance", ""))[:10],
                "Risk":     _risk_label(r.get("risk_score")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Overdue ───────────────────────────────────────────────────────────────
    if intent == "overdue":
        if not data:
            return _reply("✅ No overdue invoices right now!", "info")
        total = sum(float(r.get("montant_ttc", 0) or 0) for r in data)
        text  = (
            f"⚠️ **{len(data)} overdue invoice(s)** found.\n"
            f"Total outstanding: **{_fmt_amount(total)}**"
        )
        table = [
            {
                "Invoice":     r.get("id"),
                "Client":      r.get("client_nom"),
                "Amount":      _fmt_amount(r.get("montant_ttc")),
                "Due":         str(r.get("date_echeance", ""))[:10],
                "Days Overdue": r.get("days_overdue", "—"),
                "Risk":        _risk_label(r.get("risk_score")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Flagged anomalies ─────────────────────────────────────────────────────
    if intent == "flagged_anomaly":
        if not data:
            return _reply("✅ No anomalies flagged by the ML model.", "info")
        text = (
            f"🚨 **{len(data)} invoice(s)** flagged as suspicious by the anomaly detection model.\n"
            f"These should be reviewed manually:"
        )
        table = [
            {
                "Invoice": r.get("id"),
                "Client":  r.get("client_nom"),
                "Amount":  _fmt_amount(r.get("montant_ttc")),
                "Due":     str(r.get("date_echeance", ""))[:10],
                "Risk":    _risk_label(r.get("risk_score")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── High risk clients ─────────────────────────────────────────────────────
    if intent == "high_risk_clients":
        if not data:
            return _reply("✅ No high-risk clients detected.", "info")
        text = f"🔴 **{len(data)} high-risk client(s)** with predicted late payment probability above 60%:"
        table = [
            {
                "Client":        r.get("client_nom"),
                "Invoices":      r.get("total_invoices"),
                "Avg Credit":    r.get("avg_credit_score"),
                "Risk Score":    _risk_label(r.get("avg_risk")),
                "Outstanding":   _fmt_amount(r.get("total_outstanding")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Top unpaid ────────────────────────────────────────────────────────────
    if intent == "top_unpaid":
        if not data:
            return _reply("✅ No unpaid invoices found.", "info")
        total = sum(float(r.get("montant_ttc", 0) or 0) for r in data)
        text  = f"💰 **Top {len(data)} unpaid invoices** — Total: **{_fmt_amount(total)}**"
        table = [
            {
                "Invoice": r.get("id"),
                "Client":  r.get("client_nom"),
                "Amount":  _fmt_amount(r.get("montant_ttc")),
                "Due":     str(r.get("date_echeance", ""))[:10],
                "Risk":    _risk_label(r.get("risk_score")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Stats overview ────────────────────────────────────────────────────────
    if intent == "stats_overview":
        if not data:
            return _reply("Could not retrieve overview stats.", "error")
        d = data
        text = (
            f"📊 **Invoice Dashboard Overview**\n\n"
            f"• Total invoices: **{d.get('total_invoices', 0):,}**\n"
            f"• Unpaid: **{d.get('unpaid', 0):,}**\n"
            f"• Late payments: **{d.get('total_late', 0):,}** ({d.get('late_rate_pct', 0)}%)\n"
            f"• Flagged by ML: **{d.get('flagged', 0):,}**\n"
            f"• Avg credit score: **{d.get('avg_credit', 0)}**\n"
            f"• Total outstanding: **{_fmt_amount(d.get('total_outstanding', 0))}**"
        )
        return _reply(text, "info")

    # ── Late rate ─────────────────────────────────────────────────────────────
    if intent == "late_rate":
        if not data:
            return _reply("Could not compute late rate.", "error")
        d    = data
        pct  = d.get("late_pct", 0)
        icon = "🔴" if float(pct) > 30 else ("🟡" if float(pct) > 15 else "🟢")
        text = (
            f"{icon} **Late payment rate: {pct}%**\n"
            f"• {d.get('late', 0):,} late out of {d.get('total', 0):,} total invoices"
        )
        return _reply(text, "info")

    # ── Paid today ────────────────────────────────────────────────────────────
    if intent == "paid_today":
        if not data:
            return _reply("No payments recorded today yet.", "info")
        total = sum(float(r.get("montant_ttc", 0) or 0) for r in data)
        text  = f"✅ **{len(data)} payment(s)** received today — Total: **{_fmt_amount(total)}**"
        table = [
            {
                "Invoice": r.get("id"),
                "Client":  r.get("client_nom"),
                "Amount":  _fmt_amount(r.get("montant_ttc")),
                "Status":  r.get("statut_facture"),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── By category ───────────────────────────────────────────────────────────
    if intent == "by_category":
        if not data:
            return _reply("No category data found.", "error")
        text  = "📦 **Invoice performance by product category:**"
        table = [
            {
                "Category":   r.get("categorie_produit"),
                "Total":      r.get("total"),
                "Late":       r.get("late_count"),
                "Late %":     f"{r.get('late_pct', 0)}%",
                "Revenue":    _fmt_amount(r.get("total_revenue")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── By city ───────────────────────────────────────────────────────────────
    if intent == "by_city":
        if not data:
            return _reply("No city data found.", "error")
        text  = "🗺️ **Late payment rate by city:**"
        table = [
            {
                "City":       r.get("ville"),
                "Total":      r.get("total"),
                "Late":       r.get("late_count"),
                "Late %":     f"{r.get('late_pct', 0)}%",
                "Avg Delay":  f"{r.get('avg_delay_days', 0)} days",
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Top clients ───────────────────────────────────────────────────────────
    if intent == "top_clients":
        if not data:
            return _reply("No client data found.", "error")
        text  = "⭐ **Top clients by on-time payment rate:**"
        table = [
            {
                "Client":    r.get("client_nom"),
                "Invoices":  r.get("total_invoices"),
                "On Time %": f"{r.get('ontime_pct', 0)}%",
                "Revenue":   _fmt_amount(r.get("total_billed")),
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Worst payers ──────────────────────────────────────────────────────────
    if intent == "worst_payers":
        if not data:
            return _reply("No data found.", "error")
        text  = "⚠️ **Worst payers (highest late rate):**"
        table = [
            {
                "Client":      r.get("client_nom"),
                "Total":       r.get("total_invoices"),
                "Late":        r.get("late_count"),
                "Late %":      f"{r.get('late_pct', 0)}%",
                "Avg Delay":   f"{r.get('avg_delay_days', 0)} days",
            }
            for r in data
        ]
        return _reply(text, "table", table)

    # ── Client summary ────────────────────────────────────────────────────────
    if intent == "client_summary":
        if not data:
            return _reply("No client found matching that name.", "info")
        d    = data
        text = (
            f"👤 **Client: {d.get('client_nom')}**\n\n"
            f"• Total invoices: **{d.get('total_invoices', 0)}**\n"
            f"• Late payments: **{d.get('late_count', 0)}**\n"
            f"• Open invoices: **{d.get('open_invoices', 0)}**\n"
            f"• Avg credit score: **{d.get('avg_credit', '—')}**\n"
            f"• Avg risk: **{_risk_label(d.get('avg_risk'))}**\n"
            f"• Total billed: **{_fmt_amount(d.get('total_billed', 0))}**"
        )
        return _reply(text, "info")

    # ── Help ──────────────────────────────────────────────────────────────────
    if intent == "help":
        text = (
            "🤖 **What I can answer:**\n\n"
            "• *Who should pay tomorrow?*\n"
            "• *Show overdue invoices*\n"
            "• *Which invoices are flagged?*\n"
            "• *Which clients are high risk?*\n"
            "• *Show the biggest unpaid invoices*\n"
            "• *Give me a dashboard overview*\n"
            "• *What is the late payment rate?*\n"
            "• *Which invoices are due this week?*\n"
            "• *Which invoices were paid today?*\n"
            "• *Show invoices by category / city*\n"
            "• *Who are the top clients?*\n"
            "• *Who are the worst payers?*\n"
            "• *Summary for client [name]*"
        )
        return _reply(text, "info")

    # ── Unknown ───────────────────────────────────────────────────────────────
    return _reply(
        "🤔 I didn't understand that. Try asking:\n"
        "• *Who should pay tomorrow?*\n"
        "• *Show flagged invoices*\n"
        "• *Dashboard overview*\n\n"
        "Type **help** to see everything I can do.",
        "info"
    )


def _reply(text: str, type_: str, table: list[dict] | None = None) -> dict:
    formatted_table = None
    if table and len(table) > 0:
        headers = list(table[0].keys())
        rows = [[str(item.get(h, "")) for h in headers] for item in table]
        formatted_table = {"headers": headers, "rows": rows}
    
    return {"text": text, "type": type_, "table": formatted_table}
