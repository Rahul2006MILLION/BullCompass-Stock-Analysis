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

    def scan_and_generate_opportunities(self, max_articles: int = 6) -> List[InvestmentOpportunity]:
        """
        Scans fresh important news articles, discovers affected stocks across the universe,
        and generates structured multi-factor investment opportunities.
        """
        recent_news = self.news_repo.get_recent_news(limit=max_articles)
        if not recent_news:
            logger.info("[INTELLIGENCE_ENGINE] No news articles found. Syncing fresh news...")
            try:
                from app.services.news_service import NewsService
                NewsService().sync_news(limit_per_provider=15)
                recent_news = self.news_repo.get_recent_news(limit=max_articles)
            except Exception as se:
                logger.warning(f"[INTELLIGENCE_ENGINE] News auto-sync warning: {se}")

        if not recent_news:
            logger.info("[INTELLIGENCE_ENGINE] No news articles available to scan.")
            return []

        discovered_opportunities: List[InvestmentOpportunity] = []
        seen_tickers: Set[str] = set()

        for article in recent_news:
            try:
                # 1. Ollama Event Extraction
                extraction = self.impact_analyzer.analyze_news_impact(
                    title=article.title,
                    summary=article.summary or article.title,
                    source=article.source,
                )

                # 2. Map Event to Universe Candidates
                search_terms = list(extraction.affected_sectors) + extraction.potential_beneficiaries + extraction.potential_losers + extraction.affected_tickers
                candidates = StockUniverseRegistry.find_candidates_from_keywords(search_terms)

                # Also include any directly mentioned tickers
                for raw_t in extraction.affected_tickers:
                    clean_t = raw_t.strip().upper()
                    if clean_t and not any(c["ticker"] == clean_t for c in candidates):
                        candidates.append({"ticker": clean_t, "name": clean_t, "sector": "General"})

                # Limit candidate evaluation to top 2 per article to keep processing fast and focused
                for candidate in candidates[:2]:
                    ticker = candidate["ticker"]
                    if ticker in seen_tickers:
                        continue
                    seen_tickers.add(ticker)

                    opp = self.evaluator.evaluate_candidate(
                        ticker=ticker,
                        news_event=extraction,
                        news_id=article.id,
                        news_title=article.title,
                        news_source=article.source,
                        news_published_at=article.published_at,
                    )

                    if opp is not None:
                        opp_id = self.intelligence_repo.save_opportunity(opp)
                        opp.id = opp_id
                        discovered_opportunities.append(opp)

            except Exception as e:
                logger.error(f"[INTELLIGENCE_ENGINE] Error evaluating article '{article.title}': {e}")

        logger.info(f"[INTELLIGENCE_ENGINE] Scan complete. Generated {len(discovered_opportunities)} opportunities.")
        return discovered_opportunities

    def get_opportunities(
        self,
        limit: int = 30,
        offset: int = 0,
        recommendation: Optional[str] = None,
        sector: Optional[str] = None,
        search: Optional[str] = None,
        auto_scan_if_empty: bool = True,
    ) -> List[InvestmentOpportunity]:
        count = self.intelligence_repo.get_opportunities_count()
        if count == 0 and auto_scan_if_empty:
            self.scan_and_generate_opportunities(max_articles=4)

        return self.intelligence_repo.get_opportunities(
            limit=limit,
            offset=offset,
            recommendation=recommendation,
            sector=sector,
            search=search,
        )

    def get_opportunity_by_id(self, opp_id: int) -> Optional[InvestmentOpportunity]:
        return self.intelligence_repo.get_opportunity_by_id(opp_id)
