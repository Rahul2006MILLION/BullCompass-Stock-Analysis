import streamlit as st

from app.agents.portfolio_agent import PortfolioAgent
from app.models.portfolio import PortfolioHolding


def show(
    agent: PortfolioAgent,
    holding: PortfolioHolding,
):
    if st.session_state.get("selling") != holding.id:
        return

    st.error(f"Sell {holding.ticker}")

    quantity = st.number_input(
        "Quantity",
        min_value=1.0,
        step=1.0,
        key=f"sell_qty_{holding.id}",
    )

    selling_price = st.number_input(
        "Selling Price",
        min_value=0.0,
        step=0.01,
        key=f"sell_price_{holding.id}",
    )

    col1, col2 = st.columns(2)

    with col1:

        if st.button(
            "🔴 Sell",
            key=f"confirm_sell_{holding.id}",
        ):

            try:

                agent.sell_stock(
                    ticker=holding.ticker,
                    quantity=quantity,
                    selling_price=selling_price,
                )

                st.session_state["selling"] = None

                st.success("Stock sold successfully!")

                st.rerun()

            except Exception as e:

                st.error(str(e))

    with col2:

        if st.button(
            "❌ Cancel",
            key=f"cancel_sell_{holding.id}",
        ):

            st.session_state["selling"] = None

            st.rerun()