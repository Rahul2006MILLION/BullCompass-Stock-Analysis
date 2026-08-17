import streamlit as st

def show():
    st.title("🐂 BullCompass")

    st.markdown("## Welcome to your AI Investment Assistant")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.metric(
            "Portfolio Value",
            "₹0",
            "0%"
        )

    with col2:
        st.metric(
            "Today's Profit",
            "₹0",
            "0%"
        )

    with col3:
        st.metric(
            "Total Stocks",
            "0"
        )

    st.divider()

    st.subheader("📈 Market Overview")

    st.info("NIFTY, SENSEX and global market data will appear here.")

    st.divider()

    st.subheader("📰 Latest Important News")

    st.warning("No important news yet.")