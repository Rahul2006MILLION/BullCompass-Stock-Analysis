from app.agents.decision_agent import DecisionAgent
from app.services.ollama_service import OllamaService
from app.services.stock_service import StockService


def main():
    # Create services
    ollama = OllamaService()
    stock_service = StockService()

    # Create the decision agent
    agent = DecisionAgent(
        ollama,
        stock_service,
    )

    # Analyze a company
    analysis = agent.analyze_company("TCS.NS")

    print("\n========== BullCompass ==========\n")
    print(analysis)


if __name__ == "__main__":
    main()