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
            resolved = TickerService.resolve(symbol)
            ticker = yf.Ticker(resolved)
            info = ticker.info or {}

            if not info or not isinstance(info, dict):
                return False

            has_name = bool(info.get("longName") or info.get("shortName"))
            has_price = bool(
                info.get("currentPrice")
                or info.get("regularMarketPrice")
                or info.get("previousClose")
                or info.get("open")
            )
            if has_name and has_price:
                return True

            hist = ticker.history(period="1d")
            return not hist.empty

        except Exception:
            return False