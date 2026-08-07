import streamlit as st
import plotly.graph_objects as go
import pandas as pd

from app.agents.portfolio_agent import PortfolioAgent
from app.database.portfolio_repository import PortfolioRepository
from ui.components import portfolio_table


def show():
    repository = PortfolioRepository()
    agent = PortfolioAgent(repository)

    st.title("💼 Portfolio")

    # -------------------------
    # Add Holding
    # -------------------------

    st.subheader("Add Holding")

    ticker = st.text_input(
        "Ticker",
        placeholder="Example: TCS"
    )

    quantity = st.number_input(
        "Quantity",
        min_value=1.0,
        step=1.0
    )

    buy_price = st.number_input(
        "Buy Price",
        min_value=0.0,
        step=1.0
    )

    if st.button("Add Holding"):

        if ticker.strip():

            agent.add_holding(
                ticker,
                quantity,
                buy_price,
            )

            st.success("Holding added successfully!")
            st.rerun()

        else:
            st.error("Please enter a ticker.")

    st.divider()

    # -------------------------
    # Portfolio
    # -------------------------

    portfolio = agent.get_holdings()

    if not portfolio:
        st.info("Your portfolio is empty.")
        return

    graph_col1, graph_col2, graph_col3 = st.columns([8, 1.4, 1])

    with graph_col1:
        st.subheader("📊 Portfolio Summary")

    with graph_col2:
        show_graph = st.button(
            "📈 Graph",
            key="summary_graph"
        )

    with graph_col3:
        if st.button(
            "🔄",
            key="summary_refresh"
        ):
            agent.save_portfolio_snapshot()
            st.toast("Portfolio Updated!")
            st.rerun()

    total_holdings = len(portfolio)

    total_invested = sum(
        item["invested"] or 0
        for item in portfolio
    )

    total_current = sum(
        item["current_value"] or 0
        for item in portfolio
    )

    total_profit = total_current - total_invested

    total_return = (
        (total_profit / total_invested) * 100
        if total_invested > 0
        else 0
    )

    c1, c2, c3, c4 = st.columns(4)

    with c1:
        st.metric("Holdings", total_holdings)

    with c2:
        st.metric(
            "Invested",
            f"₹{total_invested:,.2f}"
        )

    with c3:
        st.metric(
            "Current Value",
            f"₹{total_current:,.2f}"
        )

    with c4:
        st.metric(
            "Overall Return",
            f"{total_return:.2f}%",
            f"₹{total_profit:,.2f}"
        )

    st.divider()

    # -------------------------
    # Graph
    # -------------------------

    if show_graph:

        df = pd.DataFrame({
            "Ticker": [
                item["holding"].ticker
                for item in portfolio
            ],
            "Invested": [
                item["invested"]
                for item in portfolio
            ],
            "Current Value": [
                item["current_value"]
                for item in portfolio
            ],
            "Profit": [
                item["profit"]
                for item in portfolio
            ],
        })

        tab1, tab2, tab3 = st.tabs([
            "Portfolio Allocation",
            "Invested vs Current",
            "Profit / Loss",
        ])

        with tab1:

            fig = go.Figure(
                data=[
                    go.Pie(
                        labels=df["Ticker"],
                        values=df["Current Value"],
                        hole=0.45,
                    )
                ]
            )

            fig.update_layout(
                title="Portfolio Allocation"
            )

            st.plotly_chart(
                fig,
                use_container_width=True,
            )

        with tab2:

            fig = go.Figure()

            fig.add_bar(
                name="Invested",
                x=df["Ticker"],
                y=df["Invested"],
            )

            fig.add_bar(
                name="Current Value",
                x=df["Ticker"],
                y=df["Current Value"],
            )

            fig.update_layout(
                barmode="group",
                title="Invested vs Current Value",
                xaxis_title="Stock",
                yaxis_title="Amount (₹)",
            )

            st.plotly_chart(
                fig,
                use_container_width=True,
            )

        with tab3:

            colors = [
                "green" if x >= 0 else "red"
                for x in df["Profit"]
            ]

            fig = go.Figure(
                data=[
                    go.Bar(
                        x=df["Ticker"],
                        y=df["Profit"],
                        marker_color=colors,
                    )
                ]
            )

            fig.update_layout(
                title="Profit / Loss",
                xaxis_title="Stock",
                yaxis_title="Profit (₹)",
            )

            st.plotly_chart(
                fig,
                use_container_width=True,
            )

    st.divider()

    # -------------------------
    # Holdings Table
    # -------------------------

    portfolio_table.show(agent)