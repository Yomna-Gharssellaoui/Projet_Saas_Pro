"""
db/query_engine.py
Maps parsed intents → SQL queries on your PostgreSQL invoice database.
Returns structured data that the response builder formats into chat messages.
"""

import os
from datetime import date, timedelta
from typing import Any
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load .env from the root Back-End directory
env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", ".env")
load_dotenv(env_path)

DB_CONFIG = {
    "host":     os.getenv("DB_HOST",     "localhost"),
    "port":     int(os.getenv("DB_PORT", "5432")),
    "dbname":   os.getenv("DB_NAME",     "saas_db"),
    "user":     os.getenv("DB_USER",     "postgres"),
    "password": os.getenv("DB_PASS",     "9512"),
}

# Adjust these to match your actual PostgreSQL table/column names
TABLE          = os.getenv("INVOICE_TABLE", "invoices")
COL_DUE        = '"dueDate"'
COL_ISSUED     = '"issueDate"'
COL_CLIENT     = '"clientName"'
COL_CLIENT_ID  = '"clientId"'
COL_AMOUNT     = '"subtotal"'
COL_AMOUNT_TTC = '"totalAmount"'
COL_STATUS     = '"status"'
COL_ANOMALY    = '"anomaly_flag"'   # 1 = flagged by IsolationForest
COL_RISK_SCORE = '"risk_score"'     # probability of being late
COL_INVOICE_ID = '"id"'


def get_conn():
    return psycopg2.connect(**DB_CONFIG, cursor_factory=psycopg2.extras.RealDictCursor)


def run(sql: str, params: tuple = ()) -> list[dict]:
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return [dict(r) for r in cur.fetchall()]


def run_one(sql: str, params: tuple = ()) -> dict | None:
    rows = run(sql, params)
    return rows[0] if rows else None


# ── Query library ─────────────────────────────────────────────────────────────

def due_tomorrow() -> list[dict]:
    tomorrow = date.today() + timedelta(days=1)
    return run(f"""
        SELECT {COL_INVOICE_ID} AS id, {COL_CLIENT} AS client_nom, {COL_AMOUNT_TTC} AS montant_ttc,
               {COL_DUE} AS date_echeance, {COL_RISK_SCORE} AS risk_score
        FROM   {TABLE}
        WHERE  DATE({COL_DUE}) = %s
          AND  {COL_STATUS} NOT IN ('paid')
        ORDER  BY {COL_AMOUNT_TTC} DESC
        LIMIT  50
    """, (tomorrow,))


def due_this_week() -> list[dict]:
    today = date.today()
    week  = today + timedelta(days=7)
    return run(f"""
        SELECT {COL_INVOICE_ID} AS id, {COL_CLIENT} AS client_nom, {COL_AMOUNT_TTC} AS montant_ttc,
               {COL_DUE} AS date_echeance, {COL_RISK_SCORE} AS risk_score
        FROM   {TABLE}
        WHERE  DATE({COL_DUE}) BETWEEN %s AND %s
          AND  {COL_STATUS} NOT IN ('paid')
        ORDER  BY {COL_DUE}, {COL_AMOUNT_TTC} DESC
        LIMIT  100
    """, (today, week))


def overdue_invoices() -> list[dict]:
    return run(f"""
        SELECT {COL_INVOICE_ID} AS id, {COL_CLIENT} AS client_nom, {COL_AMOUNT_TTC} AS montant_ttc,
               {COL_DUE} AS date_echeance,
               CURRENT_DATE - DATE({COL_DUE}) AS days_overdue,
               {COL_RISK_SCORE} AS risk_score
        FROM   {TABLE}
        WHERE  DATE({COL_DUE}) < CURRENT_DATE
          AND  {COL_STATUS} NOT IN ('paid')
        ORDER  BY days_overdue DESC
        LIMIT  50
    """)


def flagged_anomalies() -> list[dict]:
    return run(f"""
        SELECT {COL_INVOICE_ID} AS id, {COL_CLIENT} AS client_nom, {COL_AMOUNT_TTC} AS montant_ttc,
               {COL_DUE} AS date_echeance, {COL_ANOMALY} AS anomaly_flag, {COL_RISK_SCORE} AS risk_score
        FROM   {TABLE}
        WHERE  {COL_ANOMALY} = 1
        ORDER  BY {COL_RISK_SCORE} DESC
        LIMIT  50
    """)


