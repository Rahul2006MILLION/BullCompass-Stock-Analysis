from typing import Dict, List, Optional, Set
import re


# Curated, Extensible Universe of NSE-Listed Leaders & Core Mid-caps across Sectors
NSE_SECTOR_UNIVERSE: Dict[str, List[Dict[str, str]]] = {
    "Banking & Financial Services": [
        {"ticker": "HDFCBANK", "name": "HDFC Bank Ltd.", "sub": "Private Bank"},
        {"ticker": "ICICIBANK", "name": "ICICI Bank Ltd.", "sub": "Private Bank"},
        {"ticker": "SBIN", "name": "State Bank of India", "sub": "PSU Bank"},
        {"ticker": "KOTAKBANK", "name": "Kotak Mahindra Bank", "sub": "Private Bank"},
        {"ticker": "AXISBANK", "name": "Axis Bank Ltd.", "sub": "Private Bank"},
        {"ticker": "BAJFINANCE", "name": "Bajaj Finance Ltd.", "sub": "NBFC"},
        {"ticker": "LTF", "name": "L&T Finance Ltd.", "sub": "NBFC"},
        {"ticker": "EDELWEISS", "name": "Edelweiss Financial Services", "sub": "Financial Services"},
    ],
    "Information Technology": [
        {"ticker": "TCS", "name": "Tata Consultancy Services", "sub": "IT Services"},
        {"ticker": "INFY", "name": "Infosys Ltd.", "sub": "IT Services"},
        {"ticker": "HCLTECH", "name": "HCL Technologies Ltd.", "sub": "IT Services"},
        {"ticker": "WIPRO", "name": "Wipro Ltd.", "sub": "IT Services"},
        {"ticker": "TECHM", "name": "Tech Mahindra Ltd.", "sub": "IT Services"},
        {"ticker": "LTIM", "name": "LTIMindtree Ltd.", "sub": "IT Services"},
    ],
    "Oil, Gas & Energy": [
        {"ticker": "RELIANCE", "name": "Reliance Industries Ltd.", "sub": "Oil & Telecom"},
        {"ticker": "ONGC", "name": "Oil & Natural Gas Corp.", "sub": "Oil Exploration"},
        {"ticker": "BPCL", "name": "Bharat Petroleum Corp.", "sub": "Oil Refining"},
        {"ticker": "IOC", "name": "Indian Oil Corp.", "sub": "Oil Refining"},
        {"ticker": "GAIL", "name": "GAIL (India) Ltd.", "sub": "Gas Transmission"},
    ],
    "Power & Renewable Energy": [
        {"ticker": "NTPC", "name": "NTPC Ltd.", "sub": "Power Generation"},
        {"ticker": "POWERGRID", "name": "Power Grid Corp.", "sub": "Power Transmission"},
        {"ticker": "TATAPOWER", "name": "Tata Power Company Ltd.", "sub": "Power & Renewables"},
        {"ticker": "ADANIPOWER", "name": "Adani Power Ltd.", "sub": "Thermal Power"},
        {"ticker": "SUZLON", "name": "Suzlon Energy Ltd.", "sub": "Wind Energy"},
        {"ticker": "VEDPOWER", "name": "Vedanta Power / Energy", "sub": "Power Generation"},
    ],
    "Infrastructure, Capital Goods & Construction": [
        {"ticker": "LT", "name": "Larsen & Toubro Ltd.", "sub": "Engineering & Construction"},
        {"ticker": "ULTRACEMCO", "name": "UltraTech Cement Ltd.", "sub": "Cement"},
        {"ticker": "AMBUJACEM", "name": "Ambuja Cements Ltd.", "sub": "Cement"},
        {"ticker": "SIEMENS", "name": "Siemens India Ltd.", "sub": "Capital Goods"},
        {"ticker": "ABB", "name": "ABB India Ltd.", "sub": "Heavy Electrical"},
        {"ticker": "BHEL", "name": "Bharat Heavy Electricals", "sub": "Capital Goods"},
        {"ticker": "NITCO", "name": "Nitco Ltd.", "sub": "Tiles & Building Materials"},
        {"ticker": "VISL", "name": "Vardhman Ispat / Steels", "sub": "Industrial Materials"},
    ],
    "Automobile & Auto Components": [
        {"ticker": "MARUTI", "name": "Maruti Suzuki India", "sub": "Passenger Vehicles"},
        {"ticker": "TATAMOTORS", "name": "Tata Motors Ltd.", "sub": "Commercial & Passenger Auto"},
        {"ticker": "M&M", "name": "Mahindra & Mahindra Ltd.", "sub": "Auto & Farm Equipment"},
        {"ticker": "BAJAJ-AUTO", "name": "Bajaj Auto Ltd.", "sub": "Two Wheelers"},
        {"ticker": "ASHOKLEY", "name": "Ashok Leyland Ltd.", "sub": "Commercial Vehicles"},
        {"ticker": "MRF", "name": "MRF Ltd.", "sub": "Tyres"},
    ],
    "Pharmaceuticals & Healthcare": [
        {"ticker": "SUNPHARMA", "name": "Sun Pharmaceutical Ind.", "sub": "Formulations"},
        {"ticker": "DRREDDY", "name": "Dr. Reddy's Laboratories", "sub": "Generics & APIs"},
        {"ticker": "CIPLA", "name": "Cipla Ltd.", "sub": "Generics & Inhalers"},
        {"ticker": "LAURUSLABS", "name": "Laurus Labs Ltd.", "sub": "APIs & CDMO"},
        {"ticker": "DIVISLAB", "name": "Divi's Laboratories Ltd.", "sub": "Active Pharma Ingredients"},
        {"ticker": "APOLLOHOSP", "name": "Apollo Hospitals Enterprise", "sub": "Healthcare Facilities"},
    ],
    "Consumer Goods & Retail": [
        {"ticker": "HINDUNILVR", "name": "Hindustan Unilever Ltd.", "sub": "FMCG"},
        {"ticker": "ITC", "name": "ITC Ltd.", "sub": "FMCG & Cigarettes"},
        {"ticker": "NESTLEIND", "name": "Nestle India Ltd.", "sub": "Packaged Foods"},
        {"ticker": "BRITANNIA", "name": "Britannia Industries Ltd.", "sub": "Bakery & Dairy"},
        {"ticker": "TITAN", "name": "Titan Company Ltd.", "sub": "Jewellery & Watches"},
        {"ticker": "PCJEWELLER", "name": "PC Jeweller Ltd.", "sub": "Jewellery Retail"},
        {"ticker": "LEMONTREE", "name": "Lemon Tree Hotels Ltd.", "sub": "Hospitality & Tourism"},
    ],
    "Metals & Mining": [
        {"ticker": "TATASTEEL", "name": "Tata Steel Ltd.", "sub": "Steel Production"},
        {"ticker": "JSWSTEEL", "name": "JSW Steel Ltd.", "sub": "Steel Production"},
        {"ticker": "HINDALCO", "name": "Hindalco Industries Ltd.", "sub": "Aluminium & Copper"},
        {"ticker": "COALINDIA", "name": "Coal India Ltd.", "sub": "Mining"},
        {"ticker": "VEDL", "name": "Vedanta Ltd.", "sub": "Diversified Natural Resources"},
    ],
    "Logistics, Ports & Transportation": [
        {"ticker": "ADANIPORTS", "name": "Adani Ports & SEZ Ltd.", "sub": "Ports & Logistics"},
        {"ticker": "CONCOR", "name": "Container Corp. of India", "sub": "Container Logistics"},
        {"ticker": "ALLCARGO", "name": "Allcargo Logistics Ltd.", "sub": "Multimodal Logistics"},
    ],
}


