import json
import logging
import re
from typing import Optional, Dict, Any, List

from app.models.intelligence import NewsEventExtraction, EventDirection
from app.services.ollama_service import OllamaService

logger = logging.getLogger(__name__)


class NewsImpactAnalyzer:
    """
    Ollama-powered News Impact & Macro Event Analyzer.
    Extracts structured causal relationships, transmission mechanisms,
    and affected sectors/beneficiaries from any financial news item.
    """

    def __init__(self, ollama: Optional[OllamaService] = None):
        self.ollama = ollama or OllamaService()

    def analyze_news_impact(self, title: str, summary: str, source: str = "") -> NewsEventExtraction:
        prompt = self._build_prompt(title, summary, source)

        try:
            raw_response = self.ollama.chat(prompt)
            parsed = self._extract_json(raw_response)
            if parsed and isinstance(parsed, dict):
                return self._map_to_model(parsed, title, summary)
        except Exception as e:
            logger.warning(f"[IMPACT_ANALYZER] Ollama analysis fallback due to error: {e}")

        # Fallback to deterministic NLP extraction if Ollama is offline or returns invalid JSON
        return self._heuristic_fallback(title, summary)

    def _build_prompt(self, title: str, summary: str, source: str) -> str:
        return f"""You are an elite Indian institutional equities research analyst.
Analyze the following financial/economic/corporate news event and extract its causal impact on Indian listed sectors and companies.

NEWS HEADLINE: {title}
NEWS SUMMARY: {summary}
SOURCE: {source}

Respond with ONLY a valid JSON object matching this exact schema (no markdown, no other text):
{{
  "event_type": "string (e.g. RBI Rate Decision, Crude Oil Spike, Infrastructure Budget, Earnings Surprise, Tariff Announcement, Management Change, Regulatory Policy)",
  "event_summary": "string (1-2 sentences summarizing the core factual catalyst)",
  "affected_sectors": ["string", "string"],
  "affected_tickers": ["string", "string"],
  "direction": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
  "impact_strength": integer between 1 and 10 (10 = massive structural impact, 1 = trivial),
  "time_horizon": "1-3 months" | "6-12 months" | "1-3 years" | "3-5 years",
  "transmission_mechanism": "string (Explain precisely how this event transmits to corporate revenues, input costs, margins, borrowing rates, or pricing power)",
  "potential_beneficiaries": ["string", "string"],
  "potential_losers": ["string", "string"],
  "key_risks": ["string", "string"],
  "confidence": integer between 40 and 95
}}"""

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        clean = text.strip()
        # Look for json code block ```json ... ```
        m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", clean, re.DOTALL)
        if m:
            clean = m.group(1)
        else:
            # Look for outermost curly braces
            start = clean.find("{")
            end = clean.rfind("}")
            if start != -1 and end != -1 and end > start:
                clean = clean[start : end + 1]

        try:
            return json.loads(clean)
        except Exception:
            return None

    def _map_to_model(self, data: Dict[str, Any], title: str, summary: str) -> NewsEventExtraction:
        direction_str = str(data.get("direction", "NEUTRAL")).upper().strip()
        try:
            direction = EventDirection(direction_str)
        except ValueError:
            direction = EventDirection.NEUTRAL

        strength = int(data.get("impact_strength", 5))
        strength = max(1, min(10, strength))

        confidence = int(data.get("confidence", 70))
        confidence = max(10, min(100, confidence))

        return NewsEventExtraction(
            event_type=str(data.get("event_type") or "Market Event"),
            event_summary=str(data.get("event_summary") or title),
            affected_sectors=[str(s) for s in data.get("affected_sectors", []) if s],
            affected_tickers=[str(t).upper().strip() for t in data.get("affected_tickers", []) if t],
            direction=direction,
            impact_strength=strength,
            time_horizon=str(data.get("time_horizon") or "1-3 years"),
            mechanism=str(data.get("transmission_mechanism") or "Direct economic transmission to sector demand and margins."),
            potential_beneficiaries=[str(b) for b in data.get("potential_beneficiaries", []) if b],
            potential_losers=[str(l) for l in data.get("potential_losers", []) if l],
            key_risks=[str(r) for r in data.get("key_risks", []) if r],
            confidence=confidence,
        )

    def _heuristic_fallback(self, title: str, summary: str) -> NewsEventExtraction:
        full_text = f"{title} {summary}".lower()

        # Deterministic sentiment keywords
        pos_words = [
            "growth", "surge", "surges", "profit", "profits", "order", "contract", "record", 
            "upgrade", "approved", "approval", "strong", "rbi cut", "expansion", "boost", 
            "boosts", "rally", "rallies", "gain", "gains", "rise", "rises", "doubles", 
            "massive", "rebound", "allocation", "budget", "capex", "opportunity", "wins"
        ]
        neg_words = [
            "fall", "falls", "loss", "losses", "probe", "fraud", "penalty", "war", "tariff", 
            "tax hike", "inflation", "downgrade", "curb", "slump", "slumps", "drop", "drops", 
            "plunge", "plunges", "crackdown", "investigation", "default", "crisis"
        ]

        pos_count = sum(1 for w in pos_words if w in full_text)
        neg_count = sum(1 for w in neg_words if w in full_text)

        if pos_count > neg_count:
            direction = EventDirection.POSITIVE
            strength = min(9, 5 + pos_count)
        elif neg_count > pos_count:
            direction = EventDirection.NEGATIVE
            strength = min(9, 5 + neg_count)
        else:
            direction = EventDirection.NEUTRAL
            strength = 5

        # Sector detection
        detected_sectors = []
        if any(w in full_text for w in ["bank", "nbfc", "credit", "loan", "rbi", "repo", "deposit"]):
            detected_sectors.append("Banking & Financial Services")
        if any(w in full_text for w in ["it", "tech", "software", "ai", "cloud", "digital", "tcs", "infosys"]):
            detected_sectors.append("Information Technology")
        if any(w in full_text for w in ["crude", "oil", "petrol", "diesel", "gas", "refining", "brent"]):
            detected_sectors.append("Oil, Gas & Energy")
        if any(w in full_text for w in ["power", "solar", "wind", "renewable", "electricity", "grid"]):
            detected_sectors.append("Power & Renewable Energy")
        if any(w in full_text for w in ["infra", "road", "railway", "cement", "construction", "capex", "building"]):
            detected_sectors.append("Infrastructure, Capital Goods & Construction")
        if any(w in full_text for w in ["auto", "car", "ev", "vehicle", "truck", "tyre", "tractor"]):
            detected_sectors.append("Automobile & Auto Components")
        if any(w in full_text for w in ["pharma", "drug", "fda", "hospital", "healthcare", "medicine", "api"]):
            detected_sectors.append("Pharmaceuticals & Healthcare")
        if any(w in full_text for w in ["fmcg", "consumer", "retail", "hotel", "food", "gold", "jewellery"]):
            detected_sectors.append("Consumer Goods & Retail")
        if any(w in full_text for w in ["steel", "metal", "mining", "aluminium", "copper", "coal", "iron"]):
            detected_sectors.append("Metals & Mining")
        if any(w in full_text for w in ["logistics", "port", "shipping", "freight", "transport"]):
            detected_sectors.append("Logistics, Ports & Transportation")

        if not detected_sectors:
            detected_sectors.append("General Market")

        return NewsEventExtraction(
            event_type="Market Catalyst",
            event_summary=title,
            affected_sectors=detected_sectors,
            affected_tickers=[],
            direction=direction,
            impact_strength=strength,
            time_horizon="1-3 years",
            mechanism="Transmission via sector volume growth, operating margins, or capital costs.",
            potential_beneficiaries=[f"Market leaders in {detected_sectors[0]}"],
            potential_losers=["High-cost marginal producers"],
            key_risks=["Macro execution risks", "Regulatory changes"],
            confidence=65,
        )
