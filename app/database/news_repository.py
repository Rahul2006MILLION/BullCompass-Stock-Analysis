from typing import List, Optional, Tuple
from app.database.database import Database
from app.models.news import NewsItem, EntityExposure, ExposureType, SentimentHint


class NewsRepository:
    def __init__(self):
        self.db = Database()

    def save_news_batch(self, items: List[NewsItem]) -> int:
        """
        Insert or ignore a batch of news items using unique SHA-256 id.
        Returns count of newly inserted articles.
        """
        cursor = self.db.connection.cursor()
        inserted_count = 0

        for item in items:
            cursor.execute(
                """
                INSERT OR IGNORE INTO news_articles (
                    id, title, summary, source, source_url, published_at,
                    fetched_at, category, subcategory, importance, raw_content
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    item.id,
                    item.title,
                    item.summary,
                    item.source,
                    item.source_url,
                    item.published_at,
                    item.fetched_at,
                    item.category,
                    item.subcategory,
                    item.importance,
                    item.raw_content,
                ),
            )
            if cursor.rowcount > 0:
                inserted_count += 1

                # Save associated entity tags if any
                for entity in item.entities:
                    cursor.execute(
                        """
                        INSERT INTO news_entities (
                            news_id, ticker, sector, entity_type, exposure_type, sentiment_hint
                        )
                        VALUES (?, ?, ?, ?, ?, ?)
                        """,
                        (
                            item.id,
                            entity.ticker,
                            entity.sector,
                            entity.entity_type,
                            entity.exposure_type.value if hasattr(entity.exposure_type, "value") else str(entity.exposure_type),
                            entity.sentiment_hint.value if hasattr(entity.sentiment_hint, "value") else str(entity.sentiment_hint),
                        ),
                    )

        self.db.connection.commit()
        return inserted_count

    def get_recent_news(
        self,
        limit: int = 50,
        category: Optional[str] = None,
        importance: Optional[str] = None,
    ) -> List[NewsItem]:
        cursor = self.db.connection.cursor()

        query = "SELECT id, title, summary, source, source_url, published_at, fetched_at, category, subcategory, importance, raw_content FROM news_articles"
        params = []
        conditions = []

        if category and category.upper() != "ALL":
            conditions.append("category = ?")
            params.append(category)

        if importance and importance.upper() != "ALL":
            conditions.append("importance = ?")
            params.append(importance)

        if conditions:
            query += " WHERE " + " AND ".join(conditions)

        query += " ORDER BY published_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, tuple(params))
        rows = cursor.fetchall()

        news_items = []
        for r in rows:
            news_items.append(
                NewsItem(
                    id=r[0],
                    title=r[1],
                    summary=r[2],
                    source=r[3],
                    source_url=r[4],
                    published_at=r[5],
                    fetched_at=r[6],
                    category=r[7],
                    subcategory=r[8],
                    importance=r[9],
                    raw_content=r[10],
                    entities=[],
                )
            )

        return news_items

    def get_news_by_id(self, news_id: str) -> Optional[NewsItem]:
        cursor = self.db.connection.cursor()
        cursor.execute(
            """
            SELECT id, title, summary, source, source_url, published_at, fetched_at, category, subcategory, importance, raw_content
            FROM news_articles
            WHERE id = ?
            """,
            (news_id,),
        )
        r = cursor.fetchone()
        if not r:
            return None

        # Fetch entities
        cursor.execute(
            """
            SELECT ticker, sector, entity_type, exposure_type, sentiment_hint
            FROM news_entities
            WHERE news_id = ?
            """,
            (news_id,),
        )
        e_rows = cursor.fetchall()
        entities = [
            EntityExposure(
                ticker=er[0],
                sector=er[1],
                entity_type=er[2],
                exposure_type=ExposureType(er[3]) if er[3] in ExposureType._value2member_map_ else ExposureType.DIRECT,
                sentiment_hint=SentimentHint(er[4]) if er[4] in SentimentHint._value2member_map_ else SentimentHint.NEUTRAL,
            )
            for er in e_rows
        ]

        return NewsItem(
            id=r[0],
            title=r[1],
            summary=r[2],
            source=r[3],
            source_url=r[4],
            published_at=r[5],
            fetched_at=r[6],
            category=r[7],
            subcategory=r[8],
            importance=r[9],
            raw_content=r[10],
            entities=entities,
        )

    def get_news_count(self) -> int:
        cursor = self.db.connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM news_articles")
        return cursor.fetchone()[0]
