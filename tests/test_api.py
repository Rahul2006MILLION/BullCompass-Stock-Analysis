from fastapi.testclient import TestClient
from app.api.main import app

client = TestClient(app)


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["app"] == "BullCompass"


def test_portfolio_summary_endpoint():
    response = client.get("/api/portfolio")
    assert response.status_code == 200
    data = response.json()
    assert "total_holdings" in data
    assert "total_invested" in data
    assert "total_current_value" in data
    assert "total_unrealized_profit" in data
    assert "total_return_percentage" in data
    assert "total_realized_profit" in data
    assert isinstance(data["holdings"], list)


def test_portfolio_history_endpoint():
    response = client.get("/api/portfolio/history")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_transactions_endpoint():
    response = client.get("/api/portfolio/transactions")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


def test_realized_profit_endpoint():
    response = client.get("/api/portfolio/realized-profit")
    assert response.status_code == 200
    data = response.json()
    assert "realized_profit" in data


if __name__ == "__main__":
    test_root_endpoint()
    test_portfolio_summary_endpoint()
    test_portfolio_history_endpoint()
    test_transactions_endpoint()
    test_realized_profit_endpoint()
    print("All backend API tests passed successfully!")
