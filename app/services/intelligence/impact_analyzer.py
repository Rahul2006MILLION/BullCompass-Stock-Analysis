import json
import logging
import re
from typing import Optional, Dict, Any, List, Set

from app.models.intelligence import NewsEventExtraction, EventDirection
from app.models.news import NewsItem
from app.services.ollama_service import OllamaService

logger = logging.getLogger(__name__)


class NewsImpactAnalyzer:
    """
    Ollama-powered News Impact & Macro Event Analyzer.
    Extracts structured causal relationships, transmission mechanisms,
    durability (Structural vs Temporary), and affected sectors/beneficiaries/losers.
    """

    def __init__(self, ollama: Optional[OllamaService] = None):
        self.ollama = ollama or OllamaService()

    def cluster_news_items(self, news_items: List[NewsItem]) -> List[Dict[str, Any]]:
        """
        Groups duplicate or closely related news items into consolidated catalyst events
        with multi-source attribution.
        """
        clusters: List[Dict[str, Any]] = []
        
        # Stopwords to ignore in similarity matching
        stopwords = {
            "the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "is", "are", 
            "by", "with", "from", "as", "india", "indian", "market", "shares", "stocks", 
            "today", "q1", "q2", "q3", "q4", "fy24", "fy25", "fy26", "says", "report"
        }

        def get_keywords(text: str) -> Set[str]:
            words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
            return {w for w in words if w not in stopwords}

        for item in news_items:
            item_kw = get_keywords(f"{item.title} {item.summary or ''}")
            matched_cluster = None

            for cluster in clusters:
                cluster_kw = cluster["keywords"]
                overlap = len(item_kw.intersection(cluster_kw))
                # If significant overlap or exact entity match
                if overlap >= 3 or (len(item_kw) > 0 and overlap / len(item_kw) >= 0.5):
                    matched_cluster = cluster
                    break

            if matched_cluster:
                matched_cluster["articles"].append(item)
                matched_cluster["sources"].append(item.source)
                matched_cluster["headlines"].append(item.title)
                matched_cluster["keywords"].update(item_kw)
            else:
                clusters.append({
                    "primary_article": item,
                    "articles": [item],
                    "sources": [item.source],
                    "headlines": [item.title],
                    "keywords": item_kw,
                })

        return clusters

    def analyze_news_impact(
        self,
        title: str,
        summary: str,
        source: str = "",
        related_headlines: Optional[List[str]] = None
    ) -> NewsEventExtraction:
        prompt = self._build_prompt(title, summary, source, related_headlines)

        try:
            raw_response = self.ollama.chat(prompt)
            parsed = self._extract_json(raw_response)
            if parsed and isinstance(parsed, dict):
                return self._map_to_model(parsed, title, summary)
        except Exception as e:
            logger.warning(f"[IMPACT_ANALYZER] Ollama analysis fallback due to error: {e}")

        # Fallback to deterministic NLP extraction if Ollama is offline or returns invalid JSON
        return self._heuristic_fallback(title, summary)

    def _build_prompt(
        self,
        title: str,
        summary: str,
        source: str,
        related_headlines: Optional[List[str]] = None
    ) -> str:
        headlines_str = ""
        if related_headlines and len(related_headlines) > 1:
            headlines_str = "\nRELATED HEADLINES: " + " | ".join(related_headlines[:4])

        return f"""You are an elite Indian institutional equities research analyst at BullCompass.
Analyze the following financial, macroeconomic, or corporate catalyst event and extract its step-by-step causal impact on Indian listed equities.

PRIMARY NEWS HEADLINE: {title}{headlines_str}
NEWS SUMMARY: {summary}
SOURCE: {source}

Follow the core causal reasoning flow:
1. WHAT ACTUALLY HAPPENED? (Factual catalyst summary)
2. WHICH INDUSTRIES & SECTORS ARE AFFECTED?
3. WHO BENEFITS AND WHO IS HURT? (Identify specific beneficiaries and losers symmetrically)
4. HOW DOES IT TRANSMIT? (Input/output costs, borrowing costs, export demand, tariffs, margins, volumes)
5. TIME HORIZON & DURABILITY (Structural fundamental shift vs Temporary transitory effect)
6. WHAT WOULD INVALIDATE THIS THESIS?

Respond with ONLY a valid JSON object matching this exact schema (no markdown, no preamble):
{{
  "event_type": "string (e.g. Monetary Policy Rate Cut, Crude Oil Rally, Defence Capex Budget, Semiconductor PLI, USFDA Approval, Steel Import Tariff)",
  "event_summary": "string (1-2 sentences summarizing the core factual catalyst)",
  "affected_sectors": ["string", "string"],
  "affected_tickers": ["string", "string"],
  "direction": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
  "impact_strength": integer between 1 and 10 (10 = transformational macro policy, 1 = minor noise),
  "time_horizon": "1-3 months" | "6-12 months" | "1-3 years" | "3-5 years",
  "catalyst_durability": "STRUCTURAL" | "TEMPORARY",
  "transmission_mechanism": "string (Clear causal chain: Event -> Input/Output/Pricing -> Margin/Volume Impact -> Corporate Profitability)",
  "potential_beneficiaries": ["string", "string"],
  "potential_losers": ["string", "string"],
  "key_risks": ["string", "string"],
  "thesis_invalidation_triggers": ["string", "string"],
  "confidence": integer between 50 and 95
}}"""

    def _extract_json(self, text: str) -> Optional[Dict[str, Any]]:
        clean = text.strip()
        m = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", clean, re.DOTALL)
        if m:
            clean = m.group(1)
        else:
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

        confidence = int(data.get("confidence", 75))
        confidence = max(10, min(100, confidence))

        durability = str(data.get("catalyst_durability", "STRUCTURAL")).upper().strip()
        if durability not in ["STRUCTURAL", "TEMPORARY"]:
            durability = "STRUCTURAL"

        invalidation = [str(t) for t in data.get("thesis_invalidation_triggers", []) if t]
        if not invalidation:
            invalidation = [
                "Reversal of underlying macroeconomic / commodity trend",
                "Severe margin compression exceeding 250 bps",
                "Sharp slowdown in sector order inflows or execution pace"
            ]

        return NewsEventExtraction(
            event_type=str(data.get("event_type") or "Market Event"),
            event_summary=str(data.get("event_summary") or title),
            affected_sectors=[str(s) for s in data.get("affected_sectors", []) if s],
            affected_tickers=[str(t).upper().strip() for t in data.get("affected_tickers", []) if t],
            direction=direction,
            impact_strength=strength,
            time_horizon=str(data.get("time_horizon") or "1-3 years"),
            mechanism=str(data.get("transmission_mechanism") or "Direct economic transmission to sector demand and corporate earnings."),
            potential_beneficiaries=[str(b) for b in data.get("potential_beneficiaries", []) if b],
            potential_losers=[str(l) for l in data.get("potential_losers", []) if l],
            key_risks=[str(r) for r in data.get("key_risks", []) if r],
            confidence=confidence,
            catalyst_durability=durability,
            thesis_invalidation_triggers=invalidation,
        )

    def _heuristic_fallback(self, title: str, summary: str) -> NewsEventExtraction:
        full_text = f"{title} {summary}".lower()

        # 1. Crude Oil & Petrochemicals
        if any(w in full_text for w in ["crude", "brent", "oil price", "petroleum", "opec"]):
            is_fall = any(w in full_text for w in ["fall", "falls", "drop", "drops", "decline", "declines", "slump", "plunge"])
            if is_fall:
                return NewsEventExtraction(
                    event_type="Crude Oil Price Decline",
                    event_summary=title,
                    affected_sectors=["Aviation & Airlines", "Auto Ancillaries, Tyres & Batteries", "Chemicals, Specialty Chemicals & Agrochem", "Oil, Gas Exploration & Refining"],
                    affected_tickers=["INDIGO", "MRF", "APOLLOTYRE", "SRF", "AARTIIND", "ONGC"],
                    direction=EventDirection.POSITIVE,
                    impact_strength=8,
                    time_horizon="6-12 months",
                    mechanism="Lower crude reduces aviation turbine fuel (ATF), synthetic rubber, and petrochemical feedstock costs, expanding operating margins for downstream consumers while compressing upstream exploration realizations.",
                    potential_beneficiaries=["INDIGO", "MRF", "APOLLOTYRE", "CEATLTD", "SRF", "AARTIIND"],
                    potential_losers=["ONGC", "OIL", "RELIANCE"],
                    key_risks=["Rebound in geopolitical tensions pushing crude back up", "Currency depreciation offsetting USD savings"],
                    confidence=85,
                    catalyst_durability="TEMPORARY",
                    thesis_invalidation_triggers=["Brent crude rebounds sustainably above $85/bbl", "Aggressive price wars eroding margin benefits"],
                )
            else:
                return NewsEventExtraction(
                    event_type="Crude Oil Price Surge",
                    event_summary=title,
                    affected_sectors=["Oil, Gas Exploration & Refining", "Aviation & Airlines", "Auto Ancillaries, Tyres & Batteries", "Chemicals, Specialty Chemicals & Agrochem"],
                    affected_tickers=["ONGC", "OIL", "RELIANCE", "INDIGO", "MRF", "APOLLOTYRE"],
                    direction=EventDirection.MIXED,
                    impact_strength=8,
                    time_horizon="6-12 months",
                    mechanism="Elevated crude prices boost realization and EBITDA per barrel for upstream oil producers, while increasing input fuel and monomer costs for airlines, tyre makers, and specialty chemical producers.",
                    potential_beneficiaries=["ONGC", "OIL", "RELIANCE"],
                    potential_losers=["INDIGO", "SPICEJET", "MRF", "APOLLOTYRE", "SRF", "AARTIIND"],
                    key_risks=["Windfall taxes imposed on upstream producers", "Demand destruction if fuel prices remain elevated"],
                    confidence=85,
                    catalyst_durability="TEMPORARY",
                    thesis_invalidation_triggers=["OPEC output hike cooling crude below $70/bbl", "Government capping domestic fuel margins"],
                )

        # 2. RBI Repo Rate & Monetary Policy
        if any(w in full_text for w in ["repo rate", "rbi rate", "rate cut", "monetary policy", "interest rate"]):
            is_cut = any(w in full_text for w in ["cut", "cuts", "ease", "easing", "pause", "reduction"])
            if is_cut:
                return NewsEventExtraction(
                    event_type="RBI Monetary Policy Easing",
                    event_summary=title,
                    affected_sectors=["NBFC & Housing Finance", "Real Estate & Commercial REITs", "Automobile - Passenger, CV & 2W", "Banking - Private"],
                    affected_tickers=["BAJFINANCE", "CHOLAFIN", "DLF", "GODREJPROP", "MARUTI", "TATAMOTORS"],
                    direction=EventDirection.POSITIVE,
                    impact_strength=8,
                    time_horizon="1-3 years",
                    mechanism="Lower policy repo rate reduces wholesale cost of borrowing for NBFCs, boosts housing loan affordability for real estate buyers, and spurs consumer vehicle financing.",
                    potential_beneficiaries=["BAJFINANCE", "CHOLAFIN", "SHRIRAMFIN", "DLF", "GODREJPROP", "MARUTI", "M&M"],
                    potential_losers=["Banks with highly asset-sensitive loan books seeing immediate NIM compression"],
                    key_risks=["Sticky core inflation delaying transmission", "Deposit repricing lagging asset yield cuts"],
                    confidence=88,
                    catalyst_durability="STRUCTURAL",
                    thesis_invalidation_triggers=["Inflation spike forcing central bank policy reversal", "Asset quality deterioration in retail unsecured credit"],
                )
            else:
                return NewsEventExtraction(
                    event_type="Monetary Policy Tightening",
                    event_summary=title,
                    affected_sectors=["Real Estate & Commercial REITs", "NBFC & Housing Finance", "Banking - Public (PSU)"],
                    affected_tickers=["DLF", "BAJFINANCE", "LICHSGFIN"],
                    direction=EventDirection.NEGATIVE,
                    impact_strength=7,
                    time_horizon="6-12 months",
                    mechanism="Higher borrowing rates raise home loan EMIs and wholesale funding costs, dampening housing pre-sales and vehicle demand.",
                    potential_beneficiaries=["Cash-rich large commercial banks with deep CASA deposits"],
                    potential_losers=["DLF", "GODREJPROP", "BAJFINANCE", "LICHSGFIN"],
                    key_risks=["Prolonged high rate environment slowing overall GDP credit growth"],
                    confidence=80,
                    catalyst_durability="TEMPORARY",
                    thesis_invalidation_triggers=["Rapid inflation cooling prompting early rate cuts"],
                )

        # 3. Defence & Aerospace Indigenization
        if any(w in full_text for w in ["defence", "artillery", "warship", "missile", "fighter jet", "indigenization", "mod"]):
            return NewsEventExtraction(
                event_type="Defence Capex & Indigenization Order",
                event_summary=title,
                affected_sectors=["Defence & Aerospace", "Capital Goods & Heavy Electrical", "Auto Ancillaries, Tyres & Batteries"],
                affected_tickers=["HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP", "BHARATFORG", "SOLARINDS"],
                direction=EventDirection.POSITIVE,
                impact_strength=9,
                time_horizon="3-5 years",
                mechanism="Government budget allocations and multi-year DAC approvals provide massive multi-year order backlog visibility, high gross margins, and expanding export opportunities.",
                potential_beneficiaries=["HAL", "BEL", "BDL", "MAZDOCK", "COCHINSHIP", "SOLARINDS", "BHARATFORG"],
                potential_losers=["Foreign defence OEMs losing Indian market share"],
                key_risks=["Execution delays in component supply chains", "Working capital elongation"],
                confidence=90,
                catalyst_durability="STRUCTURAL",
                thesis_invalidation_triggers=["Sharp cut in capital acquisition defence budget", "Major contract cancellation or execution failure"],
            )

        # 4. Railways & Metro Infrastructure
        if any(w in full_text for w in ["railway", "rail", "vande bharat", "train", "track doubling", "kavach"]):
            return NewsEventExtraction(
                event_type="Railway Modernization & Rolling Stock Capex",
                event_summary=title,
                affected_sectors=["Railways & Rail Infrastructure", "Metals & Mining (Steel)", "Capital Goods & Heavy Electrical"],
                affected_tickers=["IRCTC", "IRFC", "RVNL", "RAILTEL", "TITAGARH", "JUPITERWAG", "JINDALSTEL"],
                direction=EventDirection.POSITIVE,
                impact_strength=8,
                time_horizon="1-3 years",
                mechanism="Indian Railways capital expenditure on Vande Bharat trainsets, freight corridors, and safety systems translates directly into revenue visibility for coach builders, wagon makers, and EPC contractors.",
                potential_beneficiaries=["TITAGARH", "JUPITERWAG", "RVNL", "RAILTEL", "IRFC", "JINDALSTEL"],
                potential_losers=["Unorganized road freight operators facing rail freight competition"],
                key_risks=["Budget reallocation", "Supply shortages in high-grade specialized steel"],
                confidence=88,
                catalyst_durability="STRUCTURAL",
                thesis_invalidation_triggers=["Railway capex slowing down or contracts facing retendering"],
            )

        # 5. Electronics PLI & Semiconductor Manufacturing
        if any(w in full_text for w in ["pli", "semiconductor", "electronics manufacturing", "chip", "osat", "subsidies"]):
            return NewsEventExtraction(
                event_type="Electronics & Semiconductor PLI Scheme",
                event_summary=title,
                affected_sectors=["Electronics Manufacturing Services (EMS) & Tech Hardware", "Information Technology & Software"],
                affected_tickers=["DIXON", "KAYNES", "SYRMA", "AMBER", "MOSCHIP"],
                direction=EventDirection.POSITIVE,
                impact_strength=9,
                time_horizon="3-5 years",
                mechanism="Fiscal incentives and capital subsidies under the PLI scheme improve asset turnover and operating margins, accelerating import substitution and export manufacturing scale.",
                potential_beneficiaries=["DIXON", "KAYNES", "SYRMA", "AMBER", "MOSCHIP"],
                potential_losers=["Importers of unbranded finished electronics facing higher custom duties"],
                key_risks=["Global component shortages", "Customer concentration risk"],
                confidence=88,
                catalyst_durability="STRUCTURAL",
                thesis_invalidation_triggers=["Discontinuation of government manufacturing subsidies", "Loss of anchor tier-1 OEM clients"],
            )

        # 6. Renewable Energy & Green Transition
        if any(w in full_text for w in ["solar", "wind", "renewable energy", "green hydrogen", "rooftop solar"]):
            return NewsEventExtraction(
                event_type="Renewable Energy Capacity Expansion",
                event_summary=title,
                affected_sectors=["Renewable & Clean Energy", "Power Generation & Transmission", "Capital Goods & Heavy Electrical"],
                affected_tickers=["SUZLON", "INOXWIND", "BORORENEW", "TATAPOWER", "ADANIGREEN", "WAAREEENER"],
                direction=EventDirection.POSITIVE,
                impact_strength=8,
                time_horizon="3-5 years",
                mechanism="Massive national capacity addition targets (500 GW by 2030) drive multi-year equipment orderbooks and EPC revenues for wind turbine and solar component manufacturers.",
                potential_beneficiaries=["SUZLON", "INOXWIND", "BORORENEW", "TATAPOWER", "WAAREEENER"],
                potential_losers=["High-emission thermal plants facing lower merit-order dispatch during peak renewable hours"],
                key_risks=["Grid connectivity bottlenecks", "Transmission line delays"],
                confidence=86,
                catalyst_durability="STRUCTURAL",
                thesis_invalidation_triggers=["State Discom power purchase agreement renegotiations", "Severe supply chain tariffs on critical rare earth inputs"],
            )

        # 7. Generic Keyword Sentiment Fallback
        pos_words = [
            "growth", "surge", "surges", "profit", "profits", "order", "contract", "record", 
            "upgrade", "approved", "approval", "strong", "expansion", "boost", "rally", "rallies", 
            "gain", "gains", "rise", "rises", "doubles", "massive", "rebound", "allocation", "budget", 
            "capex", "opportunity", "wins"
        ]
        neg_words = [
            "fall", "falls", "loss", "losses", "probe", "fraud", "penalty", "war", "tariff", 
            "tax hike", "downgrade", "curb", "slump", "slumps", "drop", "drops", "plunge", 
            "plunges", "crackdown", "investigation", "default", "crisis", "warning letter"
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
            detected_sectors.append("Banking - Private")
        if any(w in full_text for w in ["it", "tech", "software", "ai", "cloud", "digital", "tcs", "infosys"]):
            detected_sectors.append("Information Technology & Software")
        if any(w in full_text for w in ["infra", "road", "railway", "cement", "construction", "capex", "building"]):
            detected_sectors.append("Infrastructure, Engineering & Construction")
        if any(w in full_text for w in ["auto", "car", "ev", "vehicle", "truck", "tyre", "tractor"]):
            detected_sectors.append("Automobile - Passenger, CV & 2W")
        if any(w in full_text for w in ["pharma", "drug", "fda", "hospital", "healthcare", "medicine", "api"]):
            detected_sectors.append("Pharmaceuticals - Formulations & APIs")
        if any(w in full_text for w in ["fmcg", "consumer", "retail", "hotel", "food", "gold", "jewellery"]):
            detected_sectors.append("FMCG & Consumer Staples")
        if any(w in full_text for w in ["steel", "metal", "mining", "aluminium", "copper", "coal", "iron"]):
            detected_sectors.append("Metals & Mining (Steel)")
        if any(w in full_text for w in ["logistics", "port", "shipping", "freight", "transport"]):
            detected_sectors.append("Logistics, Ports & Marine Transportation")

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
            potential_losers=["High-cost marginal producers in the sector"],
            key_risks=["Macro execution risks", "Regulatory policy changes"],
            confidence=70,
            catalyst_durability="STRUCTURAL" if strength >= 7 else "TEMPORARY",
            thesis_invalidation_triggers=[
                "Unexpected macroeconomic slowdown in primary end-markets",
                "Severe raw material inflation that cannot be passed through to end customers"
            ],
        )

