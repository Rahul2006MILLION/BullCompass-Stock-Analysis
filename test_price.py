from app.services.stock_service import StockService

service = StockService()

print(service.get_current_price("TCS.NS"))