import streamlit as st

from app.agents.portfolio_agent import PortfolioAgent
from ui.components import buy_holding_dialog
from ui.components import sell_holding_dialog
from ui.components import edit_holding_dialog


def show(agent: PortfolioAgent):

    st.subheader("Your Portfolio")

    portfolio = agent.get_holdings()

    if not portfolio:
        st.info("Your portfolio is empty.")
        return

    for item in portfolio:

        holding = item["holding"]

        st.subheader(holding.ticker)

        col1, col2 = st.columns(2)

        with col1:

            st.write(f"**Quantity** : {holding.quantity}")

            st.write(
                f"**Average Buy Price** : ₹{holding.average_buy_price:.2f}"
            )

            if item["current_price"] is not None:

                st.write(
                    f"**Current Price** : ₹{item['current_price']:.2f}"
                )

            else:

                st.write("**Current Price** : Not Available")

        with col2:

            if item["invested"] is not None:

                st.write(
                    f"**Invested** : ₹{item['invested']:.2f}"
                )

                st.write(
                    f"**Current Value** : ₹{item['current_value']:.2f}"
                )

                if item["profit"] >= 0:

                    st.success(
                        f"Profit : ₹{item['profit']:.2f} ({item['returns']:.2f}%)"
                    )

                else:

                    st.error(
                        f"Loss : ₹{abs(item['profit']):.2f} ({item['returns']:.2f}%)"
                    )

            else:

                st.warning(
                    "Live market data unavailable."
                )

        # ---------------------------------------------------
        # Action Buttons
        # ---------------------------------------------------

        buy_col, sell_col, edit_col, delete_col = st.columns(4)

        with buy_col:

            if st.button(
                "🟢 Buy",
                key=f"buy_{holding.id}",
            ):
                st.session_state["buying"] = holding.id

        with sell_col:

            if st.button(
                "🔴 Sell",
                key=f"sell_{holding.id}",
            ):
                st.session_state["selling"] = holding.id

        with edit_col:

            if st.button(
                "✏️ Edit",
                key=f"edit_{holding.id}",
            ):
                st.session_state["editing"] = holding.id

        with delete_col:

            if st.button(
                "🗑 Delete",
                key=f"delete_{holding.id}",
            ):

                agent.delete_holding(holding.id)

                agent.save_portfolio_snapshot()

                st.success(
                    f"{holding.ticker} deleted successfully."
                )

                st.rerun()

        # ---------------------------------------------------
        # Dialogs
        # ---------------------------------------------------

        buy_holding_dialog.show(
            agent,
            holding,
        )

        sell_holding_dialog.show(
            agent,
            holding,
        )

        edit_holding_dialog.show(
            agent,
            holding,
        )

        st.divider()