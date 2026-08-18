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


def test_market_quote_valid():
    response = client.get("/api/market/quote/HDFCBANK")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] != ""
    assert data["current_price"] > 0
    assert data["market_cap"] > 0


def test_market_quote_invalid():
    # Invalid ticker PCJEWELLERS must return 404 and never return 0 values
    response = client.get("/api/market/quote/PCJEWELLERS")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "We couldn't find a listed stock matching 'PCJEWELLERS'." in data["detail"]

    # Random invalid ticker XYZABC123 must also return 404
    response = client.get("/api/market/quote/XYZABC123")
    assert response.status_code == 404


def test_market_status_endpoint():
    response = client.get("/api/market/status")
    assert response.status_code == 200
    data = response.json()
    assert "is_open" in data
    assert "status" in data
    assert "current_time_ist" in data
    assert "timezone" in data


def test_batch_quotes_post_endpoint():
    response = client.post("/api/quotes/batch", json={"tickers": ["TCS", "INFY", "^NSEI"]})
    assert response.status_code == 200
    data = response.json()
    assert "quotes" in data
    assert "market_status" in data
    quotes = data["quotes"]
    assert "TCS" in quotes
    assert "INFY" in quotes
    assert quotes["TCS"]["current_price"] is not None
    assert quotes["TCS"]["current_price"] > 0


def test_batch_quotes_get_endpoint():
    response = client.get("/api/quotes/batch?symbols=TCS,INFY")
    assert response.status_code == 200
    data = response.json()
    assert "quotes" in data
    quotes = data["quotes"]
    assert "TCS" in quotes
    assert "INFY" in quotes


if __name__ == "__main__":
    test_root_endpoint()
    test_portfolio_summary_endpoint()
    test_portfolio_history_endpoint()
    test_transactions_endpoint()
    test_realized_profit_endpoint()
    test_market_quote_valid()
    test_market_quote_invalid()
    test_market_status_endpoint()
    test_batch_quotes_post_endpoint()
    test_batch_quotes_get_endpoint()
    print("All backend API tests passed successfully!")