def high_risk_clients() -> list[dict]:
    return run(f"""
        SELECT {COL_CLIENT} AS client_nom,
               COUNT(*)                              AS total_invoices,
               ROUND(AVG({COL_RISK_SCORE})::numeric, 3) AS avg_risk,
               SUM({COL_AMOUNT_TTC})                AS total_outstanding
        FROM   {TABLE}
        WHERE  {COL_STATUS} NOT IN ('paid')
        GROUP  BY {COL_CLIENT}
        HAVING AVG({COL_RISK_SCORE}) > 0.6
        ORDER  BY avg_risk DESC
        LIMIT  20
    """)


def top_unpaid(min_amount: float = 0) -> list[dict]:
    return run(f"""
        SELECT {COL_INVOICE_ID} AS id, {COL_CLIENT} AS client_nom, {COL_AMOUNT_TTC} AS montant_ttc,
               {COL_DUE} AS date_echeance, {COL_RISK_SCORE} AS risk_score
        FROM   {TABLE}
        WHERE  {COL_STATUS} NOT IN ('paid')
          AND  {COL_AMOUNT_TTC} >= %s
        ORDER  BY {COL_AMOUNT_TTC} DESC
        LIMIT  20
    """, (min_amount,))


def stats_overview() -> dict:
    return run_one(f"""
        SELECT
          COUNT(*)                                              AS total_invoices,
          COUNT(*) FILTER (WHERE {COL_STATUS} NOT IN ('paid')) AS unpaid,
          COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue')      AS total_late,
          COUNT(*) FILTER (WHERE {COL_ANOMALY} = 1)             AS flagged,
          ROUND(
            100.0 * COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue')
            / NULLIF(COUNT(*),0), 2)                          AS late_rate_pct,
          COALESCE(SUM({COL_AMOUNT_TTC}) FILTER (
            WHERE {COL_STATUS} NOT IN ('paid')), 0)             AS total_outstanding
        FROM {TABLE}
    """)


def late_rate() -> dict:
    return run_one(f"""
        SELECT
          COUNT(*)                                  AS total,
          COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue')   AS late,
          ROUND(100.0 * COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue')
                / NULLIF(COUNT(*),0), 2)            AS late_pct
        FROM {TABLE}
    """)


def paid_today() -> list[dict]:
    return run(f"""
        SELECT {COL_INVOICE_ID} AS id, {COL_CLIENT} AS client_nom, {COL_AMOUNT_TTC} AS montant_ttc, {COL_STATUS} AS statut_facture
        FROM   {TABLE}
        WHERE  {COL_STATUS} IN ('paid')
        ORDER  BY {COL_AMOUNT_TTC} DESC
        LIMIT  30
    """)


def by_category() -> list[dict]:
    return []


def by_city() -> list[dict]:
    return []


def top_clients() -> list[dict]:
    return run(f"""
        SELECT {COL_CLIENT} AS client_nom,
               COUNT(*)                                        AS total_invoices,
               ROUND(100.0 * COUNT(*) FILTER (WHERE {COL_STATUS} != 'overdue')
                     / NULLIF(COUNT(*),0), 1)                  AS ontime_pct,
               ROUND(SUM({COL_AMOUNT_TTC})::numeric, 2)       AS total_billed
        FROM   {TABLE}
        GROUP  BY {COL_CLIENT}
        HAVING COUNT(*) >= 3
        ORDER  BY ontime_pct DESC, total_billed DESC
        LIMIT  10
    """)


def worst_payers() -> list[dict]:
    return run(f"""
        SELECT {COL_CLIENT} AS client_nom,
               COUNT(*)                                        AS total_invoices,
               COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue') AS late_count,
               ROUND(100.0 * COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue')
                     / NULLIF(COUNT(*),0), 1)                  AS late_pct
        FROM   {TABLE}
        GROUP  BY {COL_CLIENT}
        HAVING COUNT(*) >= 2
        ORDER  BY late_pct DESC
        LIMIT  10
    """)


def client_summary(client_name: str) -> dict | None:
    return run_one(f"""
        SELECT {COL_CLIENT} AS client_nom,
               COUNT(*)                                        AS total_invoices,
               COUNT(*) FILTER (WHERE {COL_STATUS} = 'overdue') AS late_count,
               ROUND(AVG({COL_RISK_SCORE})::numeric, 3)       AS avg_risk,
               ROUND(SUM({COL_AMOUNT_TTC})::numeric, 2)       AS total_billed,
               COUNT(*) FILTER (WHERE {COL_STATUS} NOT IN ('paid')) AS open_invoices
        FROM   {TABLE}
        WHERE  LOWER({COL_CLIENT}) LIKE LOWER(%s)
        GROUP  BY {COL_CLIENT}
        LIMIT  1
    """, (f"%{client_name}%",))