class StockUniverseRegistry:
    """
    Extensible Registry for Sector-to-Stock Mapping.
    """

    @classmethod
    def get_stocks_for_sectors(cls, sector_names: List[str]) -> List[Dict[str, str]]:
        matched: List[Dict[str, str]] = []
        seen_tickers: Set[str] = set()

        for query_sec in sector_names:
            clean_query = query_sec.lower().strip()
            for sector, stock_list in NSE_SECTOR_UNIVERSE.items():
                if (
                    clean_query in sector.lower()
                    or any(w in sector.lower() for w in clean_query.split() if len(w) > 3)
                ):
                    for stock in stock_list:
                        t = stock["ticker"]
                        if t not in seen_tickers:
                            seen_tickers.add(t)
                            matched.append({**stock, "sector": sector})

        return matched

    @classmethod
    def find_candidates_from_keywords(cls, keywords: List[str]) -> List[Dict[str, str]]:
        """
        Matches keywords (e.g. ['steel', 'infra', 'banking', 'tata', 'crude']) against universe.
        """
        matched: List[Dict[str, str]] = []
        seen_tickers: Set[str] = set()

        for kw in keywords:
            clean_kw = kw.lower().strip()
            if not clean_kw or len(clean_kw) < 2:
                continue

            for sector, stock_list in NSE_SECTOR_UNIVERSE.items():
                # Match sector name
                sector_match = clean_kw in sector.lower()

                for stock in stock_list:
                    ticker = stock["ticker"]
                    name = stock["name"].lower()
                    sub = stock["sub"].lower()

                    if (
                        sector_match
                        or clean_kw == ticker.lower()
                        or clean_kw in name
                        or clean_kw in sub
                    ):
                        if ticker not in seen_tickers:
                            seen_tickers.add(ticker)
                            matched.append({**stock, "sector": sector})

        return matched

    @classmethod
    def get_company_meta(cls, ticker: str) -> Optional[Dict[str, str]]:
        clean_t = ticker.strip().upper()
        for sector, stock_list in NSE_SECTOR_UNIVERSE.items():
            for stock in stock_list:
                if stock["ticker"] == clean_t:
                    return {**stock, "sector": sector}
        return None

    @classmethod
    def get_all_tickers(cls) -> List[str]:
        all_t: List[str] = []
        for stock_list in NSE_SECTOR_UNIVERSE.values():
            for stock in stock_list:
                all_t.append(stock["ticker"])
        return all_t
