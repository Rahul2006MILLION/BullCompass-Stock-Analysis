import unittest
import tempfile
import shutil
from unittest.mock import patch, MagicMock
from app.services.market_data.angel_symbol_resolver import AngelOneSymbolResolver
from app.services.market_data.angel_auth import AngelOneAuthManager, generate_totp_code
from app.services.market_data.angel_provider import AngelOneMarketDataProvider
from app.services.market_data.base import NormalizedQuote
from app.services.stock_service import StockService


class TestAngelOneProvider(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.resolver = AngelOneSymbolResolver()

    def setUp(self):
        from app.services.market_session import MarketSessionManager
        from app.services.canonical_valuation_service import CanonicalValuationService
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def tearDown(self):
        from app.services.market_session import MarketSessionManager
        from app.services.canonical_valuation_service import CanonicalValuationService
        MarketSessionManager.reset_instance()
        CanonicalValuationService.reset_instance()

    def test_totp_generator(self):
        # Base32 secret test
        secret = "JBSWY3DPEHPK3PXP"
        code = generate_totp_code(secret)
        self.assertIsInstance(code, str)
        self.assertEqual(len(code), 6)
        self.assertTrue(code.isdigit())

    def test_symbol_resolution_required_stocks(self):
        expected = {
            "MRF": ("MRF-EQ", "2277"),
            "NITCO": ("NITCO-EQ", "13300"),
            "HDFCBANK": ("HDFCBANK-EQ", "1333"),
            "INFY": ("INFY-EQ", "1594"),
            "TCS": ("TCS-EQ", "11536"),
            "RELIANCE": ("RELIANCE-EQ", "2885"),
            "ADANIPOWER": ("ADANIPOWER-EQ", "17388"),
            "SUZLON": ("SUZLON-EQ", "12018"),
        }

        for ticker, (expected_sym, expected_token) in expected.items():
            inst = self.resolver.resolve_instrument(ticker)
            self.assertIsNotNone(inst, f"Failed to resolve {ticker}")
            self.assertEqual(inst.symbol, expected_sym, f"Mismatch symbol for {ticker}")
            self.assertEqual(inst.token, expected_token, f"Mismatch token for {ticker}")
            self.assertEqual(inst.exch_seg, "NSE")

    def test_symbol_resolution_variations(self):
        # Test .NS suffix, lowercase, spaces
        inst1 = self.resolver.resolve_instrument("infy.ns")
        self.assertIsNotNone(inst1)
        self.assertEqual(inst1.token, "1594")

        inst2 = self.resolver.resolve_instrument(" MRF-EQ ")
        self.assertIsNotNone(inst2)
        self.assertEqual(inst2.token, "2277")

        inst_invalid = self.resolver.resolve_instrument("NON_EXISTENT_TICKER_12345")
        self.assertIsNone(inst_invalid)

    def test_mrf_ltp_vs_ask_acceptance(self):
        """
        CRITICAL MRF ACCEPTANCE TEST:
        Ensure that Angel One Market Data response with:
        LTP = 133500.0, ASK = 133505.0, BID = 133490.0
        strictly produces:
        ltp = 133500.0
        current_price = 133500.0
        and NEVER uses ASK (133505.0) as LTP.
        """
        mock_auth = MagicMock(spec=AngelOneAuthManager)
        mock_auth.is_configured = True
        mock_auth.api_key = "test_key"
        mock_auth.get_jwt_token.return_value = "mock_jwt_token"

        provider = AngelOneMarketDataProvider(
            auth_manager=mock_auth,
            symbol_resolver=self.resolver,
        )

        mock_api_response = {
            "status": True,
            "message": "SUCCESS",
            "errorcode": "",
            "data": {
                "fetched": [
                    {
                        "exchange": "NSE",
                        "tradingSymbol": "MRF-EQ",
                        "symbolToken": "2277",
                        "ltp": 133500.0,
                        "open": 133400.0,
                        "high": 134000.0,
                        "low": 133000.0,
                        "close": 133200.0,
                        "totTradedQty": 1500,
                        "depth": {
                            "buy": [{"price": 133490.0, "quantity": 10, "orders": 1}],
                            "sell": [{"price": 133505.0, "quantity": 5, "orders": 1}],
                        },
                    }
                ],
                "unfetched": [],
            },
        }

        with patch("requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_api_response

            quote = provider.get_quote("MRF")
            self.assertIsNotNone(quote)
            self.assertEqual(quote.ltp, 133500.0)
            self.assertEqual(quote.bid, 133490.0)
            self.assertEqual(quote.ask, 133505.0)
            self.assertEqual(quote.trading_symbol, "MRF-EQ")
            self.assertEqual(quote.symbol_token, "2277")
            self.assertEqual(quote.provider, "angelone")

            quote_dict = quote.to_dict()
            # Most important assertions
            self.assertEqual(quote_dict["current_price"], 133500.0)
            self.assertEqual(quote_dict["ltp"], 133500.0)
            self.assertNotEqual(quote_dict["current_price"], 133505.0)
            self.assertNotEqual(quote_dict["ltp"], 133505.0)

    def test_batch_quotes_parsing(self):
        mock_auth = MagicMock(spec=AngelOneAuthManager)
        mock_auth.is_configured = True
        mock_auth.api_key = "test_key"
        mock_auth.get_jwt_token.return_value = "mock_jwt_token"

        provider = AngelOneMarketDataProvider(
            auth_manager=mock_auth,
            symbol_resolver=self.resolver,
        )

        mock_api_response = {
            "status": True,
            "message": "SUCCESS",
            "errorcode": "",
            "data": {
                "fetched": [
                    {
                        "exchange": "NSE",
                        "tradingSymbol": "INFY-EQ",
                        "symbolToken": "1594",
                        "ltp": 1850.50,
                        "open": 1840.0,
                        "high": 1860.0,
                        "low": 1835.0,
                        "close": 1845.0,
                        "totTradedQty": 100000,
                        "depth": {
                            "buy": [{"price": 1850.0, "quantity": 100, "orders": 5}],
                            "sell": [{"price": 1851.0, "quantity": 50, "orders": 2}],
                        },
                    },
                    {
                        "exchange": "NSE",
                        "tradingSymbol": "TCS-EQ",
                        "symbolToken": "11536",
                        "ltp": 4200.0,
                        "open": 4180.0,
                        "high": 4220.0,
                        "low": 4175.0,
                        "close": 4190.0,
                        "totTradedQty": 50000,
                        "depth": {
                            "buy": [{"price": 4199.5, "quantity": 20, "orders": 1}],
                            "sell": [{"price": 4201.0, "quantity": 15, "orders": 1}],
                        },
                    },
                ],
                "unfetched": [],
            },
        }

        with patch("requests.post") as mock_post:
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_api_response

            batch = provider.get_batch_quotes(["INFY", "TCS"])
            self.assertIn("INFY", batch)
            self.assertIn("TCS", batch)

            self.assertEqual(batch["INFY"].ltp, 1850.50)
            self.assertEqual(batch["INFY"].trading_symbol, "INFY-EQ")
            self.assertEqual(batch["INFY"].symbol_token, "1594")

            self.assertEqual(batch["TCS"].ltp, 4200.0)
            self.assertEqual(batch["TCS"].trading_symbol, "TCS-EQ")
            self.assertEqual(batch["TCS"].symbol_token, "11536")

    def test_stock_service_with_angel_provider(self):
        mock_auth = MagicMock(spec=AngelOneAuthManager)
        mock_auth.is_configured = True
        mock_auth.api_key = "test_key"
        mock_auth.get_jwt_token.return_value = "mock_jwt_token"

        provider = AngelOneMarketDataProvider(
            auth_manager=mock_auth,
            symbol_resolver=self.resolver,
        )

        mock_api_response = {
            "status": True,
            "message": "SUCCESS",
            "errorcode": "",
            "data": {
                "fetched": [
                    {
                        "exchange": "NSE",
                        "tradingSymbol": "RELIANCE-EQ",
                        "symbolToken": "2885",
                        "ltp": 2950.75,
                        "open": 2940.0,
                        "high": 2965.0,
                        "low": 2930.0,
                        "close": 2945.0,
                        "totTradedQty": 80000,
                        "depth": {
                            "buy": [{"price": 2950.50, "quantity": 10, "orders": 1}],
                            "sell": [{"price": 2951.00, "quantity": 10, "orders": 1}],
                        },
                    }
                ],
                "unfetched": [],
            },
        }

        from app.services.market_session import MarketSessionManager, MarketSessionInfo
        mock_session_info = MarketSessionInfo(
            session_id="NSE-TEST-SESSION",
            is_open=True,
            status="OPEN",
            current_time_ist="2026-08-19 11:30:00 IST",
            session_date="2026-08-19",
            next_session_start_ist="2026-08-20 09:15:00 IST",
            is_frozen=False,
        )

        with patch("requests.post") as mock_post, \
             patch.object(MarketSessionManager, "get_session_info", return_value=mock_session_info):
            mock_post.return_value.status_code = 200
            mock_post.return_value.json.return_value = mock_api_response

            stock_service = StockService(provider=provider)
            quotes = stock_service.get_batch_quotes(["RELIANCE"])
            self.assertIn("RELIANCE", quotes)
            self.assertEqual(quotes["RELIANCE"]["current_price"], 2950.75)
            self.assertEqual(quotes["RELIANCE"]["ltp"], 2950.75)
            self.assertEqual(quotes["RELIANCE"]["trading_symbol"], "RELIANCE-EQ")
            self.assertEqual(quotes["RELIANCE"]["symbol_token"], "2885")
            self.assertEqual(quotes["RELIANCE"]["provider"], "angelone")

    def test_full_portfolio_angel_authenticated_valuation(self):
        """
        Requirement 8 & 9: Verify that when Angel One is authenticated,
        every holding is valued using the authoritative Angel One response:
        - LAURUSLABS (20 qty) @ 1801.80 -> 36036.00
        - Full 12 holdings total -> 91113.80
        - Invested value -> 57597.47
        - Unrealized P&L -> 33516.33
        - Telemetry reports authenticated=True, fallback_used=False
        """
        from app.models.portfolio import PortfolioHolding
        from app.services.canonical_valuation_service import CanonicalValuationService
        from app.services.market_session import MarketSessionManager, MarketSessionInfo

        mock_auth = MagicMock(spec=AngelOneAuthManager)
        mock_auth.is_configured = True
        mock_auth.api_key = "test_key"
        mock_auth.get_jwt_token.return_value = "mock_jwt_token"

        provider = AngelOneMarketDataProvider(
            auth_manager=mock_auth,
            symbol_resolver=self.resolver,
        )

        # Official 12 holdings with exact quantities and average buy prices
        portfolio_holdings = [
            PortfolioHolding(id=1, ticker="LAURUSLABS", quantity=20.0, average_buy_price=442.82),
            PortfolioHolding(id=2, ticker="LTF", quantity=50.0, average_buy_price=173.23),
            PortfolioHolding(id=3, ticker="NITCO", quantity=100.0, average_buy_price=79.21),
            PortfolioHolding(id=4, ticker="EDELWEISS", quantity=54.0, average_buy_price=80.00),
            PortfolioHolding(id=5, ticker="LEMONTREE", quantity=50.0, average_buy_price=144.06),
            PortfolioHolding(id=6, ticker="VISL", quantity=150.0, average_buy_price=36.59),
            PortfolioHolding(id=7, ticker="SUZLON", quantity=80.0, average_buy_price=68.64),
            PortfolioHolding(id=8, ticker="VEDPOWER", quantity=100.0, average_buy_price=41.20),
            PortfolioHolding(id=9, ticker="ADANIPOWER", quantity=11.0, average_buy_price=174.21),
            PortfolioHolding(id=10, ticker="ASHOKLEY", quantity=9.0, average_buy_price=212.14),
            PortfolioHolding(id=11, ticker="PCJEWELLER", quantity=140.0, average_buy_price=10.14),
            PortfolioHolding(id=12, ticker="ALLCARGO", quantity=38.0, average_buy_price=7.65),
        ]

        # Authoritative Angel One SmartAPI response payload for all 12 tokens
        mock_api_response = {
            "status": True,
            "message": "SUCCESS",
            "errorcode": "",
            "data": {
                "fetched": [
                    {"exchange": "NSE", "tradingSymbol": "LAURUSLABS-EQ", "symbolToken": "19234", "ltp": 1801.80, "close": 1814.00},
                    {"exchange": "NSE", "tradingSymbol": "LTF-EQ", "symbolToken": "24948", "ltp": 315.40, "close": 325.10},
                    {"exchange": "NSE", "tradingSymbol": "NITCO-EQ", "symbolToken": "13300", "ltp": 90.15, "close": 91.81},
                    {"exchange": "NSE", "tradingSymbol": "EDELWEISS-EQ", "symbolToken": "15119", "ltp": 122.27, "close": 121.09},
                    {"exchange": "NSE", "tradingSymbol": "LEMONTREE-EQ", "symbolToken": "2606", "ltp": 108.08, "close": 108.95},
                    {"exchange": "NSE", "tradingSymbol": "VISL-EQ", "symbolToken": "750290", "ltp": 36.11, "close": 37.41},
                    {"exchange": "NSE", "tradingSymbol": "SUZLON-EQ", "symbolToken": "12018", "ltp": 46.77, "close": 47.78},
                    {"exchange": "NSE", "tradingSymbol": "VEDPOWER-EQ", "symbolToken": "750518", "ltp": 35.87, "close": 36.22},
                    {"exchange": "NSE", "tradingSymbol": "ADANIPOWER-EQ", "symbolToken": "17388", "ltp": 204.02, "close": 205.58},
                    {"exchange": "NSE", "tradingSymbol": "ASHOKLEY-EQ", "symbolToken": "212", "ltp": 173.10, "close": 176.35},
                    {"exchange": "NSE", "tradingSymbol": "PCJEWELLER-EQ", "symbolToken": "29124", "ltp": 9.68, "close": 9.61},
                    {"exchange": "NSE", "tradingSymbol": "ALLCARGO-EQ", "symbolToken": "13501", "ltp": 10.10, "close": 9.91},
                ],
                "unfetched": [],
            },
        }

        mock_session_info = MarketSessionInfo(
            session_id="NSE-20260819-SESSION",
            is_open=False,
            status="CLOSED",
            current_time_ist="2026-08-19 17:35:00 IST",
            session_date="2026-08-19",
            next_session_start_ist="2026-08-20 09:15:00 IST",
            is_frozen=True,
        )

        temp_dir = tempfile.mkdtemp()
        try:
            temp_session_manager = MarketSessionManager(storage_dir=temp_dir)
            with patch("requests.post") as mock_post, \
                 patch.object(temp_session_manager, "get_session_info", return_value=mock_session_info):
                mock_post.return_value.status_code = 200
                mock_post.return_value.json.return_value = mock_api_response

                canonical_svc = CanonicalValuationService(
                    provider=provider,
                    session_manager=temp_session_manager,
                )

                result = canonical_svc.evaluate_portfolio(portfolio_holdings, force_refresh=True)

            # Step 8 Verification: LAURUSLABS
            laurus_val = next(h for h in result.holdings if h.holding.ticker == "LAURUSLABS")
            self.assertEqual(laurus_val.current_price, 1801.80)
            self.assertEqual(laurus_val.current_value, 36036.00)
            self.assertEqual(laurus_val.invested, 8856.40)
            self.assertEqual(laurus_val.profit, 27179.60)

            # Step 9 Verification: Entire Portfolio
            self.assertEqual(result.total_invested, 57597.47)
            self.assertEqual(result.total_current_value, 91113.80)
            self.assertEqual(result.total_unrealized_profit, 33516.33)

            # Telemetry verification: authenticated=True, fallback_used=False
            for h in result.holdings:
                self.assertTrue(h.telemetry.authenticated)
                self.assertFalse(h.telemetry.fallback_used)
                self.assertEqual(h.telemetry.quote_source, "angelone")
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


if __name__ == "__main__":
    unittest.main()
