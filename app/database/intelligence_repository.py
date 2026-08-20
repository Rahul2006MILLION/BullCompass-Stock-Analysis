import json
import logging
from typing import List, Optional, Dict, Any
from app.database.database import Database
from app.models.intelligence import (
    InvestmentOpportunity,
    RecommendationType,
    ScoreBreakdown,
    QuantitativeFactors,
    HardGateTrigger,
)

logger = logging.getLogger(__name__)


class IntelligenceRepository:
    """
    Repository for persisting and querying AI Investment Opportunities.
    """

    def __init__(self, db: Optional[Database] = None):
        self.db = db or Database()

    def save_opportunity(self, opp: InvestmentOpportunity) -> int:
        cursor = self.db.connection.cursor()
        
        # Upsert by (ticker, news_id) or insert
        scores_json = json.dumps({
            "fundamental_score": opp.scores.fundamental_score,
            "earnings_quality_score": opp.scores.earnings_quality_score,
            "valuation_score": opp.scores.valuation_score,
            "price_reaction_score": opp.scores.price_reaction_score,
            "news_catalyst_score": opp.scores.news_catalyst_score,
            "overall_conviction": opp.scores.overall_conviction,
            "valuation_tier": opp.valuation_tier,
            "catalyst_durability": opp.catalyst_durability,
        })
        metrics_json = json.dumps({
            "revenue_cagr_3y": opp.metrics.revenue_cagr_3y,
            "profit_cagr_3y": opp.metrics.profit_cagr_3y,
            "operating_margin": opp.metrics.operating_margin,
            "net_margin": opp.metrics.net_margin,
            "roe": opp.metrics.roe,
            "roce": opp.metrics.roce,
            "debt_to_equity": opp.metrics.debt_to_equity,
            "pe_ratio": opp.metrics.pe_ratio,
            "pb_ratio": opp.metrics.pb_ratio,
            "ev_to_ebitda": opp.metrics.ev_to_ebitda,
            "cfo_to_pat_ratio": opp.metrics.cfo_to_pat_ratio,
            "price_change_1d": opp.metrics.price_change_1d,
            "price_change_5d": opp.metrics.price_change_5d,
            "price_change_20d": opp.metrics.price_change_20d,
            "distance_from_52w_high_pct": opp.metrics.distance_from_52w_high_pct,
            "valuation_tier": opp.metrics.valuation_tier,
            "current_price": opp.metrics.current_price,
            "market_cap_cr": opp.metrics.market_cap_cr,
            "is_financial_institution": opp.metrics.is_financial_institution,
            "news_sources": opp.news_sources,
            "related_headlines": opp.related_headlines,
        })
        hard_gates_json = json.dumps([
            {
                "gate_name": g.gate_name,
                "description": g.description,
                "impact_on_decision": g.impact_on_decision,
            }
            for g in opp.hard_gates_triggered
        ])
        key_catalysts_json = json.dumps(opp.key_catalysts)
        key_risks_json = json.dumps(opp.key_risks)
        thesis_invalidation_json = json.dumps(opp.thesis_invalidation_triggers)

        cursor.execute(
            """
            INSERT INTO investment_opportunities (
                ticker, company_name, sector, industry, recommendation,
                conviction_score, time_horizon, current_price, news_id,
                news_title, news_source, news_published_at, event_summary,
                impact_direction, impact_strength, transmission_mechanism,
                scores_json, metrics_json, hard_gates_json, is_owned,
                portfolio_quantity, portfolio_avg_buy_price, portfolio_allocation_pct,
                investment_thesis, key_catalysts_json, key_risks_json,
                thesis_invalidation_json, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                opp.ticker,
                opp.company_name,
                opp.sector,
                opp.industry,
                opp.recommendation.value,
                opp.conviction_score,
                opp.time_horizon,
                opp.current_price,
                opp.news_id,
                opp.news_title,
                opp.news_source,
                opp.news_published_at,
                opp.event_summary,
                opp.impact_direction,
                opp.impact_strength,
                opp.transmission_mechanism,
                scores_json,
                metrics_json,
                hard_gates_json,
                1 if opp.is_owned else 0,
                opp.portfolio_quantity,
                opp.portfolio_avg_buy_price,
                opp.portfolio_allocation_pct,
                opp.investment_thesis,
                key_catalysts_json,
                key_risks_json,
                thesis_invalidation_json,
                opp.created_at,
            ),
        )
        self.db.connection.commit()
        opp_id = cursor.lastrowid
        return opp_id

    def get_opportunities(
        self,
        limit: int = 50,
        offset: int = 0,
        recommendation: Optional[str] = None,
        sector: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[InvestmentOpportunity]:
        cursor = self.db.connection.cursor()
        query = "SELECT * FROM investment_opportunities WHERE 1=1"
        params: List[Any] = []

        if recommendation and recommendation != "ALL":
            query += " AND recommendation = ?"
            params.append(recommendation.upper().strip())

        if sector and sector != "ALL":
            query += " AND sector = ?"
            params.append(sector.strip())

        if search:
            query += " AND (ticker LIKE ? OR company_name LIKE ? OR event_summary LIKE ? OR investment_thesis LIKE ?)"
            term = f"%{search.strip()}%"
            params.extend([term, term, term, term])

        query += " ORDER BY id DESC LIMIT ? OFFSET ?"
        params.extend([limit, offset])

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()
        return [self._row_to_model(r) for r in rows]

    def get_opportunity_by_id(self, opp_id: int) -> Optional[InvestmentOpportunity]:
        cursor = self.db.connection.cursor()
        cursor.execute("SELECT * FROM investment_opportunities WHERE id = ?", (opp_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return self._row_to_model(row)

    def get_opportunities_count(self) -> int:
        cursor = self.db.connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM investment_opportunities")
        return cursor.fetchone()[0]

    def _row_to_model(self, row: Any) -> InvestmentOpportunity:
        (
            opp_id,
            ticker,
            company_name,
            sector,
            industry,
            recommendation_str,
            conviction_score,
            time_horizon,
            current_price,
            news_id,
            news_title,
            news_source,
            news_published_at,
            event_summary,
            impact_direction,
            impact_strength,
            transmission_mechanism,
            scores_json,
            metrics_json,
            hard_gates_json,
            is_owned_int,
            portfolio_quantity,
            portfolio_avg_buy_price,
            portfolio_allocation_pct,
            investment_thesis,
            key_catalysts_json,
            key_risks_json,
            thesis_invalidation_json,
            created_at,
        ) = row

        scores_dict = json.loads(scores_json) if scores_json else {}
        metrics_dict = json.loads(metrics_json) if metrics_json else {}
        hard_gates_list = json.loads(hard_gates_json) if hard_gates_json else []
        catalysts_list = json.loads(key_catalysts_json) if key_catalysts_json else []
        risks_list = json.loads(key_risks_json) if key_risks_json else []
        invalidation_list = json.loads(thesis_invalidation_json) if thesis_invalidation_json else []

        scores = ScoreBreakdown(
            fundamental_score=int(scores_dict.get("fundamental_score", 50)),
            earnings_quality_score=int(scores_dict.get("earnings_quality_score", 50)),
            valuation_score=int(scores_dict.get("valuation_score", 50)),
            price_reaction_score=int(scores_dict.get("price_reaction_score", 50)),
            news_catalyst_score=int(scores_dict.get("news_catalyst_score", 50)),
            overall_conviction=int(scores_dict.get("overall_conviction", 50)),
        )

        valuation_tier = (
            metrics_dict.get("valuation_tier")
            or scores_dict.get("valuation_tier")
            or "FAIRLY_VALUED"
        )
        catalyst_durability = (
            scores_dict.get("catalyst_durability")
            or "STRUCTURAL"
        )
        news_sources = metrics_dict.get("news_sources") or ([news_source] if news_source else [])
        related_headlines = metrics_dict.get("related_headlines") or ([news_title] if news_title else [])

        metrics = QuantitativeFactors(
            revenue_cagr_3y=metrics_dict.get("revenue_cagr_3y"),
            profit_cagr_3y=metrics_dict.get("profit_cagr_3y"),
            operating_margin=metrics_dict.get("operating_margin"),
            net_margin=metrics_dict.get("net_margin"),
            roe=metrics_dict.get("roe"),
            roce=metrics_dict.get("roce"),
            debt_to_equity=metrics_dict.get("debt_to_equity"),
            pe_ratio=metrics_dict.get("pe_ratio"),
            pb_ratio=metrics_dict.get("pb_ratio"),
            ev_to_ebitda=metrics_dict.get("ev_to_ebitda"),
            cfo_to_pat_ratio=metrics_dict.get("cfo_to_pat_ratio"),
            price_change_5d=metrics_dict.get("price_change_5d"),
            current_price=float(metrics_dict.get("current_price", current_price)),
            market_cap_cr=float(metrics_dict.get("market_cap_cr", 0.0)),
            is_financial_institution=bool(metrics_dict.get("is_financial_institution", False)),
            price_change_1d=metrics_dict.get("price_change_1d"),
            price_change_20d=metrics_dict.get("price_change_20d"),
            distance_from_52w_high_pct=metrics_dict.get("distance_from_52w_high_pct"),
            valuation_tier=valuation_tier,
        )

        hard_gates = [
            HardGateTrigger(
                gate_name=g.get("gate_name", ""),
                description=g.get("description", ""),
                impact_on_decision=g.get("impact_on_decision", ""),
            )
            for g in hard_gates_list
        ]

        try:
            rec = RecommendationType(recommendation_str)
        except ValueError:
            rec = RecommendationType.WATCH

        return InvestmentOpportunity(
            id=opp_id,
            ticker=ticker,
            company_name=company_name,
            sector=sector,
            industry=industry,
            recommendation=rec,
            conviction_score=conviction_score,
            time_horizon=time_horizon,
            current_price=current_price,
            news_id=news_id,
            news_title=news_title,
            news_source=news_source,
            news_published_at=news_published_at,
            event_summary=event_summary,
            impact_direction=impact_direction,
            impact_strength=impact_strength,
            transmission_mechanism=transmission_mechanism,
            scores=scores,
            metrics=metrics,
            hard_gates_triggered=hard_gates,
            is_owned=bool(is_owned_int),
            portfolio_quantity=portfolio_quantity,
            portfolio_avg_buy_price=portfolio_avg_buy_price,
            portfolio_allocation_pct=portfolio_allocation_pct,
            investment_thesis=investment_thesis,
            key_catalysts=catalysts_list,
            key_risks=risks_list,
            thesis_invalidation_triggers=invalidation_list,
            created_at=created_at,
            valuation_tier=valuation_tier,
            catalyst_durability=catalyst_durability,
            news_sources=news_sources,
            related_headlines=related_headlines,
        )
