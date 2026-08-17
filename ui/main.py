import streamlit as st

from ui.pages.dashboard import show as dashboard
from ui.pages.portfolio import show as portfolio

st.set_page_config(
    page_title="BullCompass",
    page_icon="🐂",
    layout="wide"
)

page = st.sidebar.radio(
    "Navigation",
    [
        "Dashboard",
        "Portfolio",
        "Watchlist",
        "Market",
        "AI Analysis",
        "News",
        "Settings"
    ]
)

if page == "Dashboard":
    dashboard()

elif page == "Portfolio":
    portfolio()

elif page == "Watchlist":
    st.title("⭐ Watchlist")

elif page == "Market":
    st.title("📈 Market")

elif page == "AI Analysis":
    st.title("🤖 AI Analysis")

elif page == "News":
    st.title("📰 News")

elif page == "Settings":
    st.title("⚙️ Settings")