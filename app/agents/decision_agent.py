from app.services.ollama_service import OllamaService
from app.services.stock_service import StockService


class DecisionAgent:
    def __init__(
        self,
        llm: OllamaService,
        stock_service: StockService,
    ):
        self.llm = llm
        self.stock_service = stock_service

    def analyze_company(self, ticker: str) -> str:
        """
        Analyze a company using live stock data and the LLM.
        """

        # Fetch company information
        company = self.stock_service.get_company_info(ticker)

        # Build the prompt
        prompt = f"""
You are an experienced long-term investment analyst.

Analyze the following company.

Name: {company.name}
Ticker: {company.ticker}
Sector: {company.sector}
Industry: {company.industry}
Country: {company.country}
Market Cap: {company.market_cap}
Current Price: {company.current_price} {company.currency}

Provide your analysis in the following format:

1. Business Overview
2. Competitive Advantages
3. Potential Risks
4. Long-Term Outlook

Important:
- Do NOT predict future stock prices.
- Do NOT provide financial advice.
- Base your reasoning only on the information provided above.
"""

        # Ask the LLM for analysis
        return self.llm.chat(prompt)