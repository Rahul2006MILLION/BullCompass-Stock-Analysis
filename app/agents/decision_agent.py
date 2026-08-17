from typing import Dict, Any, Optional
from app.services.ollama_service import OllamaService
from app.services.stock_service import StockService
from app.services.research_coordinator import ResearchCoordinatorService
from app.models.fundamentals import ComprehensiveResearchReport


class DecisionAgent:
    """
    AI Investment Research Decision Agent.
    Coordinates deterministic fundamental extraction, scoring rules, and Ollama natural-language synthesis.
    """

    def __init__(
        self,
        llm: Optional[OllamaService] = None,
        stock_service: Optional[StockService] = None,
    ):
        self.llm = llm or OllamaService()
        self.stock_service = stock_service or StockService()
        self.coordinator = ResearchCoordinatorService()

    def generate_full_research_report(self, ticker: str) -> ComprehensiveResearchReport:
        """
        Executes the full institutional research pipeline.
        """
        return self.coordinator.generate_research_report(ticker)

    def analyze_company(self, ticker: str) -> str:
        """
        Legacy/Simple method: returns the AI research thesis markdown string.
        """
        report = self.generate_full_research_report(ticker)
        return report.ai_thesis_report