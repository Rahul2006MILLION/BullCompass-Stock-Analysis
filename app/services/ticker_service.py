import yfinance as yf


class TickerService:
    """
    Resolves user input into a Yahoo Finance ticker.
    """

    @staticmethod
    def resolve(symbol: str) -> str:
        symbol = symbol.strip().upper()

        # Already contains an exchange
        if "." in symbol:
            return symbol

        # Default to NSE
        return f"{symbol}.NS"

    @staticmethod
    def is_valid(symbol: str) -> bool:
        try:
            ticker = yf.Ticker(symbol)
            info = ticker.info

            return bool(info.get("longName"))

        except Exception:
            return False