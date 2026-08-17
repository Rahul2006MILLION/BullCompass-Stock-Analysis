import streamlit as st

from app.agents.portfolio_agent import PortfolioAgent
from app.models.portfolio import PortfolioHolding


def show(
    agent: PortfolioAgent,
    holding: PortfolioHolding,
):
    if st.session_state.get("buying") != holding.id:
        return

    st.success(f"Buy More {holding.ticker}")

    quantity = st.number_input(
        "Quantity",
        min_value=1.0,
        step=1.0,
        key=f"buy_qty_{holding.id}",
    )

    buy_price = st.number_input(
        "Buy Price",
        min_value=0.0,
        step=0.01,
        key=f"buy_price_{holding.id}",
    )

    col1, col2 = st.columns(2)

    with col1:

        if st.button(
            "🟢 Buy",
            key=f"confirm_buy_{holding.id}",
        ):

            try:

                agent.buy_stock(
                    ticker=holding.ticker,
                    quantity=quantity,
                    buy_price=buy_price,
                )

                st.session_state["buying"] = None

                st.success("Stock purchased successfully!")

                st.rerun()

            except Exception as e:

                st.error(str(e))

    with col2:

        if st.button(
            "❌ Cancel",
            key=f"cancel_buy_{holding.id}",
        ):

            st.session_state["buying"] = None

            st.rerun()