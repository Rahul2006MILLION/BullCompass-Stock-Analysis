import logging
from app.config import settings
from app.services.market_data.base import MarketDataProvider
from app.services.market_data.nse_provider import NSEMarketDataProvider
from app.services.market_data.angel_provider import AngelOneMarketDataProvider
from app.services.market_data.live_provider import LiveMarketDataProvider
from app.services.market_data.dhan_provider import DhanMarketDataProvider
from app.services.market_data.yf_provider import YahooFinanceProvider

logger = logging.getLogger(__name__)

_active_provider: MarketDataProvider = None


def get_market_data_provider() -> MarketDataProvider:
    """
    Factory to retrieve the active market data provider based on environment settings.
    Defaults to Authoritative NSE Market Data Provider.
    """
    global _active_provider
    if _active_provider is not None:
        return _active_provider

    provider_name = (settings.MARKET_DATA_PROVIDER or "nse").lower().strip()

    if provider_name in ["nse", "nse_official", "default"]:
        logger.info("[MARKET_DATA_FACTORY] Initialized NSEMarketDataProvider (authoritative NSE data)")
        _active_provider = NSEMarketDataProvider()
    elif provider_name in ["angelone", "angel_one", "angel", "smartapi"]:
        logger.info("[MARKET_DATA_FACTORY] Initialized AngelOneMarketDataProvider")
        _active_provider = AngelOneMarketDataProvider()
    elif provider_name == "dhan" and settings.DHAN_CLIENT_ID and settings.DHAN_ACCESS_TOKEN:
        logger.info("[MARKET_DATA_FACTORY] Initialized DhanMarketDataProvider")
        _active_provider = DhanMarketDataProvider(
            client_id=settings.DHAN_CLIENT_ID,
            access_token=settings.DHAN_ACCESS_TOKEN,
        )
    elif provider_name == "yfinance":
        logger.info("[MARKET_DATA_FACTORY] Initialized YahooFinanceProvider")
        _active_provider = YahooFinanceProvider()
    elif provider_name == "live":
        logger.info("[MARKET_DATA_FACTORY] Initialized LiveMarketDataProvider")
        _active_provider = LiveMarketDataProvider()
    else:
        logger.info(f"[MARKET_DATA_FACTORY] Initialized default NSEMarketDataProvider (requested: {provider_name})")
        _active_provider = NSEMarketDataProvider()

    return _active_provider


def reset_market_data_provider() -> None:
    """Reset the cached active market data provider instance."""
    global _active_provider
    _active_provider = None


