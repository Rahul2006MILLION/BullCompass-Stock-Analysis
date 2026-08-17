import streamlit as st

from app.agents.portfolio_agent import PortfolioAgent
from app.models.portfolio import PortfolioHolding


def show(
    agent: PortfolioAgent,
    holding: PortfolioHolding,
):

    if st.session_state.get("editing") != holding.id:
        return

    st.info(f"Editing {holding.ticker}")

    quantity = st.number_input(
        "Quantity",
        min_value=1.0,
        value=float(holding.quantity),
        key=f"qty_{holding.id}",
    )

    average_buy_price = st.number_input(
        "Buy Price",
        min_value=0.0,
        value=float(holding.average_buy_price),
        step=0.01,
        key=f"price_{holding.id}",
    )

    col1, col2 = st.columns(2)

    with col1:

        if st.button(
            "💾 Save",
            key=f"save_{holding.id}",
        ):

            agent.update_holding(
                holding.id,
                quantity,
                average_buy_price,
            )

            st.session_state["editing"] = None

            st.success("Holding updated successfully.")

            st.rerun()

    with col2:

        if st.button(
            "❌ Cancel",
            key=f"cancel_{holding.id}",
        ):

            st.session_state["editing"] = None

            st.rerun()