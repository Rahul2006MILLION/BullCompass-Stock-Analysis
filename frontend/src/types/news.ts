export interface EntityExposure {
  ticker?: string | null;
  sector?: string | null;
  entity_type: string;
  exposure_type: string;
  sentiment_hint: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary?: string | null;
  source: string;
  source_url?: string | null;
  published_at: string;
  fetched_at: string;
  category: string;
  subcategory?: string | null;
  importance: "HIGH" | "MEDIUM" | "LOW" | string;
  raw_content?: string | null;
  entities: EntityExposure[];
}

export interface NewsListResponse {
  total: number;
  news: NewsItem[];
}

export interface NewsMetadataResponse {
  sources: string[];
  categories: string[];
  total_count: number;
}

export interface NewsSyncResponse {
  status: string;
  inserted_count: number;
  message: string;
}

export interface NewsFilterParams {
  category?: string;
  importance?: string;
  source?: string;
  search?: string;
  ticker?: string;
  company?: string;
  limit?: number;
  offset?: number;
}
