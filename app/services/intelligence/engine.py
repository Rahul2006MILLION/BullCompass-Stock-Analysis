import logging
from typing import List, Optional, Dict, Any, Set
from app.models.intelligence import InvestmentOpportunity
from app.services.intelligence.impact_analyzer import NewsImpactAnalyzer
from app.services.intelligence.evaluator import OpportunityEvaluator
from app.services.intelligence.universe import StockUniverseRegistry
from app.database.intelligence_repository import IntelligenceRepository
from app.database.news_repository import NewsRepository

logger = logging.getLogger(__name__)


class InvestmentIntelligenceEngine:
    """
    Core AI Investment Intelligence Coordinator.
    Scans macro/sector/corporate news, maps events to candidate equities across the NSE universe,
    evaluates fundamentals, valuation, and hard risk gates, and stores actionable investment opportunities.
    """

    def __init__(
        self,
        impact_analyzer: Optional[NewsImpactAnalyzer] = None,
        evaluator: Optional[OpportunityEvaluator] = None,
        intelligence_repo: Optional[IntelligenceRepository] = None,
        news_repo: Optional[NewsRepository] = None,
    ):
        self.impact_analyzer = impact_analyzer or NewsImpactAnalyzer()
        self.evaluator = evaluator or OpportunityEvaluator()
        self.intelligence_repo = intelligence_repo or IntelligenceRepository()
        self.news_repo = news_repo or NewsRepository()

    def scan_and_generate_opportunities(self, max_articles: int = 15) -> List[InvestmentOpportunity]:
        """
        Scans fresh news articles, clusters duplicates into unified catalyst events,
        discovers beneficiaries and losers across the 33-sector NSE universe,
        evaluates fundamentals, cash flows, valuations, and hard risk gates,
        and generates structured investment opportunities.
        """
        recent_news = self.news_repo.get_recent_news(limit=max_articles)
        if not recent_news or len(recent_news) < 4:
            logger.info("[INTELLIGENCE_ENGINE] Syncing fresh news from market feeds...")
            try:
                from app.services.news_service import NewsService
                NewsService().sync_news(limit_per_provider=20)
                recent_news = self.news_repo.get_recent_news(limit=max_articles)
            except Exception as se:
                logger.warning(f"[INTELLIGENCE_ENGINE] News auto-sync warning: {se}")

        if not recent_news:
            logger.info("[INTELLIGENCE_ENGINE] No news articles available to scan.")
            return []

        # 1. Cluster Duplicate / Related News Articles into Unified Catalyst Events
        clusters = self.impact_analyzer.cluster_news_items(recent_news)
        logger.info(f"[INTELLIGENCE_ENGINE] Grouped {len(recent_news)} articles into {len(clusters)} distinct catalyst events.")

        discovered_opportunities: List[InvestmentOpportunity] = []
        seen_tickers: Set[str] = set()

        for cluster in clusters:
            primary_article = cluster["primary_article"]
            sources = list(set(cluster["sources"]))
            headlines = cluster["headlines"]

            try:
                # 2. Causal Extraction with Multi-Source Context
                extraction = self.impact_analyzer.analyze_news_impact(
                    title=primary_article.title,
                    summary=primary_article.summary or primary_article.title,
                    source=", ".join(sources[:3]),
                    related_headlines=headlines,
                )

                # 3. Symmetrically Discover Both Beneficiaries and Losers
                mapping = StockUniverseRegistry.find_beneficiaries_and_losers(
                    event_type=extraction.event_type,
                    keywords=list(extraction.affected_sectors) + extraction.potential_beneficiaries + extraction.potential_losers + extraction.affected_tickers,
                    direction=extraction.direction.value,
                )

                candidate_beneficiaries = mapping.get("beneficiaries", [])
                candidate_losers = mapping.get("losers", [])

                # Combine candidates with explicit direction tags
                all_candidates: List[Dict[str, Any]] = []
                for b in candidate_beneficiaries:
                    all_candidates.append({**b, "candidate_role": "BENEFICIARY"})
                for l in candidate_losers:
                    all_candidates.append({**l, "candidate_role": "LOSER"})

                # Also include directly named tickers
                for raw_t in extraction.affected_tickers:
                    clean_t = raw_t.strip().upper()
                    if clean_t and not any(c["ticker"] == clean_t for c in all_candidates):
                        all_candidates.append({"ticker": clean_t, "name": clean_t, "sector": "General", "candidate_role": "DIRECT_MENTION"})

                # Limit evaluation to top 4 candidates per cluster (up to 2 beneficiaries and 2 losers)
                beneficiary_count = 0
                loser_count = 0

                for candidate in all_candidates:
                    ticker = candidate["ticker"]
                    role = candidate.get("candidate_role", "BENEFICIARY")

                    if role == "BENEFICIARY" and beneficiary_count >= 2:
                        continue
                    if role == "LOSER" and loser_count >= 2:
                        continue

                    if ticker in seen_tickers:
                        continue
                    seen_tickers.add(ticker)

                    # Tailor event extraction direction if evaluating a recognized loser
                    candidate_event = extraction
                    if role == "LOSER":
                        candidate_event = NewsEventExtraction(
                            event_type=extraction.event_type,
                            event_summary=extraction.event_summary,
                            affected_sectors=extraction.affected_sectors,
                            affected_tickers=extraction.affected_tickers,
                            direction=EventDirection.NEGATIVE,
                            impact_strength=extraction.impact_strength,
                            time_horizon=extraction.time_horizon,
                            mechanism=f"Headwind: {extraction.mechanism}",
                            potential_beneficiaries=extraction.potential_beneficiaries,
                            potential_losers=extraction.potential_losers,
                            key_risks=extraction.key_risks,
                            confidence=extraction.confidence,
                            catalyst_durability=extraction.catalyst_durability,
                            thesis_invalidation_triggers=extraction.thesis_invalidation_triggers,
                        )

                    opp = self.evaluator.evaluate_candidate(
                        ticker=ticker,
                        news_event=candidate_event,
                        news_id=primary_article.id,
                        news_title=primary_article.title,
                        news_source=", ".join(sources[:2]),
                        news_published_at=primary_article.published_at,
                        news_sources=sources,
                        related_headlines=headlines,
                    )

                    if opp is not None:
                        opp_id = self.intelligence_repo.save_opportunity(opp)
                        opp.id = opp_id
                        discovered_opportunities.append(opp)

                        if role == "BENEFICIARY":
                            beneficiary_count += 1
                        elif role == "LOSER":
                            loser_count += 1

            except Exception as e:
                logger.error(f"[INTELLIGENCE_ENGINE] Error evaluating catalyst '{primary_article.title}': {e}")

        # Sort opportunities by conviction score descending
        discovered_opportunities.sort(key=lambda x: x.conviction_score, reverse=True)
        logger.info(f"[INTELLIGENCE_ENGINE] Scan complete. Generated {len(discovered_opportunities)} ranked opportunities.")
        return discovered_opportunities

    def get_opportunities(
        self,
        limit: int = 50,
        offset: int = 0,
        recommendation: Optional[str] = None,
        sector: Optional[str] = None,
        search: Optional[str] = None,
        auto_scan_if_empty: bool = True,
    ) -> List[InvestmentOpportunity]:
        count = self.intelligence_repo.get_opportunities_count()
        if count == 0 and auto_scan_if_empty:
            self.scan_and_generate_opportunities(max_articles=10)

        return self.intelligence_repo.get_opportunities(
            limit=limit,
            offset=offset,
            recommendation=recommendation,
            sector=sector,
            search=search,
        )

    def get_opportunity_by_id(self, opp_id: int) -> Optional[InvestmentOpportunity]:
        return self.intelligence_repo.get_opportunity_by_id(opp_id)
