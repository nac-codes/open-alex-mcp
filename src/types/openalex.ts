/**
 * OpenAlex API TypeScript Types (Minimal version for MCP)
 */

// ============================================================================
// Entity Types
// ============================================================================

export type EntityType =
  | 'works'
  | 'authors'
  | 'sources'
  | 'institutions'
  | 'topics'
  | 'publishers'
  | 'funders'
  | 'keywords'
  | 'geo';

// ============================================================================
// Query Parameters
// ============================================================================

export interface QueryParams {
  filter?: string;
  search?: string;
  sort?: string;
  page?: number;
  per_page?: number;
  cursor?: string;
  select?: string;
  sample?: number;
  seed?: number;
  group_by?: string;
  mailto?: string;
}

// ============================================================================
// Response Types
// ============================================================================

export interface OpenAlexMeta {
  count: number;
  db_response_time_ms: number;
  page: number | null;
  per_page: number;
  next_cursor?: string | null;
  groups_count?: number | null;
}

export interface OpenAlexResponse<T> {
  meta: OpenAlexMeta;
  results: T[];
}

export interface GroupByResult {
  key: string;
  key_display_name: string;
  count: number;
}

export interface GroupByResponse {
  meta: OpenAlexMeta;
  group_by: GroupByResult[];
}
