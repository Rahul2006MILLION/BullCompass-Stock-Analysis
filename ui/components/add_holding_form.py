import streamlit as st

from app.agents.portfolio_agent import PortfolioAgent


def show(agent: PortfolioAgent):

    st.subheader("➕ Add Holding")

    ticker = st.text_input(
        "Ticker",
        placeholder="Example: LAURUSLABS"
    )

    quantity = st.number_input(
        "Quantity",
        min_value=1.0,
        step=1.0,
    )

    average_buy_price = st.number_input(
        "Buy Price",
        min_value=0.0,
        step=0.01,
    )

    if st.button("Add Holding"):

        if ticker.strip() == "":

            st.error("Please enter a ticker.")
            return

        agent.add_holding(
            ticker=ticker,
            quantity=quantity,
            average_buy_price=average_buy_price,
        )

        st.success("Holding added successfully!")

        st.rerun()